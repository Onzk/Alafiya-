import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { UserPlus, QrCode, User, Search, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculerAge } from '@/lib/utils'
import { SessionUser } from '@/types'

function formatTempsRestant(finAcces: Date): string {
  const diffMs = finAcces.getTime() - Date.now()
  if (diffMs <= 0) return ''
  const totalMin = Math.floor(diffMs / 60000)
  const heures = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  if (heures > 0) return `${heures}h ${minutes}min`
  return `${minutes}min`
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser
  const isAdmin = user.niveauAcces === 'SUPERADMIN' || user.niveauAcces === 'ADMIN_CENTRE'

  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  // Le personnel ne voit que les patients créés dans son centre ou y ayant consulté
  const centreActif = user.centreActif
  const scopeFilter = !isAdmin && centreActif
    ? {
        OR: [
          { centreCreationId: centreActif },
          { dossier: { enregistrements: { some: { centreId: centreActif } } } },
        ],
      }
    : {}

  const where = searchParams.q
    ? {
        AND: [
          scopeFilter,
          {
            OR: [
              { nom: { contains: searchParams.q, mode: 'insensitive' as const } },
              { prenoms: { contains: searchParams.q, mode: 'insensitive' as const } },
            ],
          },
        ],
      }
    : scopeFilter

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { dossier: { select: { id: true } } },
    }),
    prisma.patient.count({ where }),
  ])

  // Pour le personnel, récupérer les accès actifs en cours
  const accesMap = new Map<string, { finAcces: Date; modeUrgence: boolean }>()
  if (!isAdmin) {
    const dossierIds = patients.map(p => p.dossier?.id).filter(Boolean) as string[]
    if (dossierIds.length > 0) {
      const accesActifs = await prisma.accesDossier.findMany({
        where: {
          medecinId: user.id,
          dossierId: { in: dossierIds },
          finAcces: { gt: new Date() },
        },
        select: { dossierId: true, finAcces: true, modeUrgence: true },
      })
      for (const a of accesActifs) {
        accesMap.set(a.dossierId, { finAcces: a.finAcces, modeUrgence: a.modeUrgence })
      }
    }
  }

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
        <>
          {/* Vue cards — mobile uniquement */}
          <div className="dash-in delay-150 flex flex-col gap-3 sm:hidden">
            {patients.map((patient, i) => {
              const acces = patient.dossier ? accesMap.get(patient.dossier.id) : undefined
              const tempsRestant = acces ? formatTempsRestant(acces.finAcces) : ''
              const age = calculerAge(patient.dateNaissance)
              const dateNaissanceFormatee = new Date(patient.dateNaissance).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
              return (
                <div
                  key={patient.id}
                  className={`dash-in delay-${[0,75,100,150,200,225,300,375][i] ?? 300} rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-center gap-3`}
                >
                  {/* Avatar */}
                  <div className="h-11 w-11 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {patient.photo ? (
                      <Image
                        src={patient.photo}
                        alt={`${patient.nom} ${patient.prenoms}`}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-brand font-bold text-sm">
                        {patient.nom[0]}{patient.prenoms[0]}
                      </span>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {patient.nom.toUpperCase()} {patient.prenoms}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-zinc-400">{dateNaissanceFormatee} · {age} ans{patient.dateNaissancePresumee && ', estimé'}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        patient.genre === 'M'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400'
                      }`}>
                        {patient.genre === 'M' ? 'Homme' : 'Femme'}
                      </span>
                      {!isAdmin && acces && tempsRestant && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          acces.modeUrgence
                            ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {acces.modeUrgence ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {acces.modeUrgence ? 'Urgence' : tempsRestant}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(isAdmin || acces) && (
                      <Link href={`/patients/${patient.id}/qrcode`}>
                        <Button size="sm" variant="outline" className="rounded-xl border-slate-200 dark:border-zinc-700 h-8 px-2.5">
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/patients/${patient.id}`}>
                      <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl h-8 px-3 text-xs">Dossier</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vue tableau — desktop uniquement */}
          <div className="dash-in delay-150 hidden sm:block rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 w-full">Patient</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 whitespace-nowrap">Date de naissance</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 whitespace-nowrap">Genre</th>
                    {!isAdmin && (
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 whitespace-nowrap">Accès</th>
                    )}
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, i) => {
                    const acces = patient.dossier ? accesMap.get(patient.dossier.id) : undefined
                    const tempsRestant = acces ? formatTempsRestant(acces.finAcces) : ''
                    const age = calculerAge(patient.dateNaissance)
                    const dateNaissanceFormatee = new Date(patient.dateNaissance).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    return (
                      <tr
                        key={patient.id}
                        className={`dash-in delay-${[0,75,100,150,200,225,300,375][i] ?? 300} border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/20 transition-colors`}
                      >
                        {/* Patient */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {patient.photo ? (
                                <Image
                                  src={patient.photo}
                                  alt={`${patient.nom} ${patient.prenoms}`}
                                  width={36}
                                  height={36}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-brand font-bold text-sm">
                                  {patient.nom[0]}{patient.prenoms[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {patient.nom.toUpperCase()} {patient.prenoms}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date de naissance + âge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-slate-700 dark:text-zinc-300">{dateNaissanceFormatee}</span>
                          <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">
                            ({age} ans{patient.dateNaissancePresumee && ', estimé'})
                          </span>
                        </td>

                        {/* Genre */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            patient.genre === 'M'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400'
                          }`}>
                            {patient.genre === 'M' ? 'Homme' : 'Femme'}
                          </span>
                        </td>

                        {/* Accès (personnel uniquement) */}
                        {!isAdmin && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {acces && tempsRestant ? (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                acces.modeUrgence
                                  ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              }`}>
                                {acces.modeUrgence ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {acces.modeUrgence ? 'Urgence' : tempsRestant}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-zinc-600">Aucun</span>
                            )}
                          </td>
                        )}

                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {(isAdmin || acces) && (
                              <Link href={`/patients/${patient.id}/qrcode`}>
                                <Button size="sm" variant="outline" className="rounded-xl border-slate-200 dark:border-zinc-700 h-8 px-2.5">
                                  <QrCode className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                            <Link href={`/patients/${patient.id}`}>
                              <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl h-8 px-3 text-xs">Dossier</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
