'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoIcon } from '@/components/ui/logo'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, QrCode, FileText, Building2,
  Shield, Activity, LogOut, Stethoscope, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionUser } from '@/types'

interface SidebarProps { user: SessionUser }

const navigationMinistere = [
  { href: '/ministere/dashboard', label: 'Tableau de bord',   icon: LayoutDashboard },
  { href: '/ministere/centres',   label: 'Centres de santé',  icon: Building2 },
  { href: '/ministere/roles',     label: 'Rôles & Permissions', icon: Shield },
  { href: '/ministere/specialites', label: 'Spécialités',     icon: Stethoscope },
  { href: '/logs',                label: "Journaux d'activité", icon: Activity },
]

const navigationAdmin = [
  { href: '/admin/dashboard',   label: 'Tableau de bord',   icon: LayoutDashboard },
  { href: '/admin/personnels',  label: 'Personnel médical', icon: Users },
  { href: '/admin/roles',       label: 'Rôles',             icon: Shield },
  { href: '/logs',              label: "Journaux d'activité", icon: Activity },
]

const navigationPersonnel = [
  { href: '/dashboard',        label: 'Tableau de bord',  icon: LayoutDashboard },
  { href: '/patients',         label: 'Patients',         icon: Users },
  { href: '/patients/nouveau', label: 'Nouveau patient',  icon: FileText },
  { href: '/scanner',          label: 'Scanner QR',       icon: QrCode },
  { href: '/urgence',          label: 'Urgence',          icon: AlertCircle },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navigation =
    user.niveauAcces === 'MINISTERE'    ? navigationMinistere :
    user.niveauAcces === 'ADMIN_CENTRE' ? navigationAdmin :
    navigationPersonnel

  const roleLabel =
    user.niveauAcces === 'MINISTERE'    ? 'MINISTÈRE DE LA SANTÉ' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'ADMINISTRATEUR' :
    'PERSONNEL MÉDICAL'

  const roleSubLabel =
    user.niveauAcces === 'MINISTERE'    ? 'République Togolaise' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Centre de santé' :
    `${user.nom} ${user.prenoms}`

  return (
    <aside className="flex h-full w-64 flex-col bg-white dark:bg-zinc-950 border-r border-slate-100 dark:border-zinc-800">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0">
        <div className="h-9 w-9 flex items-center justify-center flex-shrink-0">
          <LogoIcon className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
          Alafiya <span className="text-brand">Plus</span>
        </span>
      </div>

      {/* Carte rôle utilisateur */}
      <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl bg-brand/8 dark:bg-brand/12 border border-brand/15 dark:border-brand/20">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-brand mb-0.5">{roleLabel}</p>
        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{roleSubLabel}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isUrgence = item.href === '/urgence'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? isUrgence
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-brand text-white shadow-sm shadow-brand/20'
                  : isUrgence
                  ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 pb-4 border-t border-slate-100 dark:border-zinc-800 pt-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
