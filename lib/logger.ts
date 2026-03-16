import prisma from '@/lib/db'
import { ActionLog } from '@prisma/client'

interface LogParams {
  userId?: string
  action: ActionLog
  cible?: string
  cibleId?: string
  centreId?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
}

export async function logger(params: LogParams): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        cible: params.cible,
        cibleId: params.cibleId,
        centreId: params.centreId ?? null,
        details: params.details ?? {},
        ip: params.ip,
        userAgent: params.userAgent,
      },
    })
  } catch (err) {
    console.error('[Logger] Erreur lors de l\'enregistrement du log:', err)
  }
}

export function getRequestInfo(req: Request): { ip: string; userAgent: string } {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'inconnue'
  const userAgent = req.headers.get('user-agent') || 'inconnu'
  return { ip, userAgent }
}
