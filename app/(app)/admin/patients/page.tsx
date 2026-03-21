import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Users, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { SessionUser } from '@/types'
import { calculerAge } from '@/lib/utils'

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'ADMIN_CENTRE') redirect('/dashboard')

  const centreId = user.centreActif
  if (!centreId) redirect('/admin/dashboard')

  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const limit = 20
  const skip = (page - 1) * limit
  const q = searchParams.q?.trim() || ''

  const scopeFilter = {
    OR: [
      { centreCreationId: centreId },
      { dossier: { enregistrements: { some: { centreId } } } },
    ],
  }

  const searchFilter = q
    ? {
        AND: [
          scopeFilter,
          {
            OR: [
              { nom: { contains: q, mode: 'insensitive' as const } },
              { prenoms: { contains: q, mode: 'insensitive' as const } },
            ],
          },
        ],
      }
    : scopeFilter

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where: searchFilter,
      select: {
        id: true,
        nom: true,
        prenoms: true,
        genre: true,
        dateNaissance: true,
        dateNaissancePresumee: true,
        telephone: true,
        centreCreationId: true,
        dossier: {
          select: {
            enregistrements: {
              where: { centreId },
              select: { dateConsultation: true },
              orderBy: { dateConsultation: 'desc' },
              take: 1,
            },
            _count: { select: { enregistrements: { where: { centreId } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where: searchFilter }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Patients</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{total} patient(s) du centre</p>
      </div>

      {/* Recherche */}
      <form method="get" className="dash-in delay-75 flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom ou prénom..."
            className="w-full h-11 pl-9 pr-4 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
          />
        </div>
        {q && (
          <Link
            href="/admin/patients"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Réinitialiser
          </Link>
        )}
      </form>

      {/* Contenu */}
      {patients.length === 0 ? (
        <div className="dash-in delay-150 py-16 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Aucun patient trouvé</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            {q ? 'Aucun résultat pour cette recherche.' : 'Les patients créés ou ayant consulté dans ce centre apparaissent ici.'}
          </p>
        </div>
      ) : (
        <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {/* En-têtes table desktop */}
          <div className="hidden lg:grid grid-cols-[2fr_80px_80px_130px_110px_72px] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
            {['Patient', 'Âge', 'Genre', 'Origine', 'Consultations', ''].map((h, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
            ))}
          </div>
          <ul>
            {patients.map((p, i) => {
              const isLocal = p.centreCreationId === centreId
              const nbConsult = p.dossier?._count?.enregistrements ?? 0
              const derniereConsult = p.dossier?.enregistrements[0]?.dateConsultation
              return (
                <li
                  key={p.id}
                  className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} flex lg:grid lg:grid-cols-[2fr_80px_80px_130px_110px_72px] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors`}
                >
                  {/* Patient */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand font-bold text-xs">{p.nom[0]}{p.prenoms[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {p.nom.toUpperCase()} {p.prenoms}
                      </p>
                      {p.telephone && (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{p.telephone}</p>
                      )}
                    </div>
                  </div>
                  {/* Âge */}
                  <span className="text-xs text-slate-500 dark:text-zinc-400 hidden lg:block whitespace-nowrap">
                    {calculerAge(p.dateNaissance)} ans{p.dateNaissancePresumee ? ' *' : ''}
                  </span>
                  {/* Genre */}
                  <span className="text-xs text-slate-500 dark:text-zinc-400 hidden lg:block">
                    {p.genre === 'M' ? 'Homme' : 'Femme'}
                  </span>
                  {/* Origine */}
                  <div className="hidden lg:block">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      isLocal
                        ? 'bg-brand/10 dark:bg-brand/15 text-brand'
                        : 'bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300'
                    }`}>
                      {isLocal ? 'Ce centre' : 'Autre centre'}
                    </span>
                  </div>
                  {/* Consultations */}
                  <div className="hidden lg:block">
                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{nbConsult} consultation(s)</p>
                    {derniereConsult && (
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {new Date(derniereConsult).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  {/* Action */}
                  <Link
                    href={`/admin/patients/${p.id}`}
                    className="flex-shrink-0 text-xs font-bold text-brand hover:text-brand-dark border border-brand/20 hover:border-brand/40 bg-brand/5 hover:bg-brand/10 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                  >
                    Voir
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/20">
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              {patients.length} affiché(s) sur {total} au total
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="dash-in delay-300 flex items-center justify-center gap-2 flex-wrap">
          {page > 1 && (
            <Link
              href={`/admin/patients?page=${page - 1}${q ? `&q=${q}` : ''}`}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/patients?page=${p}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                p === page
                  ? 'bg-brand text-white shadow-sm shadow-brand/20'
                  : 'border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={`/admin/patients?page=${page + 1}${q ? `&q=${q}` : ''}`}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
