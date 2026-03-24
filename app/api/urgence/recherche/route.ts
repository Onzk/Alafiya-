import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const centreId = user.centreActif
  if (!centreId) return NextResponse.json({ patients: [] })

  const { searchParams } = new URL(req.url)
  const nom = searchParams.get('nom')?.trim() || ''
  const prenoms = searchParams.get('prenoms')?.trim() || ''
  const genre = searchParams.get('genre') || ''
  const dateNaissance = searchParams.get('dateNaissance') || ''

  if (nom.length < 2) return NextResponse.json({ patients: [] })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    AND: [
      {
        OR: [
          { centreCreationId: centreId },
          { dossier: { enregistrements: { some: { centreId } } } },
        ],
      },
      { nom: { contains: nom, mode: 'insensitive' } },
    ],
  }

  if (prenoms) where.AND.push({ prenoms: { contains: prenoms, mode: 'insensitive' } })
  if (genre === 'M' || genre === 'F') where.AND.push({ genre })
  if (dateNaissance) {
    const d = new Date(dateNaissance)
    if (!isNaN(d.getTime())) {
      const debut = new Date(d); debut.setHours(0, 0, 0, 0)
      const fin   = new Date(d); fin.setHours(23, 59, 59, 999)
      where.AND.push({ dateNaissance: { gte: debut, lte: fin } })
    }
  }

  const patients = await prisma.patient.findMany({
    where,
    select: {
      id: true,
      nom: true,
      prenoms: true,
      genre: true,
      dateNaissance: true,
      dateNaissancePresumee: true,
      dossier: { select: { id: true } },
    },
    take: 10,
  })

  return NextResponse.json({
    patients: patients.map((p) => ({
      id: p.id,
      nom: p.nom,
      prenoms: p.prenoms,
      genre: p.genre,
      dateNaissance: p.dateNaissance,
      dateNaissancePresumee: p.dateNaissancePresumee,
      dossierId: p.dossier?.id ?? null,
    })),
  })
}
