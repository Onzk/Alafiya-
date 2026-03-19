import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { SessionUser } from '@/types'

const couleurAction: Record<string, string> = {
  LOGIN:                  'bg-brand/8 dark:bg-brand/12 border border-brand/20 text-brand',
  LOGOUT:                 'bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400',
  SCAN_QR:                'bg-blue-50 dark:bg-blue-400/15 border border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-300',
  ENVOI_OTP:              'bg-yellow-50 dark:bg-yellow-400/15 border border-yellow-200 dark:border-yellow-400/20 text-yellow-700 dark:text-yellow-300',
  VALIDATION_OTP:         'bg-brand/8 dark:bg-brand/12 border border-brand/20 text-brand',
  ACCES_DOSSIER:          'bg-blue-50 dark:bg-blue-400/15 border border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-300',
  MODIFICATION_DOSSIER:   'bg-purple-50 dark:bg-purple-400/15 border border-purple-200 dark:border-purple-400/20 text-purple-700 dark:text-purple-300',
  URGENCE_ACTIVATION:     'bg-red-50 dark:bg-red-400/15 border border-red-200 dark:border-red-400/20 text-red-700 dark:text-red-300',
  CREATION_PATIENT:       'bg-teal-50 dark:bg-teal-400/15 border border-teal-200 dark:border-teal-400/20 text-teal-700 dark:text-teal-300',
  CREATION_USER:          'bg-indigo-50 dark:bg-indigo-400/15 border border-indigo-200 dark:border-indigo-400/20 text-indigo-700 dark:text-indigo-300',
  CREATION_CENTRE:        'bg-orange-50 dark:bg-orange-400/15 border border-orange-200 dark:border-orange-400/20 text-orange-700 dark:text-orange-300',
  CREATION_ROLE:          'bg-pink-50 dark:bg-pink-400/15 border border-pink-200 dark:border-pink-400/20 text-pink-700 dark:text-pink-300',
  MODIFICATION_PERMISSIONS:'bg-amber-50 dark:bg-amber-400/15 border border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-300',
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
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Journaux d&apos;activité</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{total} entrée(s)</p>
      </div>

      {/* Liste des logs */}
      <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Dernières actions</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
            Activité du système en temps réel
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="py-14 text-center px-4">
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucun log disponible</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className={`dash-in delay-${[0,50,75,100,150,200,225,300][Math.min(i,7)]} flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors`}
              >
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 ${couleurAction[log.action] ?? 'bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400'}`}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.user && (
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{log.user.nom} {log.user.prenoms}</span>
                    )}
                    {log.centre && <span className="text-xs text-slate-400 dark:text-zinc-500">· {log.centre.nom}</span>}
                    {log.cible && <span className="text-xs text-slate-400 dark:text-zinc-500">· {log.cible}</span>}
                  </div>
                  {log.ip && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">IP: {log.ip}</p>}
                </div>
                <span className="text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap flex-shrink-0">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="dash-in delay-150 flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/logs?page=${p}`}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                p === page
                  ? 'bg-brand text-white shadow-sm shadow-brand/20'
                  : 'border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
