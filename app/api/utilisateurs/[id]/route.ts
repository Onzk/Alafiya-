import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { z } from 'zod'

const patchSchema = z.object({
  estActif: z.boolean().optional(),
  nom: z.string().min(1).optional(),
  prenoms: z.string().min(1).optional(),
  telephone: z.string().optional(),
  specialites: z.array(z.string()).optional(),
  typePersonnelId: z.string().nullable().optional(),
  roleId: z.string().nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const utilisateur = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, nom: true, prenoms: true, email: true, telephone: true,
      niveauAcces: true, estActif: true, createdAt: true, photo: true,
      role: { select: { id: true, nom: true } },
      typePersonnel: { select: { id: true, nom: true, code: true } },
      specialites: { include: { specialite: { select: { id: true, nom: true, code: true } } } },
      centres: { include: { centre: { select: { id: true, nom: true, type: true } } } },
      _count: { select: { enregistrements: true, accesUrgences: true, patientsCrees: true } },
      patientsCrees: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nom: true, prenoms: true, createdAt: true },
      },
    },
  })

  if (!utilisateur) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  return NextResponse.json({ utilisateur })
}

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

  const { estActif, nom, prenoms, telephone, specialites, typePersonnelId, roleId } = validation.data

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(estActif !== undefined && { estActif }),
      ...(nom !== undefined && { nom }),
      ...(prenoms !== undefined && { prenoms }),
      ...(telephone !== undefined && { telephone }),
      ...(typePersonnelId !== undefined && { typePersonnelId }),
      ...(roleId !== undefined && { roleId }),
      ...(specialites !== undefined && {
        specialites: {
          deleteMany: {},
          create: specialites.map((sid) => ({ specialiteId: sid })),
        },
      }),
    },
    select: {
      id: true, nom: true, prenoms: true, email: true, telephone: true, estActif: true,
      specialites: { select: { specialite: { select: { nom: true, code: true } } } },
      typePersonnel: { select: { id: true, nom: true, code: true } },
    },
  })

  return NextResponse.json({ utilisateur: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.user.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
