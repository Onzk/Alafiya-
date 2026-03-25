import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'
import { z } from 'zod'
import { SessionUser } from '@/types'

const creerEnregistrementSchema = z.object({
  specialiteId: z.string().min(1),
  antecedents: z.string().optional(),
  signes: z.string().optional(),
  examens: z.string().optional(),
  bilan: z.string().optional(),
  traitements: z.object({
    conseils: z.string().optional(),
    injections: z.string().optional(),
    ordonnance: z.string().optional(),
  }).optional(),
  suivi: z.string().optional(),
  audioTranscriptionBrute: z.string().optional(),
  genereParIA: z.boolean().default(false),
  statut: z.enum(['EN_COURS', 'TERMINEE', 'REPORTEE']).default('EN_COURS'),
  causeReport: z.string().optional(),
  dateProchainRdv: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
})

async function verifierAcces(dossierId: string, userId: string, niveauAcces: string): Promise<boolean> {
  if (niveauAcces === 'SUPERADMIN') return true
  const acces = await prisma.accesDossier.findFirst({
    where: { dossierId, medecinId: userId, finAcces: { gt: new Date() } },
  })
  return !!acces
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const accesOk = await verifierAcces(params.id, user.id!, user.niveauAcces)
  if (!accesOk) return NextResponse.json({ error: 'Accès expiré ou non autorisé' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const specialiteId = searchParams.get('specialite')

  if (specialiteId) {
    const enregistrements = await prisma.enregistrementMedical.findMany({
      where: { dossierId: params.id, specialiteId },
      include: {
        medecin: { select: { nom: true, prenoms: true } },
        centre: { select: { nom: true } },
        specialite: { select: { nom: true, code: true } },
      },
      orderBy: { dateConsultation: 'desc' },
    })
    return NextResponse.json({ enregistrements })
  }

  const dossier = await prisma.dossierMedical.findUnique({
    where: { id: params.id },
    include: {
      enregistrements: {
        include: { specialite: { select: { id: true, nom: true, code: true } } },
        orderBy: { dateConsultation: 'desc' },
      },
      accesEnCours: { where: { finAcces: { gt: new Date() } } },
    },
  })

  if (!dossier) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

  return NextResponse.json({ dossier })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const accesOk = await verifierAcces(params.id, user.id!, user.niveauAcces)
  if (!accesOk) return NextResponse.json({ error: 'Accès expiré ou non autorisé' }, { status: 403 })

  const body = await req.json()
  const validation = creerEnregistrementSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { traitements, ...rest } = validation.data

  // Validation sous-consultation
  if (rest.parentId) {
    const parent = await prisma.enregistrementMedical.findUnique({
      where: { id: rest.parentId },
      select: { dossierId: true, parentId: true, statut: true },
    })
    if (!parent || parent.dossierId !== params.id)
      return NextResponse.json({ error: 'Consultation parente introuvable.' }, { status: 404 })
    if (parent.parentId)
      return NextResponse.json({ error: 'Impossible de créer une sous-consultation d\'une sous-consultation.' }, { status: 400 })
    if (parent.statut === 'TERMINEE')
      return NextResponse.json({ error: 'Impossible d\'ajouter une sous-consultation à une consultation terminée.' }, { status: 400 })
  }

  const finalStatut = rest.parentId ? 'TERMINEE' : rest.statut

  const enregistrement = await prisma.enregistrementMedical.create({
    data: {
      dossierId: params.id,
      specialiteId: rest.specialiteId,
      medecinId: user.id!,
      centreId: user.centreActif!,
      antecedents: rest.antecedents,
      signes: rest.signes,
      examens: rest.examens,
      bilan: rest.bilan,
      traitConseils: traitements?.conseils,
      traitInjections: traitements?.injections,
      traitOrdonnance: traitements?.ordonnance,
      suivi: rest.suivi,
      audioTranscriptionBrute: rest.audioTranscriptionBrute,
      genereParIA: rest.genereParIA,
      valideParMedecin: true,
      statut: finalStatut,
      causeReport: finalStatut === 'REPORTEE' ? (rest.causeReport ?? null) : null,
      dateProchainRdv: finalStatut === 'REPORTEE' && rest.dateProchainRdv
        ? new Date(rest.dateProchainRdv)
        : null,
      parentId: rest.parentId ?? null,
    },
  })

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: user.id,
    action: 'MODIFICATION_DOSSIER',
    cible: 'DossierMedical',
    cibleId: params.id,
    centreId: user.centreActif,
    details: { enregistrementId: enregistrement.id, specialiteId: rest.specialiteId },
    ip,
    userAgent,
  })

  return NextResponse.json({ enregistrement }, { status: 201 })
}
