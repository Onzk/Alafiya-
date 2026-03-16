import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { createOTP } from '@/lib/otp'
import { envoyerSMS, messageOTP } from '@/lib/afriksms'
import { logger, getRequestInfo } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { patientId } = await req.json()
  if (!patientId) return NextResponse.json({ error: 'patientId requis' }, { status: 400 })

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { nom: true, prenoms: true, telephone: true },
  })

  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
  if (!patient.telephone) return NextResponse.json({ error: 'Aucun téléphone enregistré' }, { status: 400 })

  const code = await createOTP(patientId, session.user.id!, patient.telephone)
  const message = messageOTP(code, `${patient.nom} ${patient.prenoms}`)
  const smsResult = await envoyerSMS(patient.telephone, message)

  const { ip, userAgent } = getRequestInfo(req)
  await logger({
    userId: session.user.id,
    action: 'ENVOI_OTP',
    cible: 'Patient',
    cibleId: patientId,
    centreId: (session.user as { centreActif?: string }).centreActif,
    details: { telephone: patient.telephone, smsSent: smsResult.success },
    ip,
    userAgent,
  })

  if (!smsResult.success) return NextResponse.json({ error: smsResult.message }, { status: 500 })

  return NextResponse.json({ message: 'OTP envoyé avec succès' })
}
