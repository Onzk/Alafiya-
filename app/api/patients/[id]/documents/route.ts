import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { verifierAccesDossier } from '@/lib/verifier-acces-dossier'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser

  const autorise = await verifierAccesDossier(params.id, user.id!, user.niveauAcces)
  if (!autorise) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

  const [identification, documents] = await Promise.all([
    prisma.documentIdentification.findMany({
      where: { patientId: params.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.documentPatient.findMany({
      where: { patientId: params.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ identification, documents })
}
