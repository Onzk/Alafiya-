'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  QrCode,
  AlertCircle,
  Building2,
  Activity,
  FileText,
  Stethoscope,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionUser } from '@/types'

interface MobileNavProps {
  user: SessionUser
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()

  const items =
    user.niveauAcces === 'MINISTERE'
      ? [
          { href: '/ministere/dashboard',   label: 'Accueil',     icon: LayoutDashboard },
          { href: '/ministere/centres',     label: 'Centres',     icon: Building2 },
          { href: '/ministere/medecins',    label: 'Personnel',   icon: Users },
          { href: '/ministere/specialites', label: 'Spécialités', icon: Stethoscope },
          { href: '/ministere/roles',       label: 'Rôles',       icon: Shield },
        ]
      : user.niveauAcces === 'ADMIN_CENTRE'
      ? [
          { href: '/admin/dashboard',  label: 'Accueil',   icon: LayoutDashboard },
          { href: '/admin/personnels', label: 'Personnel', icon: Users },
          { href: '/admin/roles',      label: 'Rôles',     icon: Shield },
          { href: '/logs',             label: 'Journaux',  icon: Activity },
        ]
      : [
          { href: '/dashboard',        label: 'Accueil',  icon: LayoutDashboard },
          { href: '/patients',         label: 'Patients', icon: Users },
          { href: '/patients/nouveau', label: 'Nouveau',  icon: FileText },
          { href: '/scanner',          label: 'Scanner',  icon: QrCode },
          { href: '/urgence',          label: 'Urgence',  icon: AlertCircle },
        ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex items-stretch h-16 safe-area-pb">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        const isUrgence = href === '/urgence'
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
              isUrgence
                ? isActive
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400'
                : isActive
                ? 'text-brand'
                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
            )}
          >
            <div className={cn(
              'relative flex items-center justify-center h-7 w-7 rounded-xl transition-all',
              isActive && !isUrgence && 'bg-brand/10 dark:bg-brand/20',
              isActive && isUrgence && 'bg-red-50 dark:bg-red-950/40',
            )}>
              <Icon className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem]" />
              {isActive && (
                <span className={cn(
                  'absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full',
                  isUrgence ? 'bg-red-500' : 'bg-brand'
                )} />
              )}
            </div>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
