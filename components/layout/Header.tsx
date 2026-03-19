'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bell } from 'lucide-react'
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
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">

      {/* Logo mobile */}
      <div className="flex lg:hidden items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-white rounded-lg border border-slate-100 dark:border-zinc-700 shadow-sm flex items-center justify-center">
            <Image src="/logo.png" alt="Alafia Plus" width={24} height={24} className="rounded-md" priority />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white text-base">
            Alafia <span className="text-brand">Plus</span>
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
