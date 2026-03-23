import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['SUPERADMIN', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 50
  const skip = (page - 1) * limit

  const where = user.niveauAcces === 'ADMIN_CENTRE' ? { centreId: user.centreActif } : {}

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      include: {
        user: { select: { nom: true, prenoms: true, email: true } },
        centre: { select: { nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.log.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
}
