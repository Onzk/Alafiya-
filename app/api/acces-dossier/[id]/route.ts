import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const acces = await prisma.accesDossier.findUnique({
    where: { id: params.id },
    select: { id: true, medecinId: true, dossierId: true, modeUrgence: true, finAcces: true },
  })

  if (!acces) return NextResponse.json({ error: 'Accès introuvable' }, { status: 404 })
  if (acces.medecinId !== session.user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  if (acces.finAcces <= new Date()) return NextResponse.json({ error: 'Accès déjà expiré' }, { status: 400 })

  await prisma.accesDossier.update({
    where: { id: params.id },
    data: { finAcces: new Date() },
  })

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'ACCES_TERMINE',
    cible: 'AccesDossier',
    cibleId: params.id,
    centreId: (session.user as { centreActif?: string }).centreActif,
    details: { dossierId: acces.dossierId, modeUrgence: acces.modeUrgence },
    ip,
    userAgent,
  })

  return NextResponse.json({ ok: true })
}
