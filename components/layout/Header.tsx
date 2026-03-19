'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search, Menu } from 'lucide-react'
import { LogoIcon } from '@/components/ui/logo'
import { SessionUser } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'

interface HeaderProps { user: SessionUser }

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':           'Tableau de bord',
  '/patients':            'Patients',
  '/patients/nouveau':    'Nouveau patient',
  '/scanner':             'Scanner QR',
  '/urgence':             'Urgence',
  '/admin/dashboard':     'Tableau de bord',
  '/admin/personnels':    'Personnel médical',
  '/admin/roles':         'Rôles',
  '/ministere/dashboard': 'Tableau de bord',
  '/ministere/centres':   'Centres de santé',
  '/ministere/roles':     'Rôles & Permissions',
  '/ministere/specialites': 'Spécialités',
  '/logs':                "Journaux d'activité",
}

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + '/')) return label
  }
  return 'Alafiya Plus'
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  const displayName =
    user.niveauAcces === 'MINISTERE'
      ? 'Ministère'
      : `${user.prenoms} ${user.nom}`

  const roleLabel =
    user.niveauAcces === 'MINISTERE'    ? 'Administrateur National' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Admin de centre' :
    'Personnel médical'

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 lg:px-7">

      {/* Gauche : logo mobile + titre desktop */}
      <div className="flex items-center gap-4">
        {/* Logo visible uniquement sur mobile */}
        <Link href="/" className="flex lg:hidden items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <LogoIcon className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white text-base">
            Alafiya <span className="text-emerald-500">Plus</span>
          </span>
        </Link>

        {/* Titre de la page — desktop */}
        <div className="hidden lg:block">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
            {title}
          </h2>
        </div>
      </div>

      {/* Centre : barre de recherche — desktop */}
      <div className="hidden lg:flex flex-1 max-w-xs mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher patients, dossiers…"
            className="w-full h-12 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 pl-9 pr-4 py-2 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Droite : actions */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />

        <button className="relative p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
          <Bell className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem]" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </button>

        {/* Séparateur */}
        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-zinc-800" />

        {/* Avatar + nom */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">{roleLabel}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-emerald-500/20">
            <span className="text-white font-bold text-xs">
              {user.nom[0]}{user.prenoms[0]}
            </span>
          </div>
        </div>

        {/* Menu burger mobile */}
        <button className="lg:hidden ml-1 p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
          <Menu className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem]" />
        </button>
      </div>
    </header>
  )
}
