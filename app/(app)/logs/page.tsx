import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { Prisma, ActionLog } from '@prisma/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LogsFilters } from './LogsFilters'
import { LogsTable } from './LogsTable'

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { page?: string; action?: string; q?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser
  if (!['SUPERADMIN', 'ADMIN_CENTRE'].includes(user.niveauAcces)) redirect('/dashboard')

  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const action = searchParams.action || ''
  const q = searchParams.q || ''
  const limit = 50
  const skip = (page - 1) * limit

  const conditions: Prisma.LogWhereInput[] = []
  if (user.niveauAcces === 'ADMIN_CENTRE') conditions.push({ centreId: user.centreActif })
  if (action) conditions.push({ action: action as ActionLog })
  if (q) {
    conditions.push({
      OR: [
        { cible: { contains: q, mode: 'insensitive' } },
        { ip: { contains: q, mode: 'insensitive' } },
        { user: { nom: { contains: q, mode: 'insensitive' } } },
        { user: { prenoms: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ],
    })
  }
  const where: Prisma.LogWhereInput = conditions.length > 0 ? { AND: conditions } : {}

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

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (action) params.set('action', action)
    if (q) params.set('q', q)
    return `/logs?${params.toString()}`
  }

  const activeFilters = !!(action || q)

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Journaux d&apos;activité</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          {total} entrée(s)
          {activeFilters && <span className="ml-1 text-brand font-medium">· filtré(s)</span>}
        </p>
      </div>

      {/* Filtres */}
      <div className="dash-in delay-50">
        <LogsFilters defaultQ={q} defaultAction={action} />
      </div>

      {/* Liste des logs */}
      <div className="dash-in delay-75">
        {logs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 py-16 text-center px-4">
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Aucun journal trouvé</p>
            {activeFilters && (
              <Link href="/logs" className="mt-2 inline-block text-xs text-brand hover:underline">
                Effacer les filtres
              </Link>
            )}
          </div>
        ) : (
          <LogsTable
            logs={logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))}
            activeFilters={activeFilters}
            total={total}
            page={page}
            totalPages={totalPages}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="dash-in delay-150 flex items-center justify-center gap-1.5">
          <Link
            href={buildHref(Math.max(1, page - 1))}
            className={`p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          {getPageNumbers(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-slate-400 dark:text-zinc-500">…</span>
            ) : (
              <Link
                key={p}
                href={buildHref(p as number)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  p === page
                    ? 'bg-brand text-white shadow-sm shadow-brand/20'
                    : 'border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                {p}
              </Link>
            )
          )}

          <Link
            href={buildHref(Math.min(totalPages, page + 1))}
            className={`p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors ${page === totalPages ? 'pointer-events-none opacity-40' : ''}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
