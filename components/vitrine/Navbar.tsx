'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LogoIcon } from '@/components/ui/logo'
import { ArrowRight, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/',                label: 'Accueil' },
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/partenaires',     label: 'Nos Partenaires' },
  { href: '/a-propos',        label: 'À Propos' },
  { href: '/contact',         label: 'Contact' },
]

export function VitrineNavbar() {
  const pathname    = usePathname()
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-sm'
          : 'bg-white dark:bg-zinc-950'
      }`}
    >
      {/* ── Barre principale ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">

        <Link href="/" className="flex items-center gap-1 flex-shrink-0">
          <LogoIcon className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
          <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Alafiya <span className="text-brand">+</span>
          </span>
        </Link>

        {/* Liens desktop */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'text-brand'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Actions desktop + burger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden md:inline-flex px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20"
          >
            Commencer <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Menu mobile ── */}
      {open && (
        <div className="md:hidden border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand/10 text-brand'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </Link>
            )
          })}
          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 dark:border-zinc-800">
            <Link
              href="/login"
              className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
            >
              Connexion
            </Link>
            <Link
              href="/contact"
              className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand text-white"
            >
              Commencer
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
