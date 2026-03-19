import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { SessionUser } from '@/types'

const patchSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const validation = patchSchema.safeParse(body)
  if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { nom, description, permissions } = validation.data

  const role = await prisma.role.update({
    where: { id: params.id },
    data: {
      ...(nom !== undefined && { nom }),
      ...(description !== undefined && { description }),
      ...(permissions !== undefined && {
        permissions: {
          deleteMany: {},
          create: permissions.map((pid) => ({ permissionId: pid })),
        },
      }),
    },
    include: { permissions: { include: { permission: { select: { code: true, description: true } } } } },
  })

  return NextResponse.json({ role })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.role.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
