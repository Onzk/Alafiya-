import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const centreId = user.centreActif
  if (!centreId) return NextResponse.json({ patients: [], total: 0 })

  const { searchParams } = new URL(req.url)
  const nom = searchParams.get('nom')?.trim() || ''
  const prenoms = searchParams.get('prenoms')?.trim() || ''
  const genre = searchParams.get('genre') || ''
  const dateNaissance = searchParams.get('dateNaissance') || ''
  const telephone = searchParams.get('telephone')?.trim() || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))

  // Au moins un critère requis
  const hasCritere = nom.length >= 2 || prenoms.length >= 2 || (genre === 'M' || genre === 'F') || telephone.length >= 5
  if (!hasCritere) return NextResponse.json({ patients: [], total: 0 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    AND: [
      {
        OR: [
          { centreCreationId: centreId },
          { dossier: { enregistrements: { some: { centreId } } } },
        ],
      },
    ],
  }

  if (nom.length >= 2) where.AND.push({ nom: { contains: nom, mode: 'insensitive' } })
  if (prenoms.length >= 2) where.AND.push({ prenoms: { contains: prenoms, mode: 'insensitive' } })
  if (genre === 'M' || genre === 'F') where.AND.push({ genre })
  if (dateNaissance) {
    const d = new Date(dateNaissance)
    if (!isNaN(d.getTime())) {
      const debut = new Date(d); debut.setHours(0, 0, 0, 0)
      const fin   = new Date(d); fin.setHours(23, 59, 59, 999)
      where.AND.push({ dateNaissance: { gte: debut, lte: fin } })
    }
  }
  if (telephone.length >= 5) {
    where.AND.push({ personnesUrgence: { some: { telephone: { contains: telephone, mode: 'insensitive' } } } })
  }

  const skip = (page - 1) * 10

  const [patients, total] = await prisma.$transaction([
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenoms: true,
        genre: true,
        dateNaissance: true,
        dateNaissancePresumee: true,
        photo: true,
        dossier: { select: { id: true } },
      },
      take: 10,
      skip,
      orderBy: { nom: 'asc' },
    }),
    prisma.patient.count({ where }),
  ])

  return NextResponse.json({
    patients: patients.map((p) => ({
      id: p.id,
      nom: p.nom,
      prenoms: p.prenoms,
      genre: p.genre,
      dateNaissance: p.dateNaissance,
      dateNaissancePresumee: p.dateNaissancePresumee,
      photo: p.photo ?? null,
      dossierId: p.dossier?.id ?? null,
    })),
    total,
    page,
  })
}
