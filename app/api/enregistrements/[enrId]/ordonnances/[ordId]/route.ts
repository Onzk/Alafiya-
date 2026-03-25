import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { unlink } from 'fs/promises'
import path from 'path'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { enrId: string; ordId: string } },
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser

  const ord = await prisma.ordonnanceConsultation.findUnique({
    where: { id: params.ordId },
    select: {
      enregistrementId: true,
      fichier: true,
      enregistrement: { select: { dossierId: true } },
    },
  })
  if (!ord || ord.enregistrementId !== params.enrId) {
    return NextResponse.json({ error: 'Ordonnance introuvable' }, { status: 404 })
  }

  const { dossierId } = ord.enregistrement
  const accesValide =
    user.niveauAcces === 'SUPERADMIN' ||
    user.niveauAcces === 'ADMIN_CENTRE' ||
    !!(await prisma.accesDossier.findFirst({
      where: { dossierId, medecinId: user.id, finAcces: { gt: new Date() } },
    }))
  if (!accesValide) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  if (ord.fichier) {
    try {
      await unlink(path.join(process.cwd(), 'public', ord.fichier))
    } catch {}
  }

  await prisma.ordonnanceConsultation.delete({ where: { id: params.ordId } })
  return NextResponse.json({ ok: true })
}
