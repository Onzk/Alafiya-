import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Users, Activity, UserPlus, Settings, Plus, ArrowRight, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionUser } from '@/types'

function StatCard({
  label, value, sub, icon: Icon,
  lightBg, lightIcon, darkBg, darkIcon, darkGlow, delay,
}: {
  label: string; value: number; sub?: string; icon: React.ElementType
  lightBg: string; lightIcon: string; darkBg: string; darkIcon: string; darkGlow: string; delay: string
}) {
  return (
    <div className={`dash-in ${delay} relative overflow-hidden bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-700/60 p-5 hover:shadow-xl dark:hover:shadow-zinc-950/80 hover:-translate-y-1 transition-all duration-300 group`}>
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-0 dark:opacity-100 ${darkGlow} pointer-events-none transition-all duration-500 group-hover:scale-150`} />
      <div className="relative flex items-start justify-between mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 leading-tight pr-2">{label}</p>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${lightBg} dark:${darkBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`h-5 w-5 ${lightIcon} dark:${darkIcon}`} />
        </div>
      </div>
      <p className="relative text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{sub}</p>}
    </div>
  )
}

function ActionCard({
  href, icon: Icon, lightBg, lightIcon, darkBg, darkIcon, darkBorder, label, sub, delay,
}: {
  href: string; icon: React.ElementType
  lightBg: string; lightIcon: string; darkBg: string; darkIcon: string; darkBorder: string
  label: string; sub: string; delay: string
}) {
  return (
    <Link href={href}>
      <div className={`dash-in ${delay} group relative overflow-hidden bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-700/60 dark:hover:border-zinc-600 p-5 flex items-center gap-4 hover:shadow-xl dark:hover:shadow-zinc-950/80 hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full opacity-0 dark:opacity-60 ${darkBorder} transition-opacity group-hover:opacity-100`} />
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${lightBg} dark:${darkBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`h-6 w-6 ${lightIcon} dark:${darkIcon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{label}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{sub}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 flex-shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-brand" />
      </div>
    </Link>
  )
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as unknown as SessionUser
  if (!['MINISTERE', 'ADMIN_CENTRE'].includes(user.niveauAcces)) redirect('/dashboard')

  const centreId = user.centreActif
  if (!centreId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-zinc-800 dark:border dark:border-zinc-700/60 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-slate-500 dark:text-zinc-400 font-medium">Aucun centre actif sélectionné.</p>
        </div>
      </div>
    )
  }

  const [centre, totalPersonnel, personnelActif, totalPatients] = await Promise.all([
    prisma.centre.findUnique({ where: { id: centreId }, select: { nom: true } }),
    prisma.user.count({ where: { centres: { some: { centreId } }, niveauAcces: 'PERSONNEL' } }),
    prisma.user.count({ where: { centres: { some: { centreId } }, niveauAcces: 'PERSONNEL', estActif: true } }),
    prisma.patient.count({ where: { centreCreationId: centreId } }),
  ])

  const dernierPersonnel = await prisma.user.findMany({
    where: { centres: { some: { centreId } }, niveauAcces: 'PERSONNEL' },
    select: { id: true, nom: true, prenoms: true, email: true, estActif: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="dash-in delay-0 relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand/8 via-emerald-50/80 to-white dark:from-emerald-900/30 dark:via-zinc-900 dark:to-zinc-900 border border-brand/15 dark:border-emerald-700/25 p-5 sm:p-6">
        <div className="absolute right-0 top-0 w-48 h-48 bg-brand/10 dark:bg-brand/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand">Tableau de bord administrateur</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{centre?.nom ?? 'Centre de santé'}</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Gérez votre personnel et suivez l'activité du centre.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Personnel actif"    value={personnelActif} sub={`${totalPersonnel} au total`} icon={Users}    lightBg="bg-green-50"  lightIcon="text-green-600"  darkBg="bg-emerald-400/15" darkIcon="text-emerald-300" darkGlow="bg-emerald-500/15" delay="delay-75" />
        <StatCard label="Patients du centre" value={totalPatients}                                     icon={Activity} lightBg="bg-blue-50"   lightIcon="text-blue-600"   darkBg="bg-blue-400/15"   darkIcon="text-blue-300"   darkGlow="bg-blue-500/15"   delay="delay-150" />
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <ActionCard href="/admin/personnels" icon={UserPlus} lightBg="bg-green-50"  lightIcon="text-green-600"  darkBg="bg-emerald-400/15" darkIcon="text-emerald-300" darkBorder="bg-emerald-400" label="Gérer le personnel" sub="Créer et gérer les comptes" delay="delay-75" />
        <ActionCard href="/admin/roles"      icon={Settings} lightBg="bg-blue-50"   lightIcon="text-blue-600"   darkBg="bg-blue-400/15"   darkIcon="text-blue-300"   darkBorder="bg-blue-400"   label="Rôles du centre"    sub="Définir les accès locaux"  delay="delay-150" />
      </div>

      {/* Personnel récent */}
      <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-700/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Personnel médical</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">Membres récents du centre</p>
          </div>
          <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
            <Link href="/admin/personnels"><Plus className="h-4 w-4" /> Ajouter</Link>
          </Button>
        </div>
        {dernierPersonnel.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 dark:border dark:border-zinc-700/60 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucun personnel enregistré</p>
          </div>
        ) : (
          <>
            <ul>
              {dernierPersonnel.map((p, i) => (
                <li key={p.id} className={`dash-in delay-${[0,75,150,225,300][i] ?? 300} flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors group`}>
                  <div className="h-10 w-10 rounded-full bg-brand/8 dark:bg-emerald-400/12 border border-brand/10 dark:border-emerald-400/15 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                    <span className="text-brand dark:text-emerald-300 text-xs font-bold">{p.nom[0]}{p.prenoms[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.nom} {p.prenoms}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{p.email}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${p.estActif ? 'border-emerald-400/30 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-400/12' : 'border-slate-200 dark:border-zinc-700/60 text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800'}`}>
                    {p.estActif ? 'Actif' : 'Inactif'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="py-3 text-center border-t border-slate-50 dark:border-zinc-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-zinc-600">Fin de la liste du personnel récent</p>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
