import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { z } from 'zod'

const schema = z.object({
  mobileMoney:  z.string().min(1),
  mobileNumero: z.string().min(1),
  mobileNom:    z.string().min(1),
  virementInfo: z.string().min(1),
  contactEmail: z.string().email(),
  contactTel:   z.string().min(1),
  noteFacture:  z.string().min(1),
})

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'SUPERADMIN') return null
  return user
}

export async function GET() {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const config = await prisma.configuration.upsert({
    where:  { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const config = await prisma.configuration.upsert({
    where:  { id: 'singleton' },
    update: parsed.data,
    create: { id: 'singleton', ...parsed.data },
  })

  return NextResponse.json(config)
}
