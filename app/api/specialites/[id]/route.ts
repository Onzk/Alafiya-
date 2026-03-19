import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const patchSchema = z.object({
  nom: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  estActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'MINISTERE') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  const body = await req.json()
  const validation = patchSchema.safeParse(body)
  if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const data = { ...validation.data }
  if (data.code) data.code = data.code.toUpperCase()

  const specialite = await prisma.specialite.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json({ specialite })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'MINISTERE') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  await prisma.specialite.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
