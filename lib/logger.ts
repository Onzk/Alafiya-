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

interface IpGeo {
  country_name?: string
  country_code2?: string
  isp?: string
}

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/

async function fetchIpGeo(ip: string): Promise<IpGeo> {
  if (!ip || ip === 'inconnue' || PRIVATE_IP.test(ip)) return {}
  try {
    const res = await fetch(`https://api.iplocation.net/?ip=${ip}`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return {}
    const data = await res.json()
    if (data.response_code !== '200') return {}
    return {
      country_name: data.country_name || undefined,
      country_code2: data.country_code2 || undefined,
      isp: data.isp || undefined,
    }
  } catch {
    return {}
  }
}

export async function logger(params: LogParams): Promise<void> {
  try {
    const geo = params.ip ? await fetchIpGeo(params.ip) : {}
    await prisma.log.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        cible: params.cible,
        cibleId: params.cibleId,
        centreId: params.centreId ?? null,
        details: { ...(params.details ?? {}), geo } as object,
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
