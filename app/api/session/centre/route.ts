import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { centreId } = await req.json()
  if (!centreId) return NextResponse.json({ error: 'centreId requis' }, { status: 400 })

  const user = session.user as unknown as SessionUser

  // Vérifier appartenance (sauf Ministère)
  if (user.niveauAcces !== 'MINISTERE') {
    const appartient = await prisma.userCentre.findUnique({
      where: { userId_centreId: { userId: user.id!, centreId } },
    })
    if (!appartient) return NextResponse.json({ error: 'Centre non autorisé' }, { status: 403 })
  }

  await prisma.user.update({
    where: { id: user.id! },
    data: { centreActifId: centreId },
  })

  return NextResponse.json({ message: 'Centre actif mis à jour' })
}
