import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const creerCentreSchema = z.object({
  nom: z.string().min(1),
  adresse: z.string().min(1),
  telephone: z.string().min(1),
  email: z.string().email(),
  region: z.string().min(1),
  prefecture: z.string().min(1),
  type: z.enum(['HOPITAL', 'CLINIQUE', 'CSU', 'CMS', 'AUTRE']),
  prixParDossier: z.coerce.number().int().min(0).optional().default(0),
  commissionNdi: z.coerce.number().int().min(0).optional().default(0),
  adminNom: z.string().min(1),
  adminPrenoms: z.string().min(1),
  adminEmail: z.string().email(),
  adminMotDePasse: z.string().min(8),
  adminTelephone: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const centres = await prisma.centre.findMany({
    include: {
      admin: { select: { nom: true, prenoms: true, email: true } },
      _count: { select: { utilisateurs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ centres })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { niveauAcces?: string }).niveauAcces !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Réservé au Ministère' }, { status: 403 })
  }

  const body = await req.json()
  const validation = creerCentreSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const {
    adminNom, adminPrenoms, adminEmail, adminMotDePasse, adminTelephone,
    ...centreData
  } = validation.data

  // Vérifier si l'email admin est déjà utilisé
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existingUser) {
    return NextResponse.json({ error: 'Un compte avec cet email existe déjà' }, { status: 409 })
  }

  const hashedPwd = await bcrypt.hash(adminMotDePasse, 12)

  let centre: Awaited<ReturnType<typeof prisma.centre.create>>
  let admin: Awaited<ReturnType<typeof prisma.user.create>>

  try {
    // Transaction : créer centre + admin en une seule opération atomique
    const result = await prisma.$transaction(async (tx) => {
      const c = await tx.centre.create({
        data: {
          ...centreData,
          estActif: true,
          creeParId: session.user!.id,
        },
      })

      const a = await tx.user.create({
        data: {
          nom: adminNom,
          prenoms: adminPrenoms,
          email: adminEmail,
          motDePasse: hashedPwd,
          telephone: adminTelephone,
          niveauAcces: 'ADMIN_CENTRE',
          estActif: true,
          creeParId: session.user!.id,
          centreActifId: c.id,
          centres: { create: { centreId: c.id } },
        },
      })

      await tx.centre.update({
        where: { id: c.id },
        data: { adminId: a.id },
      })

      return { centre: c, admin: a }
    })
    centre = result.centre
    admin = result.admin
  } catch (err) {
    console.error('[POST /api/centres]', err)
    return NextResponse.json({ error: 'Erreur lors de la création du centre' }, { status: 500 })
  }

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'CREATION_CENTRE',
    cible: 'Centre',
    cibleId: centre.id,
    details: { nom: centre.nom, adminEmail },
    ip, userAgent,
  })
  await logger({
    userId: session.user.id,
    action: 'CREATION_USER',
    cible: 'User',
    cibleId: admin.id,
    details: { email: adminEmail, niveauAcces: 'ADMIN_CENTRE', centreId: centre.id },
    ip, userAgent,
  })

  return NextResponse.json({ centre, admin: { id: admin.id, email: admin.email } }, { status: 201 })
}
