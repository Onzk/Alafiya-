'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoIcon } from '@/components/ui/logo'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, QrCode, FileText, Building2,
  Shield, Activity, LogOut, Stethoscope, AlertCircle, UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionUser } from '@/types'

interface SidebarProps { user: SessionUser }

type NavItem = { href: string; label: string; icon: React.ElementType; isUrgence?: boolean }
type NavGroup = { section: string | null; items: NavItem[] }

const navigationMinistere: NavGroup[] = [
  { section: null, items: [
    { href: '/ministere/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  ]},
  { section: 'RÉSEAU', items: [
    { href: '/ministere/centres',    label: 'Centres de santé',    icon: Building2 },
    { href: '/ministere/medecins',   label: 'Personnel médical',   icon: Users },
    { href: '/ministere/specialites',label: 'Spécialités',         icon: Stethoscope },
    { href: '/ministere/roles',      label: 'Types de personnel',  icon: Shield },
  ]},
  { section: 'SUIVI', items: [
    { href: '/logs', label: "Journaux d'activité", icon: Activity },
  ]},
]

const navigationAdmin: NavGroup[] = [
  { section: null, items: [
    { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  ]},
  { section: 'CENTRE', items: [
    { href: '/admin/personnels', label: 'Personnel médical', icon: Users },
    { href: '/admin/patients',   label: 'Patients',          icon: UserRound },
    { href: '/admin/roles',      label: 'Types de personnel', icon: Shield },
  ]},
  { section: 'SUIVI', items: [
    { href: '/logs', label: "Journaux d'activité", icon: Activity },
  ]},
]

const navigationPersonnel: NavGroup[] = [
  { section: null, items: [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  ]},
  { section: 'PATIENTS', items: [
    { href: '/patients',         label: 'Patients',        icon: Users },
    { href: '/patients/nouveau', label: 'Nouveau patient', icon: FileText },
  ]},
  { section: 'OUTILS', items: [
    { href: '/scanner', label: 'Scanner QR', icon: QrCode },
    { href: '/urgence', label: 'Urgence',    icon: AlertCircle, isUrgence: true },
  ]},
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const groups =
    user.niveauAcces === 'MINISTERE'    ? navigationMinistere :
    user.niveauAcces === 'ADMIN_CENTRE' ? navigationAdmin :
    navigationPersonnel

  const roleLabel =
    user.niveauAcces === 'MINISTERE'    ? 'Ministère de la Santé' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Admin de centre' :
    'Personnel médical'

  return (
    <aside className="relative flex h-full w-64 flex-col overflow-hidden rounded-2xl
      bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900
      dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950
      dark:border dark:border-zinc-800">

      {/* Radial glow — light mode only */}
      <div className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-0"
        style={{ background: 'radial-gradient(ellipse at 30% 15%, #34d399 0%, transparent 65%)' }} />

      {/* Decorative circles */}
      <div className="pointer-events-none absolute right-4 top-8 h-24 w-24 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute bottom-36 left-0 h-16 w-16 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/5 translate-x-1/2 translate-y-1/2" />

      {/* Logo */}
      <div className="relative z-10 flex h-24 flex-shrink-0 items-center gap-0 px-5 py-2">
        <LogoIcon className="h-12 w-12 dark:text-primary text-white" />
        <span className="text-2xl font-extrabold tracking-tight text-white">
          Alafiya <span className="text-emerald-200 dark:text-emerald-700">Plus</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <p className="px-3 mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white/40 dark:text-zinc-500">
                {group.section}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const isUrgence = item.isUrgence
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 h-12 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                      isActive
                        ? isUrgence
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-white text-emerald-700 shadow-sm dark:bg-emerald-500 dark:text-white dark:border dark:border-emerald-500/30'
                        : isUrgence
                        ? 'text-red-300 hover:bg-red-500 hover:text-red-200 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300'
                        : 'text-white/75 hover:bg-white/15 hover:text-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bas : logout */}
      <div className="relative z-10 flex-shrink-0 p-3 border-t border-white/10 dark:border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 h-12 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 text-white/75 hover:bg-white/15 hover:text-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
