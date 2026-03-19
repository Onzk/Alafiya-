'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Check, ChevronDown, X } from 'lucide-react'

export interface SelectOption {
  id: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  emptyText = 'Aucun résultat',
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.id === value)
  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(q.toLowerCase()) ||
      o.sublabel?.toLowerCase().includes(q.toLowerCase()),
  )

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQ('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQ('') }}
        className="w-full h-11 px-3 flex items-center justify-between gap-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 hover:border-brand/50 transition-colors"
      >
        <span className={selected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}>
          {selected ? (
            <span>
              {selected.label}
              {selected.sublabel && (
                <span className="ml-1.5 text-slate-400 dark:text-zinc-500 text-xs">{selected.sublabel}</span>
              )}
            </span>
          ) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400 dark:text-zinc-500">{emptyText}</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { onChange(option.id); setOpen(false); setQ('') }}
                  className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 text-sm transition-colors text-left hover:bg-slate-50 dark:hover:bg-zinc-800 ${
                    option.id === value ? 'text-brand font-semibold bg-brand/5 dark:bg-brand/10' : 'text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <span>{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-slate-400 dark:text-zinc-500 ml-1.5">{option.sublabel}</span>
                    )}
                  </div>
                  {option.id === value && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
