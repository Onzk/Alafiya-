'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Bell, Search, Menu, Building2, Users, Stethoscope, Shield, X, Settings, LogOut, LayoutDashboard, Activity, QrCode, AlertCircle, FileText } from 'lucide-react'
import Image from 'next/image'
import { LogoIcon } from '@/components/ui/logo'
import { SessionUser } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/use-logout'
import { CommandPalette } from '@/components/ui/CommandPalette'

interface HeaderProps { user: SessionUser }

interface CentreItem  { id: string; nom: string; region: string; type: string }
interface MedecinItem { id: string; nom: string; prenoms: string; email: string }
interface SpecialiteItem { id: string; nom: string; code: string }
interface RoleItem { id: string; nom: string; description?: string }

interface SearchResult {
  type: string
  label: string
  sub?: string
  href: string
  Icon: React.ElementType
  iconBg: string
  iconColor: string
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':             'Tableau de bord',
  '/patients':              'Patients',
  '/patients/nouveau':      'Nouveau patient',
  '/scanner':               'Scanner QR',
  '/urgence':               'Urgence',
  '/admin/dashboard':       'Tableau de bord',
  '/admin/personnels':      'Personnel médical',
  '/admin/patients':        'Patients',
  '/admin/roles':           'Types de personnel',
  '/superadmin/dashboard':   'Tableau de bord',
  '/superadmin/centres':     'Centres de santé',
  '/superadmin/medecins':    'Personnel médical',
  '/superadmin/roles':       'Types de personnel',
  '/superadmin/specialites': 'Spécialités',
  '/logs':                  "Journaux d'activité",
  '/profil':                'Paramètres',
  '/parametres':            'Paramètres',
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
  const title    = getTitle(pathname)
  const logout   = useLogout()

  const displayName =
    user.niveauAcces === 'SUPERADMIN'
      ? 'N\'di Solutions'
      : `${user.prenoms} ${user.nom}`

  const roleLabel =
    user.niveauAcces === 'SUPERADMIN'   ? 'Superadmin' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Admin de centre' :
    'Personnel médical'

  const isSuperAdmin  = user.niveauAcces === 'SUPERADMIN'

  const [reseauData, setReseauData] = useState<{
    centres:    CentreItem[]
    medecins:   MedecinItem[]
    specialites: SpecialiteItem[]
    roles:      RoleItem[]
  }>({ centres: [], medecins: [], specialites: [], roles: [] })

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  /* ── Mobile nav groups ── */
  type NavItem  = { href: string; label: string; icon: React.ElementType; isUrgence?: boolean }
  type NavGroup = { section: string | null; items: NavItem[] }
  const mobileGroups: NavGroup[] =
    user.niveauAcces === 'SUPERADMIN'
      ? [
          { section: null, items: [
            { href: '/superadmin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
          ]},
          { section: 'RÉSEAU', items: [
            { href: '/superadmin/centres',     label: 'Centres de santé',   icon: Building2 },
            { href: '/superadmin/medecins',    label: 'Personnel médical',  icon: Users },
            { href: '/superadmin/specialites', label: 'Spécialités',        icon: Stethoscope },
            { href: '/superadmin/roles',       label: 'Types de personnel', icon: Shield },
          ]},
          { section: 'SUIVI', items: [
            { href: '/logs', label: "Journaux d'activité", icon: Activity },
          ]},
        ]
      : user.niveauAcces === 'ADMIN_CENTRE'
      ? [
          { section: null, items: [
            { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
          ]},
          { section: 'CENTRE', items: [
            { href: '/admin/personnels', label: 'Personnel médical',  icon: Users },
            { href: '/admin/roles',      label: 'Types de personnel', icon: Shield },
          ]},
          { section: 'SUIVI', items: [
            { href: '/logs', label: "Journaux d'activité", icon: Activity },
          ]},
        ]
      : [
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

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Load Réseau data once for SUPERADMIN users
  useEffect(() => {
    if (!isSuperAdmin) return
    Promise.all([
      fetch('/api/centres').then(r => r.json()),
      fetch('/api/utilisateurs?niveauAcces=PERSONNEL').then(r => r.json()),
      fetch('/api/specialites').then(r => r.json()),
      fetch('/api/roles').then(r => r.json()),
    ]).then(([c, m, s, r]) => {
      setReseauData({
        centres:     c.centres      || [],
        medecins:    m.utilisateurs || [],
        specialites: s.specialites  || [],
        roles:       r.roles        || [],
      })
    })
  }, [isSuperAdmin])

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
    <header className="flex h-16 flex-shrink-0 items-center justify-between bg-white dark:bg-zinc-950 px-5 lg:px-7">

      {/* Gauche : logo mobile + titre desktop */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex lg:hidden items-center gap-2">
          {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          </div> */}
            <LogoIcon className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
          <span className="font-extrabold text-slate-900 dark:text-white text-base">
            Alafiya <span className="text-emerald-500">Plus</span>
          </span>
        </Link>
        <div className="hidden lg:block">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
            {title}
          </h2>
        </div>
      </div>

      {/* Centre : trigger recherche rapide — desktop */}
      <div className="hidden lg:flex ml-auto max-w-xs mr-4">
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full flex items-center gap-2.5 h-11 px-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-500 dark:hover:text-zinc-400 transition-all group"
        >
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-brand" />
          <span className="flex-1 text-left text-xs truncate">Recherche rapide…</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[9px] font-bold font-mono shadow-sm flex-shrink-0">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Droite : actions */}
      <div className="flex items-center gap-1.5">
        {/* Search mobile trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Search className="h-[1.125rem] w-[1.125rem]" />
        </button>

        <ThemeToggle />

        {/* ── Notifications dropdown ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Bell className="h-[1.125rem] w-[1.125rem]" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </button>

          {notifOpen && (
            <div className="fixed inset-x-4 top-[4.5rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-h-96 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-8 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Aucune notification pour le moment</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-zinc-950" />

        {/* ── Avatar + dropdown ── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2.5 group"
          >
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">{displayName}</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">{roleLabel}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-emerald-500/20 overflow-hidden group-hover:ring-brand/40 transition-all">
              {user.photo
                ? <Image src={user.photo} alt="Photo de profil" width={32} height={32} className="object-cover w-full h-full" />
                : <span className="text-white font-bold text-xs">{user.nom[0]}{user.prenoms[0]}</span>
              }
            </div>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <Link
                href="/parametres"
                onClick={() => setProfileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                  pathname === '/parametres'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
                )}
              >
                <Settings className={cn("h-4 w-4", pathname === '/parametres' ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500')} />
                Paramètres
              </Link>
              <div className="h-px bg-slate-100 dark:bg-zinc-950" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(o => !o)}
          className="lg:hidden ml-0.5 p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {menuOpen ? <X className="h-[1.125rem] w-[1.125rem]" /> : <Menu className="h-[1.125rem] w-[1.125rem]" />}
        </button>
      </div>
    </header>

    {/* ── Mobile drawer ── */}
    {menuOpen && (
      <>
        {/* Backdrop */}
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Slide-in panel */}
        <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col overflow-hidden
          bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900
          dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950
          dark:border-r dark:border-zinc-800
          animate-in slide-in-from-left duration-200">

          {/* Radial glow */}
          <div className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-0"
            style={{ background: 'radial-gradient(ellipse at 30% 15%, #34d399 0%, transparent 65%)' }} />

          {/* Logo + close */}
          <div className="relative z-10 flex h-16 items-center justify-between px-5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <LogoIcon className="h-8 w-8 text-white" />
              <span className="text-lg font-extrabold tracking-tight text-white">
                Alafiya <span className="text-emerald-200 dark:text-emerald-700">Plus</span>
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-xl text-white/75 hover:bg-white/15 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-2 space-y-5">
            {(() => {
              const allHrefs = mobileGroups.flatMap(g => g.items.map(i => i.href))
              const exactMatch = allHrefs.includes(pathname)
              return mobileGroups.map((group, gi) => (
              <div key={gi}>
                {group.section && (
                  <p className="px-3 mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white/40 dark:text-zinc-500">
                    {group.section}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (!exactMatch && pathname.startsWith(item.href + '/'))
                    const isUrgence = item.isUrgence
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 h-12 rounded-xl px-3 text-sm font-semibold transition-all duration-150',
                          isActive
                            ? isUrgence
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'bg-white text-emerald-700 shadow-sm dark:bg-emerald-500 dark:text-white'
                            : isUrgence
                            ? 'text-red-300 hover:bg-red-500 hover:text-red-200 dark:text-red-400 dark:hover:bg-red-950/30'
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
              ))
            })()}
          </nav>

          {/* Bottom: settings + logout */}
          <div className="relative z-10 flex-shrink-0 p-3 border-t border-white/10 dark:border-zinc-800 space-y-1">
            <Link
              href="/parametres"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 h-12 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/15 hover:text-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-all"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              Paramètres
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 h-12 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/15 hover:text-white dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-all"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Déconnexion
            </button>
          </div>
        </aside>
      </>
    )}

    {/* ── Command Palette ── */}
    <CommandPalette
      open={paletteOpen}
      onClose={() => setPaletteOpen(false)}
      user={user}
      reseauData={isSuperAdmin ? reseauData : undefined}
    />
    </>
  )
}
