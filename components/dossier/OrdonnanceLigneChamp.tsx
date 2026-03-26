'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LignePrescription = {
  produit:   string
  quantite:  string
  frequence: string
}

// ─── Sérialisation ────────────────────────────────────────────────────────────

export function serializeLignes(lignes: LignePrescription[]): string {
  return lignes
    .filter((l) => l.produit.trim() || l.quantite.trim() || l.frequence.trim())
    .map((l) =>
      [l.produit, l.quantite, l.frequence]
        .map((p) => p.trim())
        .filter(Boolean)
        .join(' — '),
    )
    .join('\n')
}

export function parseLignes(value: string): LignePrescription[] {
  const lines = value.split('\n').filter((l) => l.trim() !== '')
  if (lines.length === 0) return [{ produit: '', quantite: '', frequence: '' }]
  return lines.map((line) => {
    const parts = line.split(' — ')
    return {
      produit:   parts[0]?.trim() ?? '',
      quantite:  parts[1]?.trim() ?? '',
      frequence: parts[2]?.trim() ?? '',
    }
  })
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function OrdonnanceLigneChamp({
  value,
  onChange,
  inputClassName,
  labelClassName,
}: {
  value:          string
  onChange:       (v: string) => void
  inputClassName?: string
  labelClassName?: string
}) {
  const [lignes, setLignes] = useState<LignePrescription[]>(() => parseLignes(value))
  const focusRef  = useRef<number | null>(null)
  const inputsRef = useRef<(HTMLInputElement | null)[][]>([])
  const prevValue = useRef(value)

  // Resync si valeur externe change (ex : dictée IA)
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      setLignes(parseLignes(value))
    }
  }, [value])

  useEffect(() => {
    if (focusRef.current !== null) {
      inputsRef.current[focusRef.current]?.[0]?.focus()
      focusRef.current = null
    }
  })

  function updateLigne(idx: number, field: keyof LignePrescription, val: string) {
    const next = lignes.map((l, i) => (i === idx ? { ...l, [field]: val } : l))
    setLignes(next)
    onChange(serializeLignes(next))
  }

  function addLigne() {
    focusRef.current = lignes.length
    setLignes((prev) => [...prev, { produit: '', quantite: '', frequence: '' }])
  }

  function removeLigne(idx: number) {
    const next = lignes.filter((_, i) => i !== idx)
    const final = next.length > 0 ? next : [{ produit: '', quantite: '', frequence: '' }]
    setLignes(final)
    onChange(serializeLignes(final))
  }

  const inputCls = cn(
    'h-12 text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400',
    inputClassName,
  )

  return (
    <div className="space-y-2">
      {/* En-têtes colonnes */}
      <div className="grid grid-cols-[1fr_auto_1fr_1.5rem] gap-2 items-end">
        <Label className={cn('text-xs', labelClassName)}>Produit *</Label>
        <Label className={cn('text-xs w-20', labelClassName)}>Quantité</Label>
        <Label className={cn('text-xs', labelClassName)}>Fréquence / Durée</Label>
        <span />
      </div>

      {/* Lignes */}
      {lignes.map((ligne, idx) => {
        if (!inputsRef.current[idx]) inputsRef.current[idx] = []
        return (
          <div key={idx} className="grid grid-cols-[1fr_auto_1fr_1.5rem] gap-2 items-center">
            <Input
              ref={(el) => { inputsRef.current[idx] = [el, ...(inputsRef.current[idx]?.slice(1) ?? [])] }}
              value={ligne.produit}
              onChange={(e) => updateLigne(idx, 'produit', e.target.value)}
              placeholder="Amoxicilline 500mg…"
              className={inputCls}
            />
            <Input
              value={ligne.quantite}
              onChange={(e) => updateLigne(idx, 'quantite', e.target.value)}
              placeholder="1 cp"
              className={cn(inputCls, 'w-20')}
            />
            <Input
              value={ligne.frequence}
              onChange={(e) => updateLigne(idx, 'frequence', e.target.value)}
              placeholder="3×/j pendant 7j…"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => removeLigne(idx)}
              disabled={lignes.length === 1 && !ligne.produit && !ligne.quantite && !ligne.frequence}
              className="text-slate-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors disabled:opacity-30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addLigne}
        className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors mt-1"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter un médicament
      </button>
    </div>
  )
}
