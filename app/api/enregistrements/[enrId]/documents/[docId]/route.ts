import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { unlink } from 'fs/promises'
import path from 'path'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { enrId: string; docId: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser

  const doc = await prisma.documentConsultation.findUnique({
    where: { id: params.docId },
    select: {
      enregistrementId: true,
      fichier: true,
      enregistrement: { select: { dossierId: true } },
    },
  })
  if (!doc || doc.enregistrementId !== params.enrId) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
  }

  const { dossierId } = doc.enregistrement
  const accesValide =
    user.niveauAcces === 'SUPERADMIN' ||
    user.niveauAcces === 'ADMIN_CENTRE' ||
    !!(await prisma.accesDossier.findFirst({
      where: { dossierId, medecinId: user.id, finAcces: { gt: new Date() } },
    }))
  if (!accesValide) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  try {
    await unlink(path.join(process.cwd(), 'public', doc.fichier))
  } catch {}

  await prisma.documentConsultation.delete({ where: { id: params.docId } })
  return NextResponse.json({ ok: true })
}
