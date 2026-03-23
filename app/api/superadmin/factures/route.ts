import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET() {
  try {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'SUPERADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const factures = await prisma.facture.findMany({
    include: {
      centre: { select: { nom: true, region: true, prefecture: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1)
  const debutAnnee = new Date(now.getFullYear(), 0, 1)

  const revenusMoisCourant = factures
    .filter((f) => f.statut === 'PAYE' && f.dateReglement && f.dateReglement >= debutMois)
    .reduce((s, f) => s + f.montantDu, 0)

  const revenusEnAttente = factures
    .filter((f) => f.statut === 'EN_ATTENTE' || f.statut === 'EN_RETARD')
    .reduce((s, f) => s + f.montantDu, 0)

  const revenusYTD = factures
    .filter((f) => f.statut === 'PAYE' && f.dateReglement && f.dateReglement >= debutAnnee)
    .reduce((s, f) => s + f.montantDu, 0)

  const totalCarnetsFactures = factures.reduce((s, f) => s + f.nbCarnetsCrees + f.nbCarnetsRenouv, 0)

  // Monthly revenue for the last 12 months (for chart)
  const chartData: { mois: string; revenus: number; label: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const total = factures
      .filter((f) => f.statut === 'PAYE' && f.dateReglement && f.dateReglement >= d && f.dateReglement < fin)
      .reduce((s, f) => s + f.montantDu, 0)
    const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    chartData.push({ mois: `${MOIS[d.getMonth()]} ${d.getFullYear()}`, revenus: total, label: MOIS[d.getMonth()] })
  }

  return NextResponse.json({
    factures,
    stats: { revenusMoisCourant, revenusEnAttente, revenusYTD, totalCarnetsFactures },
    chartData,
  })
  } catch (e) {
    console.error('[GET /api/superadmin/factures]', e)
    return NextResponse.json({ error: 'Erreur serveur', factures: [], stats: null, chartData: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'SUPERADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { centreId, periodeDebut, periodeFin, nbCarnetsCrees, nbCarnetsRenouv, montantDu } = body

  if (!centreId || !periodeDebut || !periodeFin) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const count = await prisma.facture.count()
  const numero = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const facture = await prisma.facture.create({
    data: {
      numero,
      centreId,
      periodeDebut: new Date(periodeDebut),
      periodeFin: new Date(periodeFin),
      nbCarnetsCrees: nbCarnetsCrees || 0,
      nbCarnetsRenouv: nbCarnetsRenouv || 0,
      montantDu: montantDu || 0,
      statut: 'EN_ATTENTE',
    },
    include: { centre: { select: { nom: true, region: true, prefecture: true, type: true } } },
  })

  return NextResponse.json({ facture }, { status: 201 })
}
