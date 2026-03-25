'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard, BookOpen, ShieldCheck, Fingerprint,
  Check, ArrowLeft, Upload, Trash2, Loader2, Save, Eye, AlertTriangle, Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeDocId = 'CNI' | 'PASSEPORT' | 'CNSS' | 'EID_ANID'

type DocIdentification = {
  id: string
  type: TypeDocId
  numero: string
  fichier: string
  createdAt: string
}

// ─── Étapes ───────────────────────────────────────────────────────────────────

const STEPS = [
  {
    type: 'CNI' as TypeDocId,
    title: 'Carte Nationale d\'Identité',
    subtitle: 'CNI nationale guinéenne',
    icon: CreditCard,
    placeholder: 'Ex : GN-123456789',
  },
  {
    type: 'PASSEPORT' as TypeDocId,
    title: 'Passeport',
    subtitle: 'Passeport biométrique',
    icon: BookOpen,
    placeholder: 'Ex : A1234567',
  },
  {
    type: 'CNSS' as TypeDocId,
    title: 'Carte CNSS',
    subtitle: 'Caisse nationale de sécurité sociale',
    icon: ShieldCheck,
    placeholder: 'Ex : 00-000-000',
  },
  {
    type: 'EID_ANID' as TypeDocId,
    title: 'E-ID (ANID)',
    subtitle: 'Identité numérique nationale',
    icon: Fingerprint,
    placeholder: 'Ex : EID-00000000',
  },
]

// ─── Composant principal ──────────────────────────────────────────────────────

export function GestionDocumentsIdentification({
  patientId,
  accesValide,
}: {
  patientId: string
  accesValide: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [docs, setDocs] = useState<DocIdentification[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  async function charger() {
    setLoading(true)
    const res = await fetch(`/api/patients/${patientId}/documents`)
    if (res.ok) {
      const data = await res.json()
      setDocs(data.identification)
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!accesValide) {
    return (
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-xl p-5 text-sm text-orange-800 dark:text-orange-300 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">Accès non autorisé</p>
          <p>Scannez le QR code du patient pour accéder aux documents.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Documents d&apos;identification
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Gérez les pièces d&apos;identité du patient
          </p>
        </div>
      </div>

      {/* Stepper vertical */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="p-0">
          {STEPS.map((s, i) => {
            const doc = docs.find((d) => d.type === s.type)
            const Icon = s.icon
            const estComplete = !!doc
            const estActif = i === step

            return (
              <div key={i} className="flex gap-4">
                {/* Pastille + trait vertical */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 transition-all duration-200',
                    estComplete  ? 'bg-brand border-brand text-white' :
                    estActif     ? 'border-brand text-brand bg-brand/10' :
                                   'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500',
                  )}>
                    {estComplete ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      'w-0.5 mt-1 flex-1',
                      estActif ? 'min-h-[32px]' : 'min-h-[24px]',
                      estComplete ? 'bg-brand' : 'bg-slate-200 dark:bg-zinc-700',
                    )} />
                  )}
                </div>

                {/* Contenu de l'étape */}
                <div className={cn('flex-1', i < STEPS.length - 1 ? 'pb-6' : 'pb-0')}>
                  {/* Titre cliquable */}
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    className={cn(
                      'flex items-center gap-2 text-left w-full',
                      !estActif && 'cursor-pointer group',
                    )}
                  >
                    <Icon className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      estActif    ? 'text-brand' :
                      estComplete ? 'text-brand/70' :
                                    'text-slate-400 dark:text-zinc-500',
                    )} />
                    <div>
                      <p className={cn(
                        'text-sm font-semibold leading-tight transition-colors',
                        estActif    ? 'text-slate-900 dark:text-white' :
                        estComplete ? 'text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white' :
                                      'text-slate-400 dark:text-zinc-500',
                      )}>
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">{s.subtitle}</p>
                    </div>
                  </button>

                  {/* Contenu actif */}
                  {estActif && (
                    <div className="mt-4">
                      <StepContent
                        stepDef={s}
                        doc={doc}
                        patientId={patientId}
                        onRefresh={charger}
                        onPreview={(url) => setLightbox(url)}
                        onNext={() => setStep((p) => Math.min(p + 1, STEPS.length - 1))}
                        onPrev={() => setStep((p) => Math.max(p - 1, 0))}
                        isFirst={i === 0}
                        isLast={i === STEPS.length - 1}
                        onBack={() => router.back()}
                        onToast={toast}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(open) => { if (!open) setLightbox(null) }}>
        <DialogContent className="max-w-3xl w-[calc(100%-2rem)] p-2 bg-zinc-950 border-zinc-800">
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox}
              alt="Document"
              className="max-h-[85vh] w-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Contenu d'une étape ──────────────────────────────────────────────────────

type StepDef = typeof STEPS[number]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToastFn = (opts: any) => void

function StepContent({
  stepDef, doc, patientId, onRefresh, onPreview,
  onNext, onPrev, isFirst, isLast, onBack, onToast,
}: {
  stepDef: StepDef
  doc?: DocIdentification
  patientId: string
  onRefresh: () => void
  onPreview: (url: string) => void
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  onBack: () => void
  onToast: ToastFn
}) {
  const [mode, setMode] = useState<'view' | 'form'>(doc ? 'view' : 'form')
  const [confirmer, setConfirmer] = useState(false)

  // Reset quand on change de step
  useEffect(() => {
    setMode(doc ? 'view' : 'form')
    setConfirmer(false)
  }, [stepDef.type, doc])

  async function handleDelete() {
    if (!doc) return
    await fetch(`/api/patients/${patientId}/documents/identification/${doc.id}`, { method: 'DELETE' })
    onToast({ description: 'Document supprimé.' })
    await onRefresh()
    setConfirmer(false)
    setMode('form')
  }

  return (
    <div className="space-y-4">

      {/* Vue document existant */}
      {mode === 'view' && doc && (
        <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <button
            className="block w-full h-40 bg-slate-50 dark:bg-zinc-900 overflow-hidden hover:opacity-90 transition-opacity"
            onClick={() => onPreview(doc.fichier)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={doc.fichier} alt={stepDef.title} className="h-full w-full object-cover" />
          </button>
          <div className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">{stepDef.title}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{doc.numero}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => onPreview(doc.fichier)} className="h-8 px-2.5 rounded-lg gap-1.5 flex-1 sm:flex-none">
                <Eye className="h-3.5 w-3.5" /> Voir
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode('form')} className="h-8 px-2.5 rounded-lg gap-1.5 flex-1 sm:flex-none">
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
              {confirmer ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="destructive" onClick={handleDelete} className="h-8 px-2.5 rounded-lg text-xs">
                    Oui
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmer(false)} className="h-8 px-2.5 rounded-lg text-xs">
                    Non
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmer(true)}
                  className="h-8 px-2.5 rounded-lg border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire ajout / modification */}
      {mode === 'form' && (
        <FormStep
          stepDef={stepDef}
          patientId={patientId}
          existingId={doc?.id}
          onSuccess={async () => {
            await onRefresh()
            setMode('view')
            onToast({ description: 'Document enregistré avec succès !' })
          }}
          onCancel={doc ? () => setMode('view') : undefined}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {isFirst ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-10 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
            onClick={onPrev}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
          </Button>
        )}

        {!isLast && (
          <Button
            type="button"
            className="h-10 bg-brand hover:bg-brand-dark text-white rounded-lg"
            onClick={onNext}
          >
            Suivant
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Formulaire inline ────────────────────────────────────────────────────────

function FormStep({
  stepDef, patientId, existingId, onSuccess, onCancel,
}: {
  stepDef: StepDef
  patientId: string
  existingId?: string
  onSuccess: () => void
  onCancel?: () => void
}) {
  const [numero, setNumero] = useState('')
  const [fichier, setFichier] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFichier(file: File) {
    setFichier(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fichier) { setError('Veuillez sélectionner une image.'); return }
    setLoading(true)
    setError('')

    // Si modification, on supprime d'abord l'ancien
    if (existingId) {
      await fetch(`/api/patients/${patientId}/documents/identification/${existingId}`, { method: 'DELETE' })
    }

    const fd = new FormData()
    fd.append('type', stepDef.type)
    fd.append('numero', numero)
    fd.append('fichier', fichier)

    const res = await fetch(`/api/patients/${patientId}/documents/identification`, { method: 'POST', body: fd })
    if (res.ok) {
      onSuccess()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur lors de l\'enregistrement.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
          Numéro / Identifiant <span className="text-red-500">*</span>
        </label>
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder={stepDef.placeholder}
          className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
          Photo du document <span className="text-red-500">*</span>
        </label>
        <div
          className={cn(
            'relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden',
            preview
              ? 'border-brand/30'
              : 'border-slate-200 dark:border-zinc-700 hover:border-brand dark:hover:border-emerald-600',
          )}
          style={{ minHeight: '120px' }}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f?.type.startsWith('image/')) handleFichier(f)
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFichier(f) }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Aperçu" className="w-full h-40 object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 h-28 text-slate-400 dark:text-zinc-500">
              <Upload className="h-6 w-6" />
              <p className="text-xs text-center px-4">
                Cliquez ou déposez une image ici<br />
                <span className="text-[11px]">JPG, PNG, WEBP — max 10 Mo</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl h-10">
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="h-10 bg-brand hover:bg-brand-dark text-white rounded-xl gap-2"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement...</>
            : <><Save className="h-4 w-4" />Enregistrer</>
          }
        </Button>
      </div>
    </form>
  )
}
