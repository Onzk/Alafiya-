'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2, Check, FileText, Shield, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhotoCapture } from '@/components/acces/PhotoCapture'
import { cn } from '@/lib/utils'

// ─── Types de document ────────────────────────────────────────────────────────

type TypeDoc = 'CNI' | 'PASSEPORT' | 'CNSS' | 'EID_ANID'

const TYPES: { value: TypeDoc; label: string; sub: string; icon: React.ElementType }[] = [
  { value: 'CNI',       label: 'CNI',         sub: "Carte nationale d'identité",   icon: CreditCard  },
  { value: 'PASSEPORT', label: 'Passeport',   sub: 'Document de voyage',           icon: FileText    },
  { value: 'CNSS',      label: 'CNSS',        sub: 'Carte de sécurité sociale',    icon: Shield      },
  { value: 'EID_ANID',  label: 'eID / ANID',  sub: "Carte d'identité numérique",   icon: Fingerprint },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccesDocumentPage() {
  const router = useRouter()

  const [typeDoc,  setTypeDoc]  = useState<TypeDoc | null>(null)
  const [numero,   setNumero]   = useState('')
  const [photo,    setPhoto]    = useState<Blob | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typeDoc)  { setError('Sélectionnez un type de document.'); return }
    if (!numero.trim()) { setError('Saisissez le numéro du document.'); return }
    if (!photo)    { setError('Prenez une photo du document.'); return }

    setLoading(true)
    setError('')

    const fd = new FormData()
    fd.append('typeDocument',   typeDoc)
    fd.append('numeroDocument', numero.trim())
    fd.append('justificatif',   photo, 'justificatif.jpg')

    const res  = await fetch('/api/acces/document-identification', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Une erreur est survenue.')
      setLoading(false)
      return
    }

    window.location.href = `/patients/${data.patient.id}`
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Accès par document d&apos;identité
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Alternative au QR code — accès au dossier médical du patient
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Étape 1 — Type de document */}
        <section className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand text-white text-[11px] font-bold mr-2">1</span>
            Type de document
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ value, label, sub, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeDoc(value)}
                className={cn(
                  'relative flex flex-col gap-1 rounded-xl border-2 p-3 text-left transition-all',
                  typeDoc === value
                    ? 'border-brand bg-brand/5 dark:bg-brand/10'
                    : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700',
                )}
              >
                <Icon className={cn(
                  'h-5 w-5',
                  typeDoc === value ? 'text-brand' : 'text-slate-400 dark:text-zinc-500',
                )} />
                <span className={cn(
                  'text-sm font-semibold leading-tight',
                  typeDoc === value ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300',
                )}>
                  {label}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 leading-tight">{sub}</span>
                {typeDoc === value && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Étape 2 — Numéro */}
        <section className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand text-white text-[11px] font-bold mr-2">2</span>
            Numéro du document
          </p>
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ex : GN-123456789"
            className="h-11 rounded-xl"
            autoComplete="off"
          />
        </section>

        {/* Étape 3 — Photo */}
        <section className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand text-white text-[11px] font-bold mr-2">3</span>
            Photo du document
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 -mt-1">
            Prenez une photo de la carte présentée par le patient.
          </p>
          <PhotoCapture
            captured={!!photo}
            onCapture={(blob) => { setPhoto(blob); setError('') }}
            onClear={() => setPhoto(null)}
          />
        </section>

        {/* Erreur */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || !typeDoc || !numero.trim() || !photo}
          className="w-full h-11 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold"
        >
          {loading
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recherche en cours…</>
            : 'Accéder au dossier'
          }
        </Button>

      </form>
    </div>
  )
}
