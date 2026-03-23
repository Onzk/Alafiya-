import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const creerSpecialiteSchema = z.object({
  nom: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const specialites = await prisma.specialite.findMany({
    orderBy: { nom: 'asc' },
    include: { _count: { select: { userSpecialites: true } } },
  })

  return NextResponse.json({ specialites })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  const body = await req.json()
  const validation = creerSpecialiteSchema.safeParse(body)
  if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const specialite = await prisma.specialite.create({
    data: { ...validation.data, code: validation.data.code.toUpperCase(), estActive: true },
  })

  return NextResponse.json({ specialite }, { status: 201 })
}
