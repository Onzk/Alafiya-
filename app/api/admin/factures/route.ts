export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const user = session.user as unknown as SessionUser
    if (user.niveauAcces !== 'ADMIN_CENTRE') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const centreId = user.centreActif
    if (!centreId) return NextResponse.json({ error: 'Aucun centre actif' }, { status: 400 })

    const [factures, centre] = await Promise.all([
      prisma.facture.findMany({
        where: { centreId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.centre.findUnique({ where: { id: centreId }, select: { nom: true } }),
    ])

    const factureEnCours = factures.find(
      (f) => f.statut === 'EN_ATTENTE' || f.statut === 'EN_RETARD'
    ) ?? null

    const soldeImpaye = factures
      .filter((f) => f.statut === 'EN_ATTENTE' || f.statut === 'EN_RETARD')
      .reduce((s, f) => s + f.montantDu, 0)

    const totalPaye = factures
      .filter((f) => f.statut === 'PAYE')
      .reduce((s, f) => s + f.montantDu, 0)

    return NextResponse.json({
      factures,
      centreName: centre?.nom ?? '',
      stats: {
        montantEnCours: factureEnCours?.montantDu ?? 0,
        soldeImpaye,
        totalPaye,
        nbFactures: factures.length,
      },
    })
  } catch (e) {
    console.error('[GET /api/admin/factures]', e)
    return NextResponse.json({ error: 'Erreur serveur', factures: [], stats: null }, { status: 500 })
  }
}
