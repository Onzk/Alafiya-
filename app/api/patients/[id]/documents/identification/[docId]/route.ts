import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { verifierAccesDossier } from '@/lib/verifier-acces-dossier'
import { unlink } from 'fs/promises'
import path from 'path'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; docId: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const autorise = await verifierAccesDossier(params.id, user.id!, user.niveauAcces)
  if (!autorise) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

  const doc = await prisma.documentIdentification.findUnique({ where: { id: params.docId } })
  if (!doc || doc.patientId !== params.id) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
  }

  await prisma.documentIdentification.delete({ where: { id: params.docId } })
  await unlink(path.join(process.cwd(), 'public', doc.fichier)).catch(() => {})

  return NextResponse.json({ ok: true })
}
