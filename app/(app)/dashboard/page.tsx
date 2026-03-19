import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import {
  QrCode, UserPlus, FileText, AlertTriangle,
  Users, Stethoscope, Clock, ArrowRight, TrendingUp, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { SessionUser } from '@/types'

/* ── Stat card ── */
function StatCard({
  label, value, sub, icon: Icon,
  lightBg, lightIcon, darkBg, darkIcon, darkGlow,
  delay,
}: {
  label: string; value: number; sub?: string
  icon: React.ElementType
  lightBg: string; lightIcon: string
  darkBg: string; darkIcon: string; darkGlow: string
  delay: string
}) {
  return (
    <div className={`dash-in ${delay} relative overflow-hidden bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-700/60 p-5 hover:shadow-xl dark:hover:shadow-zinc-950/80 hover:-translate-y-1 transition-all duration-300 group`}>
      {/* Glow décoratif dark */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-0 dark:opacity-100 ${darkGlow} pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-100`} />

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

/* ── Action card ── */
function ActionCard({
  href, icon: Icon,
  lightBg, lightIcon, darkBg, darkIcon, darkBorder,
  label, sub, delay,
}: {
  href: string; icon: React.ElementType
  lightBg: string; lightIcon: string
  darkBg: string; darkIcon: string; darkBorder: string
  label: string; sub: string; delay: string
}) {
  return (
    <Link href={href}>
      <div className={`dash-in ${delay} group relative overflow-hidden bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-700/60 dark:hover:border-zinc-600 p-5 flex items-center gap-4 hover:shadow-xl dark:hover:shadow-zinc-950/80 hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
        {/* Accent border gauche en dark */}
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full opacity-0 dark:opacity-60 ${darkBorder} transition-opacity group-hover:opacity-100`} />

        <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${lightBg} dark:${darkBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`h-6 w-6 ${lightIcon} dark:${darkIcon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{label}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{sub}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand" />
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser
  if (user.niveauAcces === 'MINISTERE') redirect('/ministere/dashboard')
  if (user.niveauAcces === 'ADMIN_CENTRE') redirect('/admin/dashboard')

  const [totalPatients, derniersEnregistrements] = await Promise.all([
    prisma.patient.count({ where: { creeParId: user.id } }),
    prisma.enregistrementMedical.findMany({
      where: { medecinId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { specialite: { select: { nom: true } } },
    }),
  ])

  return (
    <div className="space-y-6">

      {/* ── BANNER GREETING ── */}
      <div className="dash-in delay-0 relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand/8 via-emerald-50/80 to-white dark:from-emerald-900/30 dark:via-zinc-900 dark:to-zinc-900 border border-brand/15 dark:border-emerald-700/25 p-5 sm:p-6">
        {/* Orbe décoratif */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-brand/10 dark:bg-brand/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute right-16 bottom-0 w-24 h-24 bg-emerald-400/10 dark:bg-emerald-400/6 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand">Personnel médical — en ligne</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Bonjour, {user.prenoms} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Bonne journée. Voici un résumé de votre activité.</p>
          </div>
          <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 border border-brand/15 dark:border-zinc-700 items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="h-6 w-6 text-brand" />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Patients créés" value={totalPatients} sub="enregistrés"
          icon={Users}
          lightBg="bg-green-50" lightIcon="text-green-600"
          darkBg="bg-emerald-400/15" darkIcon="text-emerald-300"
          darkGlow="bg-emerald-500/15"
          delay="delay-75"
        />
        <StatCard
          label="Spécialités" value={user.specialites?.length || 0} sub="assignées"
          icon={Stethoscope}
          lightBg="bg-blue-50" lightIcon="text-blue-600"
          darkBg="bg-blue-400/15" darkIcon="text-blue-300"
          darkGlow="bg-blue-500/15"
          delay="delay-150"
        />
        <StatCard
          label="Consultations" value={derniersEnregistrements.length} sub="récentes"
          icon={Clock}
          lightBg="bg-purple-50" lightIcon="text-purple-600"
          darkBg="bg-purple-400/15" darkIcon="text-purple-300"
          darkGlow="bg-purple-500/15"
          delay="delay-225"
        />
      </div>

      {/* ── ACTIONS ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ActionCard href="/scanner"          icon={QrCode}        lightBg="bg-green-50"  lightIcon="text-green-600"  darkBg="bg-emerald-400/15" darkIcon="text-emerald-300" darkBorder="bg-emerald-400" label="Scanner QR"       sub="Accès dossier"   delay="delay-75" />
        <ActionCard href="/patients/nouveau" icon={UserPlus}      lightBg="bg-blue-50"   lightIcon="text-blue-600"   darkBg="bg-blue-400/15"   darkIcon="text-blue-300"   darkBorder="bg-blue-400"   label="Nouveau patient" sub="Enregistrement"  delay="delay-150" />
        <ActionCard href="/patients"         icon={FileText}      lightBg="bg-purple-50" lightIcon="text-purple-600" darkBg="bg-purple-400/15" darkIcon="text-purple-300" darkBorder="bg-purple-400" label="Mes patients"    sub="Historique"      delay="delay-225" />
        <ActionCard href="/urgence"          icon={AlertTriangle} lightBg="bg-red-50"    lightIcon="text-red-600"    darkBg="bg-red-400/15"    darkIcon="text-red-300"    darkBorder="bg-red-400"    label="Urgence"         sub="Accès rapide"    delay="delay-300" />
      </div>

      {/* ── CONSULTATIONS ── */}
      <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-700/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Dernières consultations</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">Historique récent</p>
          </div>
          <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
            <Link href="/patients">
              <ArrowRight className="h-4 w-4" /> Voir tout
            </Link>
          </Button>
        </div>

        {derniersEnregistrements.length === 0 ? (
          <div className="py-14 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-zinc-800 dark:border dark:border-zinc-700/60 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Aucune consultation récente</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-5">Commencez par enregistrer un patient</p>
            <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl px-5">
              <Link href="/patients/nouveau">Nouveau patient</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul>
              {derniersEnregistrements.map((enr, i) => (
                <li key={enr.id} className={`dash-in delay-${[0,75,150,225,300][i] ?? 300} flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors group`}>
                  <span className="text-xs font-bold text-slate-300 dark:text-zinc-600 w-4 flex-shrink-0 text-center tabular-nums">{i + 1}</span>
                  <div className="h-10 w-10 rounded-xl bg-brand/8 dark:bg-emerald-400/12 border border-brand/10 dark:border-emerald-400/15 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                    <Stethoscope className="h-5 w-5 text-brand dark:text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{enr.specialite.nom}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">{formatDateTime(enr.dateConsultation)}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-400/12 border border-emerald-100 dark:border-emerald-400/20 rounded-full px-2.5 py-1">
                    <TrendingUp className="h-3 w-3 text-brand dark:text-emerald-300" />
                    <span className="text-[10px] font-bold text-brand dark:text-emerald-300">Complété</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="py-3 text-center border-t border-slate-50 dark:border-zinc-800">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-zinc-600">
                Fin de la liste des consultations
              </p>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
