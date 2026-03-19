'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { LogoIcon } from '@/components/ui/logo'
import { SessionUser } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'

interface HeaderProps { user: SessionUser }

export function Header({ user }: HeaderProps) {
  const roleLabel =
    user.niveauAcces === 'MINISTERE'    ? 'Administrateur National' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Administrateur de centre' :
    'Personnel médical'

  const displayName =
    user.niveauAcces === 'MINISTERE'
      ? `MINISTÈRE de la Santé`
      : `${user.nom} ${user.prenoms}`

  return (
    <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">

      {/* Logo mobile */}
      <div className="flex lg:hidden items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center">
            <LogoIcon className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white text-base">
            Alafiya <span className="text-brand">Plus</span>
          </span>
        </Link>
      </div>

      <div className="hidden lg:flex flex-1" />

      {/* Actions droite */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors relative">
          <Bell className="h-5 w-5" />
        </button>

        {/* Infos utilisateur */}
        <div className="flex items-center gap-3 ml-1 pl-3 border-l border-slate-100 dark:border-zinc-800">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{roleLabel}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-brand flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-xs">
              {user.nom[0]}{user.prenoms[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
