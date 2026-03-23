import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const patchCentreSchema = z.object({
  nom: z.string().min(1).optional(),
  adresse: z.string().min(1).optional(),
  telephone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  region: z.string().min(1).optional(),
  prefecture: z.string().min(1).optional(),
  type: z.enum(['HOPITAL', 'CLINIQUE', 'CSU', 'CMS', 'AUTRE']).optional(),
  prixParDossier: z.coerce.number().int().min(0).optional(),
  commissionNdi: z.coerce.number().int().min(0).optional(),
  estActif: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const centre = await prisma.centre.findUnique({
    where: { id: params.id },
    include: {
      admin: { select: { nom: true, prenoms: true, email: true, telephone: true } },
      _count: {
        select: { utilisateurs: true, patients: true, enregistrements: true, accesUrgences: true },
      },
      utilisateurs: {
        include: {
          user: {
            select: {
              nom: true, prenoms: true, email: true, estActif: true, niveauAcces: true, createdAt: true,
              specialites: { include: { specialite: { select: { nom: true, code: true } } } },
            },
          },
        },
        orderBy: { user: { createdAt: 'desc' } },
      },
      patients: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nom: true, prenoms: true, createdAt: true },
      },
    },
  })

  if (!centre) return NextResponse.json({ error: 'Centre introuvable' }, { status: 404 })

  return NextResponse.json({ centre })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  const body = await req.json()
  const validation = patchCentreSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const centre = await prisma.centre.update({
    where: { id: params.id },
    data: validation.data,
    include: { admin: { select: { nom: true, prenoms: true, email: true } } },
  })

  return NextResponse.json({ centre })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  const centre = await prisma.centre.findUnique({
    where: { id: params.id },
    include: { _count: { select: { patients: true } } },
  })

  if (!centre) return NextResponse.json({ error: 'Centre introuvable' }, { status: 404 })

  if (centre._count.patients > 0) {
    return NextResponse.json(
      { error: `Suppression impossible : ${centre._count.patients} patient(s) rattaché(s) à ce centre.` },
      { status: 422 }
    )
  }

  await prisma.centre.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
