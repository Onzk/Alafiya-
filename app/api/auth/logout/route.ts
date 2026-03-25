import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ ok: true })

  const user = session.user as unknown as SessionUser

  await prisma.accesDossier.updateMany({
    where: {
      medecinId: user.id,
      finAcces: { gt: new Date() },
    },
    data: { finAcces: new Date() },
  })

  return NextResponse.json({ ok: true })
}
