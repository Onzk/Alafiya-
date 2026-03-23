import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import {
  QrCode, UserPlus, FileText, AlertTriangle,
  Users, Stethoscope, ArrowRight, TrendingUp, TrendingDown,
  Activity, Heart, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { SessionUser } from '@/types'

/* ─── Stat card ─── */
function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; iconBg: string; iconColor: string
  trend?: string; trendUp?: boolean
}) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'}`}>
            {trendUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Bar chart (SVG) ─── */
function WeeklyChart({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = 28
  const gap = 14
  const chartH = 80
  const totalW = data.length * (barW + gap) - gap

  return (
    <div className="mt-4">
      <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 24}`} preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * chartH, 4)
          const x = i * (barW + gap)
          const y = chartH - barH
          const isToday = i === data.length - 1
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={6} ry={6}
                fill={isToday ? '#21c488' : '#e9f9f2'}
                className="dark:opacity-80"
              />
              <text
                x={x + barW / 2} y={chartH + 16}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={isToday ? '#21c488' : '#94a3b8'}
              >
                {d.day}
              </text>
              {isToday && d.value > 0 && (
                <text
                  x={x + barW / 2} y={y - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#21c488"
                >
                  {d.value}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ─── Donut chart (SVG) ─── */
function DonutChart({ segments }: { segments: { color: string; pct: number }[] }) {
  const r = 36
  const cx = 44
  const cy = 44
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} className="dark:stroke-zinc-800" />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

/* ─── Quick action link ─── */
function QuickAction({ href, icon: Icon, iconBg, iconColor, label, sub }: {
  href: string; icon: React.ElementType; iconBg: string; iconColor: string; label: string; sub: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors group">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight whitespace-nowrap truncate">{label}</p>
        <p className="text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap truncate">{sub}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser
  if (user.niveauAcces === 'SUPERADMIN') redirect('/superadmin/dashboard')
  if (user.niveauAcces === 'ADMIN_CENTRE') redirect('/admin/dashboard')

  /* ── Data fetching ── */
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [totalPatients, derniersEnregistrements, consultationsAujourdhui, consultationsSemaine] = await Promise.all([
    prisma.patient.count({ where: { creeParId: user.id } }),
    prisma.enregistrementMedical.findMany({
      where: { medecinId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { specialite: { select: { nom: true } } },
    }),
    prisma.enregistrementMedical.count({
      where: { medecinId: user.id, dateConsultation: { gte: startOfToday } },
    }),
    prisma.enregistrementMedical.findMany({
      where: { medecinId: user.id, dateConsultation: { gte: sevenDaysAgo } },
      select: { dateConsultation: true },
    }),
  ])

  const nbSpecialites = user.specialites?.length || 0

  /* ── Weekly chart data ── */
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const label = dayNames[d.getDay()]
    const count = consultationsSemaine.filter(c => {
      const cd = new Date(c.dateConsultation)
      return cd.getFullYear() === d.getFullYear() &&
        cd.getMonth() === d.getMonth() &&
        cd.getDate() === d.getDate()
    }).length
    return { day: label, value: count }
  })

  const totalSemaine = weeklyData.reduce((s, d) => s + d.value, 0)

  /* ── Speciality breakdown segments ── */
  const specColors = ['#21c488', '#f59e0b', '#a78bfa', '#60a5fa', '#f87171']
  const totalSpec = Math.max(nbSpecialites, 1)
  const specSegments = Array.from({ length: Math.min(nbSpecialites, 5) }, (_, i) => ({
    color: specColors[i],
    pct: 100 / totalSpec,
  }))
  if (specSegments.length === 0) specSegments.push({ color: '#e2e8f0', pct: 100 })

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── EN-TÊTE ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">
            Bonjour {user.prenoms} — voici votre activité médicale du jour.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button asChild size="sm" variant="outline" className="rounded-xl hidden sm:flex gap-1.5 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
            <Link href="/scanner"><QrCode className="h-4 w-4" /> Scanner QR</Link>
          </Button>
          <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
            <Link href="/patients/nouveau"><UserPlus className="h-4 w-4" /> Nouveau patient</Link>
          </Button>
        </div>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Patients créés" value={totalPatients} sub="enregistrés par moi"
          icon={Users} iconBg="bg-brand/10 dark:bg-brand/15" iconColor="text-brand"
          trend="+12%" trendUp
        />
        <StatCard
          label="Consultations aujourd'hui" value={consultationsAujourdhui} sub="depuis minuit"
          icon={Stethoscope} iconBg="bg-orange-50 dark:bg-orange-400/15" iconColor="text-orange-500"
          trend={consultationsAujourdhui > 0 ? `+${consultationsAujourdhui}` : undefined} trendUp
        />
        <StatCard
          label="Spécialités" value={nbSpecialites} sub="assignées à mon profil"
          icon={Activity} iconBg="bg-blue-50 dark:bg-blue-400/15" iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Cette semaine" value={totalSemaine} sub="consultations en 7 jours"
          icon={Clock} iconBg="bg-purple-50 dark:bg-purple-400/15" iconColor="text-purple-600 dark:text-purple-400"
          trend={totalSemaine > 0 ? `${totalSemaine}` : undefined} trendUp={totalSemaine > 0}
        />
      </div>

      {/* ── LAYOUT 2 COLONNES ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">

        {/* ══ COLONNE PRINCIPALE ══ */}
        <div className="space-y-5">

          {/* Activité hebdomadaire + Spécialités breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5">

            {/* Bar chart */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Activité hebdomadaire</h2>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Consultations des 7 derniers jours</p>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950 px-3 py-1 rounded-full">
                  Total : {totalSemaine}
                </span>
              </div>
              <WeeklyChart data={weeklyData} />
            </div>

            {/* Donut breakdown */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 flex flex-col items-center justify-center gap-4 min-w-[180px]">
              <div className="text-center">
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Spécialités</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Répartition</p>
              </div>
              <DonutChart segments={specSegments} />
              <div className="w-full space-y-1.5">
                {user.specialites?.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: specColors[i] }} />
                    <span className="text-xs text-slate-600 dark:text-zinc-300 truncate">{s}</span>
                  </div>
                ))}
                {(nbSpecialites === 0) && (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 text-center">Aucune spécialité</p>
                )}
              </div>
            </div>
          </div>

          {/* Carte urgence / highlight (style sombre) */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900 border border-zinc-700/60 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(33,196,136,0.15),transparent_60%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-brand" />
                  </div>
                  <span className="text-sm font-bold text-white/90">Accès rapide urgence</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-white/50 font-medium">Patients ce mois</p>
                    <p className="text-2xl font-extrabold text-white tabular-nums mt-0.5">{totalPatients}</p>
                    <p className="text-xs text-brand font-semibold mt-1">↑ actifs</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 font-medium">Consultations semaine</p>
                    <p className="text-2xl font-extrabold text-white tabular-nums mt-0.5">{totalSemaine}</p>
                    <p className="text-xs text-brand font-semibold mt-1">7 derniers jours</p>
                  </div>
                </div>
              </div>
              <Link href="/urgence">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-colors cursor-pointer">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
              </Link>
            </div>
          </div>

          {/* Dernières consultations */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Dernières consultations</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  {derniersEnregistrements.length} consultation{derniersEnregistrements.length !== 1 ? 's' : ''} récente{derniersEnregistrements.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs h-8 px-3 border-slate-200 dark:border-zinc-700">
                <Link href="/patients">
                  Voir tout <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {derniersEnregistrements.length === 0 ? (
              <div className="py-12 text-center px-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Aucune consultation récente</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">Commencez par enregistrer un patient</p>
                <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl px-5">
                  <Link href="/patients/nouveau">Nouveau patient</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Spécialité</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Date</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Statut</span>
                </div>
                <ul>
                  {derniersEnregistrements.map((enr) => (
                    <li key={enr.id} className="flex sm:grid sm:grid-cols-[1fr_1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="h-4 w-4 text-brand" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{enr.specialite.nom}</p>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block">{formatDateTime(enr.dateConsultation)}</p>
                      <div className="flex-shrink-0 flex items-center gap-1 bg-brand/8 dark:bg-brand/12 border border-brand/20 rounded-full px-2.5 py-1">
                        <TrendingUp className="h-3 w-3 text-brand" />
                        <span className="text-[10px] font-bold text-brand">Complété</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* ══ COLONNE DROITE ══ */}
        <div className="space-y-4">

          {/* Carte profil */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-brand/20 via-brand/10 to-transparent dark:from-brand/15 dark:to-transparent relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(33,196,136,0.2),transparent_70%)]" />
            </div>
            <div className="px-5 pb-5 -mt-7">
              <div className="h-14 w-14 rounded-2xl bg-brand flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-md mb-3">
                <span className="text-white font-extrabold text-lg">{user.nom[0]}{user.prenoms[0]}</span>
              </div>
              <p className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{user.prenoms} {user.nom}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Personnel médical</p>

              {/* Indicateur de statut */}
              <div className="mt-3 inline-flex items-center gap-1.5 bg-brand/8 dark:bg-brand/12 border border-brand/20 rounded-full px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-[10px] font-bold text-brand">En ligne</span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-zinc-800 grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-950">
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">{totalPatients}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mt-0.5">Patients</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-950">
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">{nbSpecialites}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mt-0.5">Spécialités</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 px-3 mb-2">Actions rapides</p>
            <div className="space-y-0.5">
              <QuickAction href="/patients/nouveau" icon={UserPlus} iconBg="bg-brand/10 dark:bg-brand/15" iconColor="text-brand" label="Nouveau patient" sub="Enregistrement" />
              <QuickAction href="/scanner" icon={QrCode} iconBg="bg-blue-50 dark:bg-blue-400/15" iconColor="text-blue-600 dark:text-blue-400" label="Scanner QR" sub="Accès dossier" />
              <QuickAction href="/patients" icon={FileText} iconBg="bg-purple-50 dark:bg-purple-400/15" iconColor="text-purple-600 dark:text-purple-400" label="Mes patients" sub="Historique complet" />
              <QuickAction href="/urgence" icon={AlertTriangle} iconBg="bg-red-50 dark:bg-red-400/15" iconColor="text-red-500 dark:text-red-400" label="Urgence" sub="Accès rapide" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
