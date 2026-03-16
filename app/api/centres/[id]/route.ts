import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const centre = await prisma.centre.findUnique({
    where: { id: params.id },
    include: { admin: { select: { nom: true, prenoms: true, email: true } } },
  })

  if (!centre) return NextResponse.json({ error: 'Centre introuvable' }, { status: 404 })

  return NextResponse.json({ centre })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'MINISTERE') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  const body = await req.json()

  const centre = await prisma.centre.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json({ centre })
}
