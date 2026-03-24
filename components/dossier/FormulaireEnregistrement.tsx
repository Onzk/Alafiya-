'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Save, Loader2, ArrowLeft, ClipboardList, FlaskConical,
  Pill, CalendarCheck, Check, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DicteeVocale } from '@/components/ia/DicteeVocale'
import { StructureIA } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface FormulaireEnregistrementProps {
  dossierId: string
  specialiteId: string
  specialiteNom: string
}

const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'
const textareaCls = 'border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400 resize-none'

const STEPS
 = [
  { title: 'Anamnèse',       subtitle: 'Antécédents et symptômes',       icon: ClipboardList },
  { title: 'Examens',        subtitle: 'Examens cliniques et résultats',  icon: FlaskConical  },
  { title: 'Traitements',    subtitle: 'Ordonnance et conseils',          icon: Pill          },
  { title: 'Suivi',          subtitle: 'Suivi préconisé',                 icon: CalendarCheck },
]

export function FormulaireEnregistrement({
  dossierId,
  specialiteId,
  specialiteNom,
}: FormulaireEnregistrementProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [transcriptionBrute, setTranscriptionBrute] = useState('')

  const [form, setForm] = useState({
    antecedents: '',
    signes: '',
    examens: '',
    bilan: '',
    traitements: { conseils: '', injections: '', ordonnance: '' },
    suivi: '',
  })

  function set(field: keyof Omit<typeof form, 'traitements'>, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  function setTrait(field: 'conseils' | 'injections' | 'ordonnance', val: string) {
    setForm((prev) => ({ ...prev, traitements: { ...prev.traitements, [field]: val } }))
  }

  function handleStructureIA(structure: StructureIA, texteOriginal: string) {
    setTranscriptionBrute(texteOriginal)
    setForm({
      antecedents: structure.antecedents || '',
      signes:      structure.signes      || '',
      examens:     structure.examens     || '',
      bilan:       structure.bilan       || '',
      traitements: {
        conseils:   structure.traitements?.conseils   || '',
        injections: structure.traitements?.injections || '',
        ordonnance: structure.traitements?.ordonnance || '',
      },
      suivi: structure.suivi || '',
    })
  }

  function goNext() {
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    setLoading(true)

    const res = await fetch(`/api/dossiers/${dossierId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialiteId,
        ...form,
        audioTranscriptionBrute: transcriptionBrute || undefined,
        genereParIA: !!transcriptionBrute,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || "Erreur lors de l'enregistrement.", variant: 'destructive' })
      return
    }

    toast({ description: 'Consultation enregistrée avec succès!' })
    router.refresh()
    router.push(pathname)
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Nouvelle consultation
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{specialiteNom}</p>
        </div>
      </div>

      {/* Dictée vocale */}
      <DicteeVocale onStructure={handleStructureIA} />

      {/* Bannière transcription IA */}
      {transcriptionBrute && (
        <div className="relative rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
          <button
            type="button"
            onClick={() => setTranscriptionBrute('')}
            className="absolute top-2 right-2 text-amber-400 hover:text-amber-600 dark:text-amber-600 dark:hover:text-amber-400"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Transcription IA</p>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed pr-6">{transcriptionBrute}</p>
        </div>
      )}

      {/* Stepper vertical */}
      <div className="p-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex gap-4">
            {/* Pastille + trait */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 transition-all duration-200',
                i < step  ? 'bg-brand border-brand text-white' :
                i === step ? 'border-brand text-brand bg-brand/10' :
                             'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500',
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'w-0.5 mt-1 flex-1',
                  i === step ? 'min-h-[32px]' : 'min-h-[24px]',
                  i < step ? 'bg-brand' : 'bg-slate-200 dark:bg-zinc-700',
                )} />
              )}
            </div>

            {/* Contenu */}
            <div className={cn('flex-1', i < STEPS.length - 1 ? 'pb-6' : 'pb-0')}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => i < step && setStep(i)}
                className={cn('flex flex-col gap-0.5 text-left w-full', i < step && 'cursor-pointer group')}
              >
                <p className={cn(
                  'text-sm font-semibold leading-tight transition-colors',
                  i === step ? 'text-slate-900 dark:text-white' :
                  i < step   ? 'text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white' :
                               'text-slate-400 dark:text-zinc-500',
                )}>
                  {s.title}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">{s.subtitle}</p>
              </button>

              {i === step && (
                <div className="mt-4 space-y-4">

                  {/* Étape 0 — Anamnèse */}
                  {step === 0 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Champ
                        id="antecedents"
                        label="Antécédents médicaux"
                        placeholder="Maladies chroniques, chirurgies, allergies…"
                        value={form.antecedents}
                        onChange={(v) => set('antecedents', v)}
                      />
                      <Champ
                        id="signes"
                        label="Signes & symptômes"
                        placeholder="Motif de consultation, plaintes…"
                        value={form.signes}
                        onChange={(v) => set('signes', v)}
                      />
                    </div>
                  )}

                  {/* Étape 1 — Examens */}
                  {step === 1 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Champ
                        id="examens"
                        label="Examens effectués"
                        placeholder="Examen clinique, auscultation…"
                        value={form.examens}
                        onChange={(v) => set('examens', v)}
                      />
                      <Champ
                        id="bilan"
                        label="Résultats & analyses"
                        placeholder="Résultats biologiques, imagerie…"
                        value={form.bilan}
                        onChange={(v) => set('bilan', v)}
                      />
                    </div>
                  )}

                  {/* Étape 2 — Traitements */}
                  {step === 2 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Champ
                        id="conseils"
                        label="Conseils au patient"
                        placeholder="Hygiène de vie, régime…"
                        value={form.traitements.conseils}
                        onChange={(v) => setTrait('conseils', v)}
                        rows={2}
                      />
                      <Champ
                        id="injections"
                        label="Injections administrées"
                        placeholder="Produit, posologie, voie…"
                        value={form.traitements.injections}
                        onChange={(v) => setTrait('injections', v)}
                        rows={2}
                      />
                      <div className="sm:col-span-2">
                        <Champ
                          id="ordonnance"
                          label="Ordonnance médicale"
                          placeholder="Médicaments prescrits, posologie, durée…"
                          value={form.traitements.ordonnance}
                          onChange={(v) => setTrait('ordonnance', v)}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Étape 3 — Suivi */}
                  {step === 3 && (
                    <Champ
                      id="suivi"
                      label="Suivi préconisé"
                      placeholder="Prochain rendez-vous, examens complémentaires…"
                      value={form.suivi}
                      onChange={(v) => set('suivi', v)}
                      rows={3}
                    />
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {step > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
                        onClick={() => setStep((s) => s - 1)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
                        onClick={() => router.push(pathname)}
                      >
                        Annuler
                      </Button>
                    )}

                    {step < STEPS.length - 1 ? (
                      <Button
                        type="button"
                        className="h-10 bg-brand hover:bg-brand-dark text-white rounded-lg"
                        onClick={goNext}
                      >
                        Suivant
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={loading}
                        className="h-10 bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm shadow-brand/20"
                        onClick={handleSubmit}
                      >
                        {loading
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</>
                          : <><Save className="mr-2 h-4 w-4" />Enregistrer</>
                        }
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Composant interne ── */

function Champ({
  id, label, placeholder, value, onChange, rows = 3,
}: {
  id: string
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={labelCls}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={textareaCls}
      />
    </div>
  )
}
