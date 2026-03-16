import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOTP(patientId: string, medecinId: string, telephone: string): Promise<string> {
  // Invalider les OTP précédents non utilisés
  await prisma.oTP.updateMany({
    where: { patientId, medecinId, utilise: false },
    data: { utilise: true },
  })

  const code = generateOTPCode()
  const hashedCode = await bcrypt.hash(code, 10)
  const expireAt = new Date(Date.now() + 10 * 60 * 1000) // +10 minutes

  await prisma.oTP.create({
    data: { patientId, medecinId, code: hashedCode, telephone, expireAt, utilise: false },
  })

  return code
}

export async function verifyOTP(
  patientId: string,
  medecinId: string,
  codeEntre: string
): Promise<boolean> {
  const otp = await prisma.oTP.findFirst({
    where: {
      patientId,
      medecinId,
      utilise: false,
      expireAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return false

  const valide = await bcrypt.compare(codeEntre, otp.code)
  if (valide) {
    await prisma.oTP.update({ where: { id: otp.id }, data: { utilise: true } })
  }

  return valide
}
