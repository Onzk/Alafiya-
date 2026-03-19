import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/db'
import { Building2, Users, FileText, Zap, Settings, Stethoscope, Plus, ArrowRight, UserCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionUser } from '@/types'

/* ── Stat card style DentaClinic ── */
function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, accentColor, delay,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType
  iconBg: string; iconColor: string; accentColor: string
  delay: string
}) {
  return (
    <div className={`dash-in ${delay} relative bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 overflow-hidden hover:shadow-md transition-all duration-200 group`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor} rounded-t-2xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tabular-nums leading-none">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">{sub}</p>}
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
      <div className={`dash-in ${delay} group bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-brand/30 dark:hover:border-brand/30 p-4 flex items-center gap-3.5 hover:shadow-md transition-all duration-200 cursor-pointer`}>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-200`}>
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

export default async function MinistereDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as unknown as SessionUser
  if (user.niveauAcces !== 'MINISTERE') redirect('/dashboard')

  const [centresActifs, totalCentres, totalPatients, totalConsultations, totalPersonnel] = await Promise.all([
    prisma.centre.count({ where: { estActif: true } }),
    prisma.centre.count(),
    prisma.patient.count(),
    prisma.enregistrementMedical.count(),
    prisma.user.count({ where: { niveauAcces: 'PERSONNEL' } }),
  ])

  const [derniersCentres, derniersMedecins] = await Promise.all([
    prisma.centre.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { admin: { select: { nom: true, prenoms: true } } },
    }),
    prisma.user.findMany({
      where: { niveauAcces: 'PERSONNEL' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, nom: true, prenoms: true, email: true, estActif: true, createdAt: true,
        specialites: { include: { specialite: { select: { nom: true } } } },
        centres: { include: { centre: { select: { nom: true } } }, take: 1 },
      },
    }),
  ])

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── EN-TÊTE PAGE ── */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Tableau de bord national
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Ministère de la Santé · Vue d'ensemble du réseau de santé
          </p>
        </div>
        <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0">
          <Link href="/ministere/centres"><Plus className="h-4 w-4" /> Nouveau centre</Link>
        </Button>
      </div>

      {/* Stats 1 ligne */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Centres actifs" value={centresActifs} sub={`${totalCentres} au total`}
          icon={Building2}
          iconBg="bg-brand/10 dark:bg-brand/15" iconColor="text-brand"
          accentColor="bg-brand"
          delay="delay-75"
        />
        <StatCard
          label="Patients enregistrés" value={totalPatients}
          icon={Users}
          iconBg="bg-blue-50 dark:bg-blue-400/15" iconColor="text-blue-600 dark:text-blue-300"
          accentColor="bg-blue-500"
          delay="delay-150"
        />
        <StatCard
          label="Consultations" value={totalConsultations}
          icon={FileText}
          iconBg="bg-purple-50 dark:bg-purple-400/15" iconColor="text-purple-600 dark:text-purple-300"
          accentColor="bg-purple-500"
          delay="delay-225"
        />
        <StatCard
          label="Personnel médical" value={totalPersonnel}
          icon={Zap}
          iconBg="bg-orange-50 dark:bg-orange-400/15" iconColor="text-orange-500 dark:text-orange-300"
          accentColor="bg-orange-500"
          delay="delay-300"
        />
      </div>

      {/* Actions */}
      <div className="dash-in delay-150">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2.5">Gestion nationale</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <ActionCard href="/ministere/centres"      icon={Building2}   iconBg="bg-brand/10 dark:bg-brand/15"       iconColor="text-brand"                          label="Gérer les centres" sub="Configuration & statuts" delay="delay-0" />
          <ActionCard href="/ministere/roles"        icon={Settings}    iconBg="bg-blue-50 dark:bg-blue-400/15"     iconColor="text-blue-600 dark:text-blue-300"    label="Rôles & Accès"     sub="Matrice de sécurité"   delay="delay-75" />
          <ActionCard href="/ministere/specialites"  icon={Stethoscope} iconBg="bg-purple-50 dark:bg-purple-400/15" iconColor="text-purple-600 dark:text-purple-300" label="Spécialités"        sub="Catalogue médical"     delay="delay-150" />
        </div>
      </div>

      {/* Derniers médecins */}
      <div className="dash-in delay-225 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Médecins récemment enregistrés</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
              10 derniers médecins du réseau
            </p>
          </div>
          <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 text-xs h-8 px-3">
            <Link href="/ministere/medecins"><Plus className="h-3.5 w-3.5" /> Voir tous</Link>
          </Button>
        </div>

        {derniersMedecins.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucun médecin enregistré</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Médecin</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Centre</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Spécialités</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Statut</span>
            </div>
            <ul>
              {derniersMedecins.map((m, i) => {
                const centre = m.centres[0]?.centre
                return (
                  <li key={m.id} className={`dash-in delay-${[0,75,150,225,300][Math.min(i,4)]} flex sm:grid sm:grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand font-bold text-xs">{m.nom[0]}{m.prenoms[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Dr. {m.nom} {m.prenoms}</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 truncate hidden sm:block">{m.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block truncate">
                      {centre?.nom ?? <span className="text-slate-300 dark:text-zinc-600">—</span>}
                    </p>
                    <div className="hidden sm:flex flex-wrap gap-1">
                      {m.specialites.length > 0
                        ? m.specialites.slice(0, 2).map((sp) => (
                            <span key={sp.specialite.nom} className="text-[10px] bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                              {sp.specialite.nom}
                            </span>
                          ))
                        : <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                      }
                    </div>
                    <div className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                      m.estActif
                        ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                    }`}>
                      {m.estActif ? <><UserCheck className="h-2.5 w-2.5" /> Actif</> : <><XCircle className="h-2.5 w-2.5" /> Inactif</>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* Derniers centres */}
      <div className="dash-in delay-300 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Derniers centres enregistrés</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
              Activité récente du réseau
            </p>
          </div>
          <Button asChild size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 text-xs h-8 px-3">
            <Link href="/ministere/centres"><Plus className="h-3.5 w-3.5" /> Nouveau centre</Link>
          </Button>
        </div>

        {derniersCentres.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucun centre enregistré</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Centre</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Région</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Statut</span>
            </div>
            <ul>
              {derniersCentres.map((centre, i) => (
                <li key={centre.id} className={`dash-in delay-${[0,75,150,225,300][i] ?? 300} flex sm:grid sm:grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{centre.nom}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">{centre.type}</span>
                        {centre.admin && (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:inline truncate">· {centre.admin.nom} {centre.admin.prenoms}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block whitespace-nowrap">{centre.region}</span>
                  <div className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                    centre.estActif
                      ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                      : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                  }`}>
                    {centre.estActif ? 'Actif' : 'Inactif'}
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
