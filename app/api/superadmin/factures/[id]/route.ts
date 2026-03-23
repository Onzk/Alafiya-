import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'SUPERADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { statut } = body

  const updateData: Record<string, unknown> = { statut }
  if (statut === 'PAYE') {
    updateData.dateReglement = new Date()
  }

  const facture = await prisma.facture.update({
    where: { id: params.id },
    data: updateData,
    include: { centre: { select: { nom: true, region: true, prefecture: true, type: true } } },
  })

  return NextResponse.json({ facture })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'SUPERADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await prisma.facture.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
