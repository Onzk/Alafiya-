import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'

// Renouvelle l'accès QR pour 24h (patient physiquement présent)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const niveauAcces = (session.user as { niveauAcces?: string }).niveauAcces
  if (!['PERSONNEL', 'ADMIN', 'SUPERADMIN'].includes(niveauAcces ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    select: { id: true, nom: true, prenoms: true },
  })
  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

  const qrAccesExpireAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.patient.update({
    where: { id: params.id },
    data: { qrAccesExpireAt },
  })

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'QR_ACCES_RENOUVELE',
    cible: 'Patient',
    cibleId: params.id,
    centreId: (session.user as { centreActif?: string }).centreActif,
    details: { qrAccesExpireAt },
    ip,
    userAgent,
  })

  return NextResponse.json({ qrAccesExpireAt })
}
