import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const centreId = user.centreActif
  if (!centreId) return NextResponse.json({ error: 'Aucun centre actif' }, { status: 400 })

  const { searchParams } = req.nextUrl
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const daysInMonth = new Date(year, month, 0).getDate()

  const factures = await prisma.facture.findMany({
    where: {
      centreId,
      periodeDebut: { gte: start, lt: end },
    },
    select: { periodeDebut: true, montantDu: true },
  })

  // Agrégation par jour (basée sur periodeDebut)
  const parJour = Array.from({ length: daysInMonth }, (_, i) => ({ jour: i + 1, montant: 0 }))
  factures.forEach(f => {
    const day = new Date(f.periodeDebut).getDate()
    if (day >= 1 && day <= daysInMonth) {
      parJour[day - 1].montant += f.montantDu
    }
  })

  const totalMois = factures.reduce((s, f) => s + f.montantDu, 0)

  return NextResponse.json({ parJour, totalMois })
}
