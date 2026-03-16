import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { verifyOTP } from '@/lib/otp'
import { logger, getRequestInfo } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { patientId, dossierId, code } = await req.json()
  if (!patientId || !code) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const valide = await verifyOTP(patientId, session.user.id!, code)

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'VALIDATION_OTP',
    cible: 'Patient',
    cibleId: patientId,
    centreId: (session.user as { centreActif?: string }).centreActif,
    details: { valide },
    ip,
    userAgent,
  })

  if (!valide) return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 })

  const centreId = (session.user as { centreActif?: string }).centreActif!
  const debutAcces = new Date()
  const finAcces = new Date(debutAcces.getTime() + 60 * 60 * 1000)

  await prisma.accesDossier.create({
    data: {
      dossierId,
      medecinId: session.user.id!,
      centreId,
      debutAcces,
      finAcces,
      modeUrgence: false,
    },
  })

  await logger({
    userId: session.user.id,
    action: 'ACCES_DOSSIER',
    cible: 'DossierMedical',
    cibleId: dossierId,
    centreId,
    details: { modeUrgence: false, finAcces },
    ip,
    userAgent,
  })

  return NextResponse.json({ acces: true, finAcces })
}
