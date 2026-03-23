import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['SUPERADMIN', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { id } = await params
  const { searchParams } = req.nextUrl
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const type  = searchParams.get('type') ?? 'enregistrements'

  const start       = new Date(year, month - 1, 1)
  const end         = new Date(year, month, 1)
  const daysInMonth = new Date(year, month, 0).getDate()

  const parJour = Array.from({ length: daysInMonth }, (_, i) => ({ jour: i + 1, count: 0 }))

  if (type === 'patients') {
    const patients = await prisma.patient.findMany({
      where: { creeParId: id, createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    })
    patients.forEach(p => { parJour[p.createdAt.getDate() - 1].count++ })
  } else {
    // enregistrements
    const enregistrements = await prisma.enregistrementMedical.findMany({
      where: { userId: id, createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    })
    enregistrements.forEach(e => { parJour[e.createdAt.getDate() - 1].count++ })
  }

  return NextResponse.json({ data: parJour })
}
