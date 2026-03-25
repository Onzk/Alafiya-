import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { SessionUser } from '@/types'

const patchSchema = z.object({
  statut: z.enum(['EN_COURS', 'TERMINEE', 'REPORTEE']).optional(),
  causeReport: z.string().optional().nullable(),
  dateProchainRdv: z.string().optional().nullable(),
  // Champs contenu (modifiables uniquement si statut EN_COURS)
  antecedents: z.string().optional().nullable(),
  signes: z.string().optional().nullable(),
  examens: z.string().optional().nullable(),
  bilan: z.string().optional().nullable(),
  traitConseils: z.string().optional().nullable(),
  traitInjections: z.string().optional().nullable(),
  traitOrdonnance: z.string().optional().nullable(),
  suivi: z.string().optional().nullable(),
})

async function verifierAcces(dossierId: string, userId: string, niveauAcces: string): Promise<boolean> {
  if (niveauAcces === 'SUPERADMIN') return true
  const acces = await prisma.accesDossier.findFirst({
    where: { dossierId, medecinId: userId, finAcces: { gt: new Date() } },
  })
  return !!acces
}

export async function PATCH(req: NextRequest, { params }: { params: { enrId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser

  const enr = await prisma.enregistrementMedical.findUnique({
    where: { id: params.enrId },
    select: { id: true, statut: true, dossierId: true },
  })

  if (!enr) return NextResponse.json({ error: 'Consultation introuvable' }, { status: 404 })

  const accesOk = await verifierAcces(enr.dossierId, user.id!, user.niveauAcces)
  if (!accesOk) return NextResponse.json({ error: 'Accès expiré ou non autorisé' }, { status: 403 })

  const body = await req.json()
  const validation = patchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const {
    statut,
    causeReport,
    dateProchainRdv,
    antecedents,
    signes,
    examens,
    bilan,
    traitConseils,
    traitInjections,
    traitOrdonnance,
    suivi,
  } = validation.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {}

  if (statut !== undefined) {
    updateData.statut = statut
    if (statut !== 'REPORTEE') {
      updateData.causeReport = null
      updateData.dateProchainRdv = null
    }
  }

  if (causeReport !== undefined) updateData.causeReport = causeReport
  if (dateProchainRdv !== undefined) {
    updateData.dateProchainRdv = dateProchainRdv ? new Date(dateProchainRdv) : null
  }

  // Le contenu n'est modifiable que si la consultation est EN_COURS
  if (enr.statut === 'EN_COURS') {
    if (antecedents !== undefined)    updateData.antecedents    = antecedents    || null
    if (signes !== undefined)         updateData.signes         = signes         || null
    if (examens !== undefined)        updateData.examens        = examens        || null
    if (bilan !== undefined)          updateData.bilan          = bilan          || null
    if (traitConseils !== undefined)  updateData.traitConseils  = traitConseils  || null
    if (traitInjections !== undefined)updateData.traitInjections= traitInjections|| null
    if (traitOrdonnance !== undefined)updateData.traitOrdonnance= traitOrdonnance|| null
    if (suivi !== undefined)          updateData.suivi          = suivi          || null
  }

  const updated = await prisma.enregistrementMedical.update({
    where: { id: params.enrId },
    data: updateData,
  })

  return NextResponse.json({ enregistrement: updated })
}
