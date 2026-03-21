import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'ADMIN_CENTRE') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const centreId = user.centreActif
  if (!centreId) return NextResponse.json({ results: [] })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const nameFilter = {
    OR: [
      { nom: { contains: q, mode: 'insensitive' as const } },
      { prenoms: { contains: q, mode: 'insensitive' as const } },
    ],
  }

  const [personnels, patients, roles] = await Promise.all([
    prisma.user.findMany({
      where: {
        centres: { some: { centreId } },
        niveauAcces: 'PERSONNEL',
        ...nameFilter,
      },
      select: { id: true, nom: true, prenoms: true, typePersonnel: { select: { nom: true } } },
      take: 5,
    }),
    prisma.patient.findMany({
      where: {
        OR: [
          { centreCreationId: centreId },
          { dossier: { enregistrements: { some: { centreId } } } },
        ],
        ...nameFilter,
      },
      select: { id: true, nom: true, prenoms: true, genre: true },
      take: 5,
    }),
    prisma.role.findMany({
      where: {
        OR: [{ creePar: 'MINISTERE' }, { centreId }],
        nom: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, nom: true, creePar: true },
      take: 5,
    }),
  ])

  const results = [
    ...personnels.map((p) => ({
      type: 'personnel' as const,
      id: p.id,
      label: `${p.nom.toUpperCase()} ${p.prenoms}`,
      sublabel: p.typePersonnel?.nom ?? 'Personnel médical',
      href: `/admin/personnels/${p.id}`,
    })),
    ...patients.map((p) => ({
      type: 'patient' as const,
      id: p.id,
      label: `${p.nom.toUpperCase()} ${p.prenoms}`,
      sublabel: p.genre === 'M' ? 'Patient · Homme' : 'Patiente · Femme',
      href: `/admin/patients/${p.id}`,
    })),
    ...roles.map((r) => ({
      type: 'role' as const,
      id: r.id,
      label: r.nom,
      sublabel: r.creePar === 'MINISTERE' ? 'Ministère' : 'Ce centre',
      href: `/admin/roles`,
    })),
  ]

  return NextResponse.json({ results })
}
