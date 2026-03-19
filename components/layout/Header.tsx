'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Bell, Search, Menu, Building2, Users, Stethoscope, Shield, X } from 'lucide-react'
import Image from 'next/image'
import { LogoIcon } from '@/components/ui/logo'
import { SessionUser } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

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
  '/admin/roles':           'Types de personnel',
  '/ministere/dashboard':   'Tableau de bord',
  '/ministere/centres':     'Centres de santé',
  '/ministere/medecins':    'Personnel médical',
  '/ministere/roles':       'Types de personnel',
  '/ministere/specialites': 'Spécialités',
  '/logs':                  "Journaux d'activité",
  '/profil':                'Mon profil',
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
  const router   = useRouter()
  const title    = getTitle(pathname)

  const displayName =
    user.niveauAcces === 'MINISTERE'
      ? 'Ministère'
      : `${user.prenoms} ${user.nom}`

  const roleLabel =
    user.niveauAcces === 'MINISTERE'    ? 'Administrateur National' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Admin de centre' :
    'Personnel médical'

  /* ── Réseau search (MINISTERE only) ── */
  const isMinistere = user.niveauAcces === 'MINISTERE'

  const [query,           setQuery]           = useState('')
  const [showDropdown,    setShowDropdown]    = useState(false)
  const [selectedIndex,   setSelectedIndex]   = useState(-1)
  const [reseauData,      setReseauData]      = useState<{
    centres:    CentreItem[]
    medecins:   MedecinItem[]
    specialites: SpecialiteItem[]
    roles:      RoleItem[]
  }>({ centres: [], medecins: [], specialites: [], roles: [] })

  const searchRef = useRef<HTMLDivElement>(null)

  // Load Réseau data once for MINISTERE users
  useEffect(() => {
    if (!isMinistere) return
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
  }, [isMinistere])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const results = useMemo<SearchResult[]>(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return [
      ...reseauData.centres
        .filter(c => c.nom.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q))
        .slice(0, 3)
        .map(c => ({
          type: 'Centre', label: c.nom, sub: c.region || c.type,
          href: `/ministere/centres/${c.id}`, Icon: Building2,
          iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        })),
      ...reseauData.medecins
        .filter(m => `${m.nom} ${m.prenoms}`.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
        .slice(0, 3)
        .map(m => ({
          type: 'Personnel', label: `${m.nom} ${m.prenoms}`, sub: m.email,
          href: '/ministere/medecins', Icon: Users,
          iconBg: 'bg-blue-50 dark:bg-blue-500/10',
          iconColor: 'text-blue-600 dark:text-blue-400',
        })),
      ...reseauData.specialites
        .filter(s => s.nom.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
        .slice(0, 2)
        .map(s => ({
          type: 'Spécialité', label: s.nom, sub: s.code,
          href: '/ministere/specialites', Icon: Stethoscope,
          iconBg: 'bg-purple-50 dark:bg-purple-500/10',
          iconColor: 'text-purple-600 dark:text-purple-400',
        })),
      ...reseauData.roles
        .filter(r => r.nom.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
        .slice(0, 2)
        .map(r => ({
          type: 'Rôle', label: r.nom, sub: r.description,
          href: '/ministere/roles', Icon: Shield,
          iconBg: 'bg-orange-50 dark:bg-orange-500/10',
          iconColor: 'text-orange-600 dark:text-orange-400',
        })),
    ]
  }, [query, reseauData])

  function handleResultClick(href: string) {
    router.push(href)
    setQuery('')
    setShowDropdown(false)
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between bg-white dark:bg-zinc-950 px-5 lg:px-7">

      {/* Gauche : logo mobile + titre desktop */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex lg:hidden items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <LogoIcon className="h-5 w-5 text-white" />
          </div>
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

      {/* Centre : barre de recherche — desktop */}
      <div className="hidden lg:flex flex-1 max-w-xs mx-8">
        {isMinistere ? (
          /* ── Réseau search ── */
          <div ref={searchRef} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary pointer-events-none z-10" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDropdown(true); setSelectedIndex(-1) }}
              onFocus={() => { if (query.length >= 2) setShowDropdown(true) }}
              onKeyDown={e => {
                if (e.key === 'Escape') { setQuery(''); setShowDropdown(false); setSelectedIndex(-1) }
                else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setShowDropdown(true)
                  setSelectedIndex(i => i < results.length - 1 ? i + 1 : i)
                }
                else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedIndex(i => i > 0 ? i - 1 : -1)
                }
                else if (e.key === 'Enter' && selectedIndex >= 0) {
                  e.preventDefault()
                  handleResultClick(results[selectedIndex].href)
                }
              }}
              placeholder="Rechercher centres, médecins, spécialités, rôles…"
              className="w-full h-10 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 pl-9 pr-8 py-2 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setShowDropdown(false) }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-300 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Dropdown */}
            {showDropdown && query.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                {results.length > 0 ? (
                  <>
                    <p className="px-4 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      {results.length} résultat{results.length !== 1 ? 's' : ''}
                    </p>
                    <div className="max-h-80 overflow-y-auto">
                      {results.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => handleResultClick(r.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
                            selectedIndex === i
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-500'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-900'
                          )}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.iconBg}`}>
                            <r.Icon className={`h-4 w-4 ${r.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{r.label}</p>
                            {r.sub && <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{r.sub}</p>}
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex-shrink-0 whitespace-nowrap">
                            {r.type}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-zinc-800 mx-4" />
                    <p className="px-4 py-2.5 text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[8px] font-semibold">↑↓</kbd>
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono text-[8px] font-semibold">↩</kbd>
                      <span>pour sélectionner</span>
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Aucun résultat pour &ldquo;{query}&rdquo;</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Essayez un autre terme ou une région</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Search générique (non-Ministère) ── */
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher patients, dossiers…"
              className="w-full h-10 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 pl-9 pr-4 py-2 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Droite : actions */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />

        <button className="relative p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
          <Bell className="h-[1.125rem] w-[1.125rem]" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </button>

        <div className="mx-1 h-6 w-px bg-slate-100 dark:bg-zinc-800" />

        <Link href="/profil" className="flex items-center gap-2.5 group">
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
        </Link>

        <button className="lg:hidden ml-1 p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
          <Menu className="h-[1.125rem] w-[1.125rem]" />
        </button>
      </div>
    </header>
  )
}
