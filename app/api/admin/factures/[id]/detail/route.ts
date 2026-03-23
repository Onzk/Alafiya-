import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const user = session.user as unknown as SessionUser
    if (user.niveauAcces !== 'ADMIN_CENTRE') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const centreId = user.centreActif
    if (!centreId) return NextResponse.json({ error: 'Aucun centre actif' }, { status: 400 })

    const facture = await prisma.facture.findUnique({ where: { id: params.id } })
    if (!facture || facture.centreId !== centreId) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    // Patients (= carnets) créés dans le centre pendant la période facturée
    const patients = await prisma.patient.findMany({
      where: {
        centreCreationId: centreId,
        createdAt: { gte: facture.periodeDebut, lte: facture.periodeFin },
      },
      select: {
        id: true,
        nom: true,
        prenoms: true,
        createdAt: true,
        creePar: { select: { id: true, nom: true, prenoms: true } },
      },
    })

    // Grouper par agent créateur
    const parAgent: Record<
      string,
      { agent: { id: string; nom: string; prenoms: string }; count: number }
    > = {}

    for (const p of patients) {
      if (!parAgent[p.creeParId]) {
        parAgent[p.creeParId] = { agent: p.creePar, count: 0 }
      }
      parAgent[p.creeParId].count++
    }

    const detail = Object.values(parAgent).sort((a, b) => b.count - a.count)

    return NextResponse.json({ detail, totalCarnets: patients.length })
  } catch (e) {
    console.error('[GET /api/admin/factures/[id]/detail]', e)
    return NextResponse.json({ error: 'Erreur serveur', detail: [], totalCarnets: 0 }, { status: 500 })
  }
}
