import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { SessionUser } from '@/types'

const creerUtilisateurSchema = z.object({
  nom: z.string().min(1),
  prenoms: z.string().min(1),
  email: z.string().email(),
  motDePasse: z.string().min(8),
  telephone: z.string().optional(),
  roleId: z.string().optional(),
  specialites: z.array(z.string()).default([]),
  niveauAcces: z.enum(['ADMIN_CENTRE', 'PERSONNEL']),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser

  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const where = user.niveauAcces === 'ADMIN_CENTRE'
    ? { centres: { some: { centreId: user.centreActif } } }
    : {}

  const utilisateurs = await prisma.user.findMany({
    where,
    select: {
      id: true, nom: true, prenoms: true, email: true, telephone: true,
      niveauAcces: true, estActif: true, createdAt: true,
      role: { select: { nom: true } },
      specialites: { include: { specialite: { select: { nom: true, code: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ utilisateurs })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()
  const validation = creerUtilisateurSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { specialites, motDePasse, roleId, telephone, ...rest } = validation.data
  const hashedPwd = await bcrypt.hash(motDePasse, 12)

  const utilisateur = await prisma.user.create({
    data: {
      ...rest,
      motDePasse: hashedPwd,
      telephone: telephone || null,
      roleId: roleId || null,
      creeParId: user.id,
      centreActifId: user.centreActif || null,
      estActif: true,
      centres: user.centreActif
        ? { create: { centreId: user.centreActif } }
        : undefined,
      specialites: specialites.length > 0
        ? { create: specialites.map((sid) => ({ specialiteId: sid })) }
        : undefined,
    },
    select: { id: true, nom: true, prenoms: true, email: true, niveauAcces: true },
  })

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: user.id,
    action: 'CREATION_USER',
    cible: 'User',
    cibleId: utilisateur.id,
    centreId: user.centreActif,
    details: { email: utilisateur.email, niveauAcces: utilisateur.niveauAcces },
    ip, userAgent,
  })

  return NextResponse.json({ utilisateur }, { status: 201 })
}
