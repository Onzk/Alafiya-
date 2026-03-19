'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { ACTION_LABELS } from './constants'

interface LogsFiltersProps {
  defaultQ: string
  defaultAction: string
}

export function LogsFilters({ defaultQ, defaultAction }: LogsFiltersProps) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQ)
  const [action, setAction] = useState(defaultAction)

  const apply = (newQ: string, newAction: string) => {
    const params = new URLSearchParams()
    if (newQ.trim()) params.set('q', newQ.trim())
    if (newAction) params.set('action', newAction)
    router.push(`/logs?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {/* Barre de recherche */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply(q, action)}
          placeholder="Utilisateur, cible, IP…"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-colors"
        />
        {q && (
          <button
            onClick={() => { setQ(''); apply('', action) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filtre par type d'action */}
      <div className="relative">
        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none z-10" />
        <select
          value={action}
          onChange={e => { setAction(e.target.value); apply(q, e.target.value) }}
          className="pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="">Tous les types</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          <svg className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Bouton Rechercher */}
      <button
        onClick={() => apply(q, action)}
        className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors shrink-0"
      >
        Rechercher
      </button>
    </div>
  )
}
