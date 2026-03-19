import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger, getRequestInfo } from '@/lib/logger'
import { SessionUser } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const { patientId, dossierId, signatureBase64 } = await req.json()

  if (!patientId || !dossierId || !signatureBase64) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const { ip, userAgent } = getRequestInfo(req)
  const centreId = user.centreActif!
  const debutAcces = new Date()
  const finAcces = new Date(debutAcces.getTime() + 60 * 60 * 1000)

  await prisma.accesDossier.create({
    data: {
      dossierId,
      medecinId: user.id!,
      centreId,
      debutAcces,
      finAcces,
      modeUrgence: false,
    },
  })

  await logger({
    userId: user.id,
    action: 'ACCES_DOSSIER',
    cible: 'DossierMedical',
    cibleId: dossierId,
    centreId,
    details: { modeAcces: 'SIGNATURE', finAcces },
    ip,
    userAgent,
  })

  return NextResponse.json({ acces: true, finAcces })
}
