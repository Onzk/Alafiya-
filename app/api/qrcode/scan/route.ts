import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  const patient = await prisma.patient.findUnique({
    where: { qrToken: token },
    select: {
      id: true,
      nom: true,
      prenoms: true,
      genre: true,
      dateNaissance: true,
      telephone: true,
      dossier: { select: { id: true } },
    },
  })

  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

  const { ip, userAgent } = getRequestInfo(req)
  const centreId = (session.user as { centreActif?: string }).centreActif

  // Créer un accès dossier d'1h si le patient a un dossier
  if (patient.dossier?.id && centreId) {
    const debutAcces = new Date()
    const finAcces = new Date(debutAcces.getTime() + 60 * 60 * 1000)
    await prisma.accesDossier.create({
      data: {
        dossierId: patient.dossier.id,
        medecinId: session.user.id!,
        centreId,
        debutAcces,
        finAcces,
        modeUrgence: false,
      },
    })
    await logger({
      userId: session.user.id,
      action: 'ACCES_DOSSIER',
      cible: 'DossierMedical',
      cibleId: patient.dossier.id,
      centreId,
      details: { modeUrgence: false, finAcces, viaQR: true },
      ip,
      userAgent,
    })
  }

  await logger({
    userId: session.user.id,
    action: 'SCAN_QR',
    cible: 'Patient',
    cibleId: patient.id,
    centreId,
    details: { token },
    ip,
    userAgent,
  })

  return NextResponse.json({
    patient: {
      id: patient.id,
      nom: patient.nom,
      prenoms: patient.prenoms,
      genre: patient.genre,
      dateNaissance: patient.dateNaissance,
      aTelephone: !!patient.telephone,
      dossierId: patient.dossier?.id,
    },
  })
}
