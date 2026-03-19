import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const { estActif } = body

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { estActif },
    select: { id: true, estActif: true },
  })

  return NextResponse.json({ utilisateur: updated })
}
