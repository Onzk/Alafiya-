import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'SUPERADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const daysInMonth = new Date(year, month, 0).getDate()

  const enregistrementsParJour = Array.from({ length: daysInMonth }, (_, i) => ({ jour: i + 1, count: 0 }))
  const dossiersParJour = Array.from({ length: daysInMonth }, (_, i) => ({ jour: i + 1, count: 0 }))

  const [enregistrements, dossiers] = await Promise.all([
    prisma.enregistrementMedical.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    }),
    prisma.dossierMedical.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    }),
  ])

  enregistrements.forEach(e => { enregistrementsParJour[e.createdAt.getDate() - 1].count++ })
  dossiers.forEach(d => { dossiersParJour[d.createdAt.getDate() - 1].count++ })

  return NextResponse.json({ enregistrements: enregistrementsParJour, dossiers: dossiersParJour })
}
