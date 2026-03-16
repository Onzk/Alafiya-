import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      creePar: { select: { nom: true, prenoms: true } },
      centreCreation: { select: { nom: true } },
      dossier: { select: { id: true } },
    },
  })

  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

  return NextResponse.json({ patient })
}
