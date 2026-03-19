import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  nom: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const types = await prisma.typePersonnel.findMany({
    where: { estActif: true },
    orderBy: { nom: 'asc' },
    include: { _count: { select: { utilisateurs: true } } },
  })

  return NextResponse.json({ types })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'MINISTERE') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  const body = await req.json()
  const validation = schema.safeParse(body)
  if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const type = await prisma.typePersonnel.create({
    data: { ...validation.data, code: validation.data.code.toUpperCase() },
  })

  return NextResponse.json({ type }, { status: 201 })
}
