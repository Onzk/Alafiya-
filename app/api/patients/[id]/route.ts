import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'
import { z } from 'zod'
import { SessionUser } from '@/types'

const personneUrgenceSchema = z.object({
  nom: z.string().min(1),
  prenoms: z.string().min(1),
  telephone: z.string().min(1),
  adresse: z.string().min(1),
  relation: z.string().min(1),
})

const modifierPatientSchema = z.object({
  nom: z.string().min(1),
  prenoms: z.string().min(1),
  genre: z.enum(['M', 'F']),
  dateNaissance: z.string(),
  dateNaissancePresumee: z.boolean().default(false),
  adresse: z.string().min(1),
  telephone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  numeroCNI: z.string().optional(),
  personnesUrgence: z.array(personneUrgenceSchema).min(1).max(3),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      creePar: { select: { nom: true, prenoms: true } },
      centreCreation: { select: { nom: true } },
      dossier: { select: { id: true } },
      personnesUrgence: true,
    },
  })

  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

  return NextResponse.json({ patient })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser

  // Verify access: SUPERADMIN or valid QR scan
  if (user.niveauAcces !== 'SUPERADMIN') {
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      select: { dossier: { select: { id: true } } },
    })
    if (!patient?.dossier) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

    const accesValide = await prisma.accesDossier.findFirst({
      where: { dossierId: patient.dossier.id, medecinId: user.id, finAcces: { gt: new Date() } },
    })
    if (!accesValide) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const validation = modifierPatientSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { personnesUrgence, dateNaissance, email, telephone, numeroCNI, ...rest } = validation.data

  const patient = await prisma.patient.update({
    where: { id: params.id },
    data: {
      ...rest,
      dateNaissance: new Date(dateNaissance),
      email: email || null,
      telephone: telephone || null,
      numeroCNI: numeroCNI || null,
      personnesUrgence: {
        deleteMany: {},
        create: personnesUrgence,
      },
    },
  })

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'MODIFICATION_PATIENT',
    cible: 'Patient',
    cibleId: patient.id,
    centreId: (session.user as { centreActif?: string }).centreActif,
    details: { nom: patient.nom, prenoms: patient.prenoms },
    ip,
    userAgent,
  })

  return NextResponse.json({ patient })
}
