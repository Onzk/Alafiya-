import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { UserPlus, QrCode, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculerAge } from '@/lib/utils'

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where = searchParams.q
    ? {
        OR: [
          { nom: { contains: searchParams.q, mode: 'insensitive' as const } },
          { prenoms: { contains: searchParams.q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Patients</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{total} patient(s) enregistré(s)</p>
        </div>
        <Button asChild className="h-12 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
          <Link href="/patients/nouveau"><UserPlus className="h-4 w-4" /> Nouveau patient</Link>
        </Button>
      </div>

      {/* Recherche */}
      <form method="get" className="dash-in delay-75 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Rechercher par nom ou prénom..."
          className="w-full h-12 pl-10 pr-4 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
        />
      </form>

      {patients.length === 0 ? (
        <div className="dash-in delay-150 py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-zinc-950 dark:border dark:border-zinc-700/60 flex items-center justify-center mx-auto mb-3">
            <User className="h-7 w-7 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Aucun patient trouvé</p>
          {searchParams.q && (
            <Link href="/patients" className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 inline-block hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
              Effacer la recherche
            </Link>
          )}
        </div>
      ) : (
        <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Patient</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Âge</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Genre</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Actions</span>
          </div>

          <ul>
            {patients.map((patient, i) => (
              <li
                key={patient.id}
                className={`dash-in delay-${[0,75,100,150,200,225,300,375][i] ?? 300} flex sm:grid sm:grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand font-bold text-sm">
                      {patient.nom[0]}{patient.prenoms[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {patient.nom.toUpperCase()} {patient.prenoms}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block whitespace-nowrap">
                  {calculerAge(patient.dateNaissance)} ans{patient.dateNaissancePresumee && ' *'}
                </span>

                <span className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block whitespace-nowrap">
                  {patient.genre === 'M' ? 'Homme' : 'Femme'}
                </span>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/patients/${patient.id}/qrcode`}>
                    <Button size="sm" variant="outline" className="rounded-xl border-slate-200 dark:border-zinc-700 h-8 px-2.5">
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href={`/patients/${patient.id}`}>
                    <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl h-8 px-3 text-xs">Dossier</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <div className="dash-in delay-300 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/patients?page=${p}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
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
