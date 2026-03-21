'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { ACTION_LABELS } from './constants'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LogsFiltersProps {
  defaultQ: string
  defaultAction: string
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-brand/30 focus-visible:border-brand/50'

export function LogsFilters({ defaultQ, defaultAction }: LogsFiltersProps) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQ)
  const [action, setAction] = useState(defaultAction || 'tous')

  const apply = (newQ: string, newAction: string) => {
    const params = new URLSearchParams()
    if (newQ.trim()) params.set('q', newQ.trim())
    if (newAction && newAction !== 'tous') params.set('action', newAction)
    router.push(`/logs?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {/* Barre de recherche */}
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none z-10" />
        <Input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply(q, action)}
          placeholder="Utilisateur, cible, IP…"
          className={`${inputCls} pl-9 pr-8`}
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
      <Select value={action} onValueChange={(v) => { setAction(v); apply(q, v) }}>
        <SelectTrigger className={`${inputCls} w-[220px]`}>
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
          <SelectValue placeholder="Tous les types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les types</SelectItem>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Bouton Rechercher */}
      <Button
        onClick={() => apply(q, action)}
        className="h-11 bg-brand hover:bg-brand-dark text-white rounded-xl px-4 shadow-sm shadow-brand/20 shrink-0"
      >
        Rechercher
      </Button>
    </div>
  )
}
