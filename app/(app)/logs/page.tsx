import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { SessionUser } from '@/types'

const couleurAction: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  SCAN_QR: 'bg-blue-100 text-blue-700',
  ENVOI_OTP: 'bg-yellow-100 text-yellow-700',
  VALIDATION_OTP: 'bg-green-100 text-green-700',
  ACCES_DOSSIER: 'bg-blue-100 text-blue-700',
  MODIFICATION_DOSSIER: 'bg-purple-100 text-purple-700',
  URGENCE_ACTIVATION: 'bg-red-100 text-red-700',
  CREATION_PATIENT: 'bg-teal-100 text-teal-700',
  CREATION_USER: 'bg-indigo-100 text-indigo-700',
  CREATION_CENTRE: 'bg-orange-100 text-orange-700',
  CREATION_ROLE: 'bg-pink-100 text-pink-700',
  MODIFICATION_PERMISSIONS: 'bg-amber-100 text-amber-700',
}

export default async function LogsPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) redirect('/dashboard')

  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const skip = (page - 1) * limit

  const where = user.niveauAcces === 'ADMIN_CENTRE' ? { centreId: user.centreActif } : {}

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      include: {
        user: { select: { nom: true, prenoms: true, email: true } },
        centre: { select: { nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.log.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journaux d&apos;activité</h1>
        <p className="text-gray-500 text-sm">{total} entrée(s)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernières actions</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Aucun log disponible</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-xs">
                  <span className={`px-2 py-1 rounded font-medium whitespace-nowrap ${couleurAction[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.user && (
                        <span className="font-medium text-gray-700">{log.user.nom} {log.user.prenoms}</span>
                      )}
                      {log.centre && <span className="text-gray-400">• {log.centre.nom}</span>}
                      {log.cible && <span className="text-gray-400">• {log.cible}</span>}
                    </div>
                    {log.ip && <p className="text-gray-400 mt-0.5">IP: {log.ip}</p>}
                  </div>
                  <span className="text-gray-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/logs?page=${p}`}
              className={`px-3 py-1 rounded-md text-sm font-medium ${p === page ? 'bg-green-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
