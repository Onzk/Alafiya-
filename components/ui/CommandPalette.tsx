'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Building2, Users, Stethoscope, Shield,
  UserRound, LayoutDashboard, QrCode, AlertCircle,
  FileText, Activity, X, ArrowUp, ArrowDown, CornerDownLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionUser } from '@/types'

/* ─── Types ─── */
interface SearchResult {
  id:         string
  type:       string
  label:      string
  sub?:       string
  href:       string
  Icon:       React.ElementType
  iconBg:     string
  iconColor:  string
}

interface ResultGroup {
  category:   string
  CategoryIcon: React.ElementType
  iconBg:     string
  iconColor:  string
  items:      SearchResult[]
}

interface ReseauData {
  centres:    { id: string; nom: string; region: string; type: string }[]
  medecins:   { id: string; nom: string; prenoms: string; email: string }[]
  specialites:{ id: string; nom: string; code: string }[]
  roles:      { id: string; nom: string; description?: string }[]
}

interface CommandPaletteProps {
  open:        boolean
  onClose:     () => void
  user:        SessionUser
  reseauData?: ReseauData
}

/* ─── Highlight matching chars ─── */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 1) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand/15 text-brand dark:bg-brand/25 dark:text-emerald-300 rounded-[3px] px-0.5 not-italic font-bold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

/* ─── Tree line helpers ─── */
function TreeItem({
  result, isLast, isSelected, query, onClick,
}: {
  result: SearchResult
  isLast: boolean
  isSelected: boolean
  query: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-0 text-left transition-all duration-100',
        isSelected
          ? 'bg-slate-50 dark:bg-zinc-800/80'
          : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
      )}
    >
      {/* Tree connector */}
      <div className="flex-shrink-0 flex items-center self-stretch pl-5 pr-0" aria-hidden>
        <div className="flex flex-col items-center self-stretch w-4">
          {/* Vertical line going down (not for last item) */}
          <div className={cn(
            'w-px flex-1',
            isLast ? 'bg-transparent' : 'bg-slate-200 dark:bg-zinc-700'
          )} />
          {/* Elbow: horizontal connector */}
          <div className="relative flex items-center" style={{ height: 0 }}>
            <div className="absolute w-3 h-px bg-slate-200 dark:bg-zinc-700 left-0" />
          </div>
          {/* Vertical stub going to center */}
          <div className="w-px flex-1 bg-slate-200 dark:bg-zinc-700" style={{ maxHeight: '50%' }} />
        </div>
        <div className="w-2" />
      </div>

      {/* Icon */}
      <div className={cn(
        'h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
        result.iconBg,
        isSelected ? 'scale-105' : ''
      )}>
        <result.Icon className={cn('h-3.5 w-3.5', result.iconColor)} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <p className={cn(
          'text-[13px] font-semibold truncate transition-colors',
          isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'
        )}>
          <HighlightMatch text={result.label} query={query} />
        </p>
        {result.sub && (
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
            <HighlightMatch text={result.sub} query={query} />
          </p>
        )}
      </div>

      {/* Type badge */}
      <div className="flex-shrink-0 pr-3">
        <span className={cn(
          'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors',
          isSelected
            ? 'bg-brand/10 dark:bg-brand/20 text-brand dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
        )}>
          {result.type}
        </span>
      </div>
    </button>
  )
}

/* ─── Main component ─── */
export function CommandPalette({ open, onClose, user, reseauData }: CommandPaletteProps) {
  const router  = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const isSuperAdmin  = user.niveauAcces === 'SUPERADMIN'
  const isAdminCentre = user.niveauAcces === 'ADMIN_CENTRE'

  const [query,          setQuery]         = useState('')
  const [selectedIndex,  setSelectedIndex] = useState(0)
  const [centreResults,  setCentreResults] = useState<SearchResult[]>([])
  const [centreLoading,  setCentreLoading] = useState(false)
  const centreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Focus on open */
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setCentreResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  /* Debounced centre search */
  useEffect(() => {
    if (!isAdminCentre || !open) return
    if (centreTimerRef.current) clearTimeout(centreTimerRef.current)
    if (query.length < 2) { setCentreResults([]); return }
    centreTimerRef.current = setTimeout(() => {
      setCentreLoading(true)
      fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          const raw = (d.results ?? []) as Array<{
            type: 'personnel' | 'patient' | 'role'
            id: string; label: string; sublabel: string; href: string
          }>
          setCentreResults(raw.map(r => ({
            id:         r.id,
            type:       r.type === 'personnel' ? 'Personnel' : r.type === 'patient' ? 'Patient' : 'Rôle',
            label:      r.label,
            sub:        r.sublabel,
            href:       r.href,
            Icon:       r.type === 'personnel' ? Users : r.type === 'patient' ? UserRound : Shield,
            iconBg:     r.type === 'personnel' ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : r.type === 'patient'   ? 'bg-blue-50 dark:bg-blue-500/10'
                      : 'bg-purple-50 dark:bg-purple-500/10',
            iconColor:  r.type === 'personnel' ? 'text-emerald-600 dark:text-emerald-400'
                      : r.type === 'patient'   ? 'text-blue-600 dark:text-blue-400'
                      : 'text-purple-600 dark:text-purple-400',
          })))
        })
        .finally(() => setCentreLoading(false))
    }, 280)
    return () => { if (centreTimerRef.current) clearTimeout(centreTimerRef.current) }
  }, [query, isAdminCentre, open])

  /* Superadmin filtered results */
  const reseauResults = useMemo<SearchResult[]>(() => {
    if (!isSuperAdmin || !reseauData || query.length < 2) return []
    const q = query.toLowerCase()
    return [
      ...reseauData.centres
        .filter(c => c.nom.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q))
        .slice(0, 4)
        .map(c => ({
          id: c.id, type: 'Centre', label: c.nom, sub: c.region || c.type,
          href: `/superadmin/centres/${c.id}`, Icon: Building2,
          iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        })),
      ...reseauData.medecins
        .filter(m => `${m.nom} ${m.prenoms}`.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
        .slice(0, 3)
        .map(m => ({
          id: m.id, type: 'Personnel', label: `${m.prenoms} ${m.nom}`, sub: m.email,
          href: '/superadmin/medecins', Icon: Users,
          iconBg: 'bg-blue-50 dark:bg-blue-500/10',
          iconColor: 'text-blue-600 dark:text-blue-400',
        })),
      ...reseauData.specialites
        .filter(s => s.nom.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
        .slice(0, 3)
        .map(s => ({
          id: s.id, type: 'Spécialité', label: s.nom, sub: s.code,
          href: '/superadmin/specialites', Icon: Stethoscope,
          iconBg: 'bg-purple-50 dark:bg-purple-500/10',
          iconColor: 'text-purple-600 dark:text-purple-400',
        })),
      ...reseauData.roles
        .filter(r => r.nom.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
        .slice(0, 2)
        .map(r => ({
          id: r.id, type: 'Rôle', label: r.nom, sub: r.description,
          href: '/superadmin/roles', Icon: Shield,
          iconBg: 'bg-orange-50 dark:bg-orange-500/10',
          iconColor: 'text-orange-600 dark:text-orange-400',
        })),
    ]
  }, [query, reseauData, isSuperAdmin])

  /* Navigation shortcuts (always visible) */
  const navItems = useMemo<SearchResult[]>(() => {
    if (isSuperAdmin) return [
      { id: 'sa-dash',    type: 'Page', label: 'Tableau de bord',   sub: 'Vue nationale',           href: '/superadmin/dashboard',   Icon: LayoutDashboard, iconBg: 'bg-slate-100 dark:bg-zinc-800',         iconColor: 'text-slate-500 dark:text-zinc-400' },
      { id: 'sa-centres', type: 'Page', label: 'Centres de santé',  sub: 'Gérer les établissements', href: '/superadmin/centres',     Icon: Building2,       iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',  iconColor: 'text-emerald-600 dark:text-emerald-400' },
      { id: 'sa-med',     type: 'Page', label: 'Personnel médical', sub: 'Médecins & agents',        href: '/superadmin/medecins',    Icon: Users,           iconBg: 'bg-blue-50 dark:bg-blue-500/10',        iconColor: 'text-blue-600 dark:text-blue-400' },
      { id: 'sa-spe',     type: 'Page', label: 'Spécialités',       sub: 'Disciplines médicales',    href: '/superadmin/specialites', Icon: Stethoscope,     iconBg: 'bg-purple-50 dark:bg-purple-500/10',    iconColor: 'text-purple-600 dark:text-purple-400' },
      { id: 'sa-roles',   type: 'Page', label: 'Types de personnel',sub: 'Rôles et permissions',     href: '/superadmin/roles',       Icon: Shield,          iconBg: 'bg-orange-50 dark:bg-orange-500/10',    iconColor: 'text-orange-600 dark:text-orange-400' },
      { id: 'sa-logs',    type: 'Page', label: "Journaux d'activité", sub: 'Audit et traçabilité',   href: '/logs',                   Icon: Activity,        iconBg: 'bg-slate-100 dark:bg-zinc-800',         iconColor: 'text-slate-500 dark:text-zinc-400' },
    ]
    if (isAdminCentre) return [
      { id: 'ac-dash',    type: 'Page', label: 'Tableau de bord',    sub: 'Vue du centre',          href: '/admin/dashboard',  Icon: LayoutDashboard, iconBg: 'bg-slate-100 dark:bg-zinc-800',         iconColor: 'text-slate-500 dark:text-zinc-400' },
      { id: 'ac-pers',    type: 'Page', label: 'Personnel médical',  sub: 'Agents du centre',       href: '/admin/personnels', Icon: Users,           iconBg: 'bg-blue-50 dark:bg-blue-500/10',        iconColor: 'text-blue-600 dark:text-blue-400' },
      { id: 'ac-roles',   type: 'Page', label: 'Types de personnel', sub: 'Rôles et accès',         href: '/admin/roles',      Icon: Shield,          iconBg: 'bg-orange-50 dark:bg-orange-500/10',    iconColor: 'text-orange-600 dark:text-orange-400' },
      { id: 'ac-logs',    type: 'Page', label: "Journaux d'activité",sub: 'Audit et traçabilité',   href: '/logs',             Icon: Activity,        iconBg: 'bg-slate-100 dark:bg-zinc-800',         iconColor: 'text-slate-500 dark:text-zinc-400' },
    ]
    return [
      { id: 'p-dash',     type: 'Page', label: 'Tableau de bord',  sub: 'Accueil',                href: '/dashboard',         Icon: LayoutDashboard, iconBg: 'bg-slate-100 dark:bg-zinc-800',       iconColor: 'text-slate-500 dark:text-zinc-400' },
      { id: 'p-patients', type: 'Page', label: 'Patients',         sub: 'Liste des patients',     href: '/patients',          Icon: Users,           iconBg: 'bg-blue-50 dark:bg-blue-500/10',      iconColor: 'text-blue-600 dark:text-blue-400' },
      { id: 'p-nouveau',  type: 'Page', label: 'Nouveau patient',  sub: 'Créer un dossier',       href: '/patients/nouveau',  Icon: FileText,        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',iconColor: 'text-emerald-600 dark:text-emerald-400' },
      { id: 'p-scanner',  type: 'Page', label: 'Scanner QR',       sub: 'Accéder à un dossier',  href: '/scanner',           Icon: QrCode,          iconBg: 'bg-slate-100 dark:bg-zinc-800',       iconColor: 'text-slate-500 dark:text-zinc-400' },
      { id: 'p-urgence',  type: 'Page', label: 'Urgence',          sub: 'Accès médical urgent',   href: '/urgence',           Icon: AlertCircle,     iconBg: 'bg-red-50 dark:bg-red-500/10',        iconColor: 'text-red-600 dark:text-red-400' },
    ]
  }, [isSuperAdmin, isAdminCentre])

  /* Group results by category */
  const groups = useMemo<ResultGroup[]>(() => {
    const searchList = isSuperAdmin ? reseauResults : isAdminCentre ? centreResults : []
    const hasSearch = searchList.length > 0

    if (hasSearch) {
      const map = new Map<string, SearchResult[]>()
      for (const r of searchList) {
        if (!map.has(r.type)) map.set(r.type, [])
        map.get(r.type)!.push(r)
      }
      const catMeta: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
        'Centre':     { Icon: Building2,   bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
        'Personnel':  { Icon: Users,       bg: 'bg-blue-50 dark:bg-blue-500/10',       color: 'text-blue-600 dark:text-blue-400' },
        'Spécialité': { Icon: Stethoscope, bg: 'bg-purple-50 dark:bg-purple-500/10',   color: 'text-purple-600 dark:text-purple-400' },
        'Rôle':       { Icon: Shield,      bg: 'bg-orange-50 dark:bg-orange-500/10',   color: 'text-orange-600 dark:text-orange-400' },
        'Patient':    { Icon: UserRound,   bg: 'bg-blue-50 dark:bg-blue-500/10',       color: 'text-blue-600 dark:text-blue-400' },
      }
      return Array.from(map.entries()).map(([cat, items]) => ({
        category: cat,
        CategoryIcon: catMeta[cat]?.Icon ?? Users,
        iconBg:    catMeta[cat]?.bg ?? 'bg-slate-100 dark:bg-zinc-800',
        iconColor: catMeta[cat]?.color ?? 'text-slate-500',
        items,
      }))
    }

    /* No search or PERSONNEL → navigation pages */
    const filteredNav = query.length >= 2
      ? navItems.filter(n =>
          n.label.toLowerCase().includes(query.toLowerCase()) ||
          n.sub?.toLowerCase().includes(query.toLowerCase())
        )
      : navItems

    if (filteredNav.length === 0) return []

    return [{
      category: query.length >= 2 ? 'Pages' : 'Navigation',
      CategoryIcon: LayoutDashboard,
      iconBg: 'bg-slate-100 dark:bg-zinc-800',
      iconColor: 'text-slate-500 dark:text-zinc-400',
      items: filteredNav,
    }]
  }, [isSuperAdmin, isAdminCentre, reseauResults, centreResults, navItems, query])

  /* Flat list for keyboard navigation */
  const flatList = useMemo(() => groups.flatMap(g => g.items), [groups])

  /* Reset selected when results change */
  useEffect(() => { setSelectedIndex(0) }, [flatList.length])

  /* Navigate selected item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  function handleSelect(href: string) {
    router.push(href)
    onClose()
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape')    { e.preventDefault(); onClose() }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatList.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flatList[selectedIndex]) {
      e.preventDefault()
      handleSelect(flatList[selectedIndex].href)
    }
  }, [flatList, selectedIndex, onClose])

  if (!open) return null

  /* Flat index counter across groups */
  let flatIdx = 0
  const isEmpty = flatList.length === 0
  const isLoading = isAdminCentre && centreLoading

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Palette */}
      <div
        className="relative w-full max-w-[560px] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 dark:shadow-black/60 border border-slate-200/80 dark:border-zinc-700/60 bg-white/[0.97] dark:bg-zinc-950 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal
        aria-label="Recherche rapide"
      >

        {/* ── Search input ── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800">
          <Search className="h-4 w-4 text-brand flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              isSuperAdmin  ? 'Rechercher centres, médecins, spécialités…' :
              isAdminCentre ? 'Rechercher personnel, patients…' :
              'Rechercher pages, patients…'
            }
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none caret-brand"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="h-5 w-5 rounded-md bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono flex-shrink-0">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>

        {/* ── Results ── */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="px-4 py-12 text-center">
              {query.length >= 2 ? (
                <>
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                    Aucun résultat pour &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    Essayez un autre terme
                  </p>
                </>
              ) : null}
            </div>
          ) : (
            <div className="py-2">
              {groups.map((group) => (
                <div key={group.category} className="mb-1">

                  {/* ── Category header ── */}
                  <div className="flex items-center gap-2.5 px-4 py-2">
                    <div className={cn('h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0', group.iconBg)}>
                      <group.CategoryIcon className={cn('h-3 w-3', group.iconColor)} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      {group.category}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                      {group.items.length}
                    </span>
                  </div>

                  {/* ── Tree items ── */}
                  <div className="relative">
                    {/* Vertical trunk line from category to last child */}
                    <div
                      className="absolute left-[29px] top-0 bottom-4 w-px bg-slate-200 dark:bg-zinc-700"
                      aria-hidden
                    />
                    {group.items.map((item, itemIdx) => {
                      const isLast     = itemIdx === group.items.length - 1
                      const currentIdx = flatIdx
                      flatIdx++
                      return (
                        <div key={item.id} data-idx={currentIdx}>
                          <button
                            onClick={() => handleSelect(item.href)}
                            className={cn(
                              'group w-full flex items-center gap-0 text-left transition-all duration-100',
                              selectedIndex === currentIdx
                                ? 'bg-slate-50 dark:bg-zinc-800/70'
                                : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
                            )}
                          >
                            {/* Tree connector */}
                            <div className="flex-shrink-0 self-stretch flex items-center pl-[21px]" aria-hidden>
                              <div className="relative w-5 self-stretch flex flex-col items-center">
                                {/* Top vertical */}
                                <div className="w-px flex-1 bg-transparent" />
                                {/* Horizontal elbow */}
                                <div className="absolute top-1/2 left-0 right-0 flex items-center" style={{ transform: 'translateY(-50%)' }}>
                                  <div className="ml-2 w-2 h-2 h-px bg-slate-200 dark:bg-zinc-700" />
                                </div>
                                {/* Bottom vertical (hidden for last) */}
                                <div className={cn('w-px flex-1', isLast ? 'bg-transparent' : 'bg-transparent')} />
                              </div>
                            </div>

                            {/* Icon */}
                            <div className={cn(
                              'h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 transition-transform',
                              item.iconBg,
                              selectedIndex === currentIdx ? 'scale-105' : ''
                            )}>
                              <item.Icon className={cn('h-3.5 w-3.5', item.iconColor)} />
                            </div>

                            {/* Text */}
                            <div className="min-w-0 flex-1 px-3 py-2.5">
                              <p className={cn(
                                'text-[13px] font-semibold truncate transition-colors',
                                selectedIndex === currentIdx
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-700 dark:text-zinc-300'
                              )}>
                                <HighlightMatch text={item.label} query={query} />
                              </p>
                              {item.sub && (
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                                  <HighlightMatch text={item.sub} query={query} />
                                </p>
                              )}
                            </div>

                            {/* Badge */}
                            <div className="flex-shrink-0 pr-3 flex items-center gap-2">
                              <span className={cn(
                                'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors',
                                selectedIndex === currentIdx
                                  ? 'bg-brand/10 dark:bg-brand/20 text-brand dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                              )}>
                                {item.type}
                              </span>
                              {selectedIndex === currentIdx && (
                                <CornerDownLeft className="h-3 w-3 text-brand opacity-60" />
                              )}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer shortcuts ── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/30">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
            <kbd className="inline-flex items-center px-1.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-[10px] font-semibold shadow-sm gap-0.5">
              <ArrowUp className="h-2.5 w-2.5" />
              <ArrowDown className="h-2.5 w-2.5" />
            </kbd>
            <span>Naviguer</span>
          </div>
          <div className="w-px h-3 bg-slate-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
            <kbd className="inline-flex items-center px-1.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-[10px] font-semibold shadow-sm">
              <CornerDownLeft className="h-2.5 w-2.5" />
            </kbd>
            <span>Sélectionner</span>
          </div>
          <div className="w-px h-3 bg-slate-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500">
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-[10px] font-semibold shadow-sm">
              Échap
            </kbd>
            <span>Fermer</span>
          </div>
          <div className="ml-auto text-[10px] text-slate-300 dark:text-zinc-600 font-medium">
            {flatList.length > 0 ? `${flatList.length} résultat${flatList.length !== 1 ? 's' : ''}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
