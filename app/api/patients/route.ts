import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { genererTokenQR } from '@/lib/qrcode'
import { logger, getRequestInfo } from '@/lib/logger'
import { z } from 'zod'

const personneUrgenceSchema = z.object({
  nom: z.string().min(1),
  prenoms: z.string().min(1),
  telephone: z.string().min(1),
  adresse: z.string().min(1),
  relation: z.string().min(1),
})

const creerPatientSchema = z.object({
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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const recherche = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where = recherche
    ? {
        OR: [
          { nom: { contains: recherche, mode: 'insensitive' as const } },
          { prenoms: { contains: recherche, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        creePar: { select: { nom: true, prenoms: true } },
        centreCreation: { select: { nom: true } },
      },
    }),
    prisma.patient.count({ where }),
  ])

  return NextResponse.json({ patients, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const validation = creerPatientSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { personnesUrgence, dateNaissance, email, telephone, numeroCNI, ...rest } = validation.data
  const token = genererTokenQR()
  const centreActifId = (session.user as { centreActif?: string }).centreActif
  const now = new Date()
  const qrAccesExpireAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const patient = await prisma.patient.create({
    data: {
      ...rest,
      dateNaissance: new Date(dateNaissance),
      email: email || null,
      telephone: telephone || null,
      numeroCNI: numeroCNI || null,
      qrToken: token,
      qrGeneratedAt: now,
      qrAccesExpireAt,
      creeParId: session.user.id!,
      centreCreationId: centreActifId!,
      personnesUrgence: { create: personnesUrgence },
      dossier: { create: {} },
    },
    include: { dossier: true },
  })

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'CREATION_PATIENT',
    cible: 'Patient',
    cibleId: patient.id,
    centreId: centreActifId,
    details: { nom: patient.nom, prenoms: patient.prenoms },
    ip,
    userAgent,
  })

  return NextResponse.json({ patient, dossierId: patient.dossier?.id }, { status: 201 })
}
