import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'
import { z } from 'zod'
import { SessionUser } from '@/types'

const creerRoleSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser

  const where =
    user.niveauAcces === 'ADMIN_CENTRE'
      ? { OR: [{ creePar: 'MINISTERE' as const }, { centreId: user.centreActif }] }
      : user.niveauAcces === 'PERSONNEL'
      ? { creePar: 'MINISTERE' as const }
      : {}

  const roles = await prisma.role.findMany({
    where,
    include: {
      permissions: { include: { permission: { select: { code: true, description: true } } } },
      _count: { select: { utilisateurs: true } },
    },
  })

  return NextResponse.json({ roles })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const validation = creerRoleSchema.safeParse(body)
  if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const role = await prisma.role.create({
    data: {
      nom: validation.data.nom,
      description: validation.data.description,
      creePar: user.niveauAcces === 'MINISTERE' ? 'MINISTERE' : 'CENTRE',
      centreId: user.niveauAcces === 'ADMIN_CENTRE' ? user.centreActif : null,
      permissions: validation.data.permissions.length > 0
        ? { create: validation.data.permissions.map((pid) => ({ permissionId: pid })) }
        : undefined,
    },
    include: { permissions: { include: { permission: { select: { code: true, description: true } } } } },
  })

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: user.id,
    action: 'CREATION_ROLE',
    cible: 'Role',
    cibleId: role.id,
    centreId: user.centreActif,
    details: { nom: role.nom },
    ip, userAgent,
  })

  return NextResponse.json({ role }, { status: 201 })
}
