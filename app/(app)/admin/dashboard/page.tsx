import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Users, Activity, UserPlus, Settings, Plus, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionUser } from '@/types'
import DashboardCharts from '@/components/admin/dashboard-charts'

/* ── Stat card ── */
function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, accentColor, cardBg, delay,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType
  iconBg: string; iconColor: string; accentColor: string; cardBg: string
  delay: string
}) {
  return (
    <div className={`dash-in ${delay} relative ${cardBg} rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 overflow-hidden hover:shadow-md transition-all duration-200 group`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor} rounded-t-2xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tabular-nums leading-none">{value}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

/* ── Action card ── */
function ActionCard({
  href, icon: Icon, iconBg, iconColor, label, sub, delay,
}: {
  href: string; icon: React.ElementType
  iconBg: string; iconColor: string
  label: string; sub: string; delay: string
}) {
  return (
    <Link href={href}>
      <div className={`dash-in ${delay} group bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-brand/30 dark:hover:border-brand/30 p-5 flex items-center gap-3.5 hover:shadow-md transition-all duration-200 cursor-pointer h-full`}>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{label}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{sub}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-brand transition-all duration-200" />
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
          <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-slate-500 dark:text-zinc-400 font-medium">Aucun centre actif sélectionné.</p>
        </div>
      </div>
    )
  }

  const [centre, totalPersonnel, personnelActif, totalPatients] = await Promise.all([
    prisma.centre.findUnique({ where: { id: centreId }, select: { nom: true, type: true, region: true } }),
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
    <div className="space-y-5 max-w-[1400px]">

      {/* ── EN-TÊTE ── */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {centre?.nom ?? 'Centre de santé'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Tableau de bord administrateur · Vue d'ensemble du centre
          </p>
        </div>
        <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0">
          <Link href="/admin/personnels"><Plus className="h-4 w-4" /> Ajouter personnel</Link>
        </Button>
      </div>

      {/* ── STATS + ACTIONS (même ligne, 4 colonnes) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Personnel actif" value={personnelActif} sub={`${totalPersonnel} au total`}
          icon={Users}
          iconBg="bg-brand/20 dark:bg-brand/25" iconColor="text-brand"
          accentColor="bg-brand"
          cardBg="bg-brand/10 dark:bg-brand/15"
          delay="delay-75"
        />
        <StatCard
          label="Patients du centre" value={totalPatients}
          icon={Activity}
          iconBg="bg-blue-500/20 dark:bg-blue-400/25" iconColor="text-blue-600 dark:text-blue-300"
          accentColor="bg-blue-500"
          cardBg="bg-blue-500/10 dark:bg-blue-500/15"
          delay="delay-150"
        />
        <ActionCard
          href="/admin/personnels" icon={UserPlus}
          iconBg="bg-brand/10 dark:bg-brand/15" iconColor="text-brand"
          label="Gérer le personnel" sub="Créer et gérer les comptes"
          delay="delay-[200ms]"
        />
        <ActionCard
          href="/admin/roles" icon={Settings}
          iconBg="bg-blue-50 dark:bg-blue-400/15" iconColor="text-blue-600 dark:text-blue-300"
          label="Rôles du centre" sub="Définir les accès locaux"
          delay="delay-[250ms]"
        />
      </div>

      {/* ── CHARTS ── */}
      <div className="dash-in delay-300">
        <DashboardCharts />
      </div>

      {/* ── PERSONNEL RÉCENT ── */}
      <div className="dash-in delay-[350ms] bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Personnel médical</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
              Membres récents du centre
            </p>
          </div>
          <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 text-xs h-8 px-3">
            <Link href="/admin/personnels"><Plus className="h-3.5 w-3.5" /> Ajouter</Link>
          </Button>
        </div>

        {dernierPersonnel.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucun personnel enregistré</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Nom</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Email</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Statut</span>
            </div>
            <ul>
              {dernierPersonnel.map((p, i) => (
                <li key={p.id} className={`dash-in delay-${[0, 75, 150, 225, 300][i] ?? 300} flex sm:grid sm:grid-cols-[1fr_1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand font-bold text-xs">{p.nom[0]}{p.prenoms[0]}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.nom} {p.prenoms}</p>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block truncate">{p.email}</p>
                  <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                    p.estActif
                      ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                      : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                  }`}>
                    {p.estActif
                      ? <><CheckCircle2 className="h-3 w-3" /> Actif</>
                      : <><XCircle className="h-3 w-3" /> Inactif</>
                    }
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
