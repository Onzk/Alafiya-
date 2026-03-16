'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  QrCode,
  FileText,
  Building2,
  Shield,
  Activity,
  LogOut,
  Stethoscope,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionUser } from '@/types'

interface SidebarProps {
  user: SessionUser
}

const navigationMinistere = [
  { href: '/ministere/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/ministere/centres', label: 'Centres de santé', icon: Building2 },
  { href: '/ministere/roles', label: 'Rôles & Permissions', icon: Shield },
  { href: '/ministere/specialites', label: 'Spécialités', icon: Stethoscope },
  { href: '/logs', label: 'Journaux d\'activité', icon: Activity },
]

const navigationAdmin = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/personnels', label: 'Personnel médical', icon: Users },
  { href: '/admin/roles', label: 'Rôles', icon: Shield },
  { href: '/admin/specialites', label: 'Spécialités', icon: Stethoscope },
  { href: '/logs', label: 'Journaux d\'activité', icon: Activity },
]

const navigationPersonnel = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/patients/nouveau', label: 'Nouveau patient', icon: FileText },
  { href: '/scanner', label: 'Scanner QR', icon: QrCode },
  { href: '/urgence', label: 'Urgence', icon: AlertCircle },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navigation =
    user.niveauAcces === 'MINISTERE'
      ? navigationMinistere
      : user.niveauAcces === 'ADMIN_CENTRE'
      ? navigationAdmin
      : navigationPersonnel

  const niveauLabel =
    user.niveauAcces === 'MINISTERE'
      ? 'Ministère de la Santé'
      : user.niveauAcces === 'ADMIN_CENTRE'
      ? 'Administrateur de centre'
      : 'Personnel médical'

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 p-6 border-b border-gray-100">
        <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">A+</span>
        </div>
        <span className="font-bold text-gray-900 text-lg">Alafiya Plus</span>
      </div>

      {/* Infos utilisateur */}
      <div className="px-4 py-3 border-b border-gray-100 bg-green-50">
        <p className="text-sm font-semibold text-green-800 truncate">
          {user.nom} {user.prenoms}
        </p>
        <p className="text-xs text-green-600 truncate">{niveauLabel}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
