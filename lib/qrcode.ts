import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export function genererTokenQR(): string {
  const uuid = uuidv4()
  return crypto.createHash('sha256').update(uuid).digest('hex')
}

export function genererURLQR(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${base}/api/qrcode/scan?token=${token}`
}
