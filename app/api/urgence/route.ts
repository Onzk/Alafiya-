import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { envoyerSMS, messageUrgence } from '@/lib/afriksms'
import { logger, getRequestInfo } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const {
    patientId,
    dossierId,
    justification,
    signatureMedecin,
    justifieParNom,
    justifieParTel,
    justifieParSignature,
    justifieParType,
  } = await req.json()

  if (!patientId || !dossierId || !justification?.trim()) {
    return NextResponse.json({ error: 'Données manquantes ou justification vide' }, { status: 400 })
  }

  const centreId = (session.user as { centreActif?: string }).centreActif!

  const [patient, medecin, centre] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patientId },
      select: { nom: true, prenoms: true, personnesUrgence: { select: { telephone: true } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { nom: true, prenoms: true },
    }),
    prisma.centre.findUnique({
      where: { id: centreId },
      select: { nom: true },
    }),
  ])

  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

  const accesUrgence = await prisma.accesUrgence.create({
    data: {
      patientId,
      medecinId: session.user.id!,
      centreId,
      justification,
      signatureMedecin: signatureMedecin ?? null,
      justifieParNom: justifieParNom ?? null,
      justifieParTel: justifieParTel ?? null,
      justifieParSignature: justifieParSignature ?? null,
      justifieParType: justifieParType ?? null,
    },
  })

  const debutAcces = new Date()
  const finAcces = new Date(debutAcces.getTime() + 60 * 60 * 1000)

  await prisma.accesDossier.create({
    data: {
      dossierId,
      medecinId: session.user.id!,
      centreId,
      debutAcces,
      finAcces,
      modeUrgence: true,
    },
  })

  if (patient.personnesUrgence.length > 0) {
    const nomMedecin = medecin ? `${medecin.nom} ${medecin.prenoms}` : 'Un professionnel de santé'
    const nomCentre = centre?.nom ?? 'un établissement de santé'
    const msg = messageUrgence(`${patient.nom} ${patient.prenoms}`, nomMedecin, nomCentre, justification)
    await Promise.all(patient.personnesUrgence.map((p) => envoyerSMS(p.telephone, msg)))
  }

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'URGENCE_ACTIVATION',
    cible: 'Patient',
    cibleId: patientId,
    centreId,
    details: { dossierId, justification, accesUrgenceId: accesUrgence.id },
    ip,
    userAgent,
  })

  return NextResponse.json({ acces: true, finAcces, accesUrgenceId: accesUrgence.id })
}
