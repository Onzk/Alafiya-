'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Loader2, ClipboardList, FlaskConical,
  Pill, CalendarCheck, Syringe, FileText, MessageSquare, X,
  AlertCircle, CheckCircle2, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DicteeVocale } from '@/components/ia/DicteeVocale'
import { StructureIA } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface FormulaireEnregistrementProps {
  dossierId: string
  specialiteId: string
  specialiteNom: string
}

export function FormulaireEnregistrement({
  dossierId,
  specialiteId,
  specialiteNom,
}: FormulaireEnregistrementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [transcriptionBrute, setTranscriptionBrute] = useState('')
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    antecedents: '',
    signes: '',
    examens: '',
    bilan: '',
    traitements: { conseils: '', injections: '', ordonnance: '' },
    suivi: '',
  })

  const initialForm = form

  function set(field: keyof Omit<typeof form, 'traitements'>, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }))
    // Réinitialiser l'erreur pour ce champ
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function setTrait(field: 'conseils' | 'injections' | 'ordonnance', val: string) {
    setForm((prev) => ({ ...prev, traitements: { ...prev.traitements, [field]: val } }))
  }

  function handleStructureIA(structure: StructureIA, texteOriginal: string) {
    setTranscriptionBrute(texteOriginal)
    setForm({
      antecedents: structure.antecedents || '',
      signes: structure.signes || '',
      examens: structure.examens || '',
      bilan: structure.bilan || '',
      traitements: {
        conseils: structure.traitements?.conseils || '',
        injections: structure.traitements?.injections || '',
        ordonnance: structure.traitements?.ordonnance || '',
      },
      suivi: structure.suivi || '',
    })
    setSuccess(false)
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}
    
    if (!form.signes.trim()) {
      newErrors.signes = 'Les signes et symptômes sont obligatoires'
    }
    if (!form.antecedents.trim()) {
      newErrors.antecedents = 'Les antécédents sont obligatoires'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function resetForm() {
    setForm(initialForm)
    setTranscriptionBrute('')
    setSuccess(false)
    setErrors({})
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      })
      return
    }

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

    setSuccess(true)
    toast({ description: 'Consultation enregistrée avec succès!' })
    
    setTimeout(() => {
      router.refresh()
      router.back()
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* En-tête avec état de succès */}
      <div className="pb-4 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Nouvelle consultation</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{specialiteNom}</h2>
          </div>
          {success && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Enregistré</span>
            </div>
          )}
        </div>
      </div>

      {/* Dictée vocale IA */}
      <DicteeVocale onStructure={handleStructureIA} />

      {/* Bannière transcription */}
      {transcriptionBrute && (
        <div className="relative rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4">
          <button
            type="button"
            onClick={() => setTranscriptionBrute('')}
            className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 dark:text-amber-600 dark:hover:text-amber-400 transition"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
            Transcription Whisper
          </p>
          <p className="text-sm italic text-amber-800 dark:text-amber-300 leading-relaxed pr-6">{transcriptionBrute}</p>
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
            Formulaire pré-rempli par IA — relisez et corrigez avant de valider.
          </p>
        </div>
      )}

      {/* Section 1 — Anamnèse */}
      <Section
        icon={<ClipboardList className="h-4 w-4" />}
        titre="Anamnèse"
        sous_titre="Historique et symptômes du patient"
        couleur="blue"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <Champ
            id="antecedents"
            label="Antécédents médicaux"
            sous_label="Obligatoire"
            placeholder="ATCD médicaux, chirurgicaux, allergies, vaccinations, traitements en cours..."
            value={form.antecedents}
            onChange={(v) => set('antecedents', v)}
            error={errors.antecedents}
            rows={4}
          />
          <Champ
            id="signes"
            label="Signes & symptômes"
            sous_label="Obligatoire"
            placeholder="Motif de consultation, symptômes rapportés, durée, évolution, signes cliniques..."
            value={form.signes}
            onChange={(v) => set('signes', v)}
            error={errors.signes}
            rows={4}
          />
        </div>
      </Section>

      {/* Section 2 — Examens & Bilan */}
      <Section
        icon={<FlaskConical className="h-4 w-4" />}
        titre="Examens & Bilan"
        sous_titre="Investigations cliniques et résultats"
        couleur="violet"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <Champ
            id="examens"
            label="Examens effectués"
            sous_label="Optionnel"
            placeholder="Examen clinique approfondi, examens paracliniques, imagerie, ECG, EFR..."
            value={form.examens}
            onChange={(v) => set('examens', v)}
            rows={4}
          />
          <Champ
            id="bilan"
            label="Résultats & analyses"
            sous_label="Optionnel"
            placeholder="Résultats biologiques, radiologiques, diagnostic différentiel, interprétation..."
            value={form.bilan}
            onChange={(v) => set('bilan', v)}
            rows={4}
          />
        </div>
      </Section>

      {/* Section 3 — Traitements */}
      <Section
        icon={<Pill className="h-4 w-4" />}
        titre="Plans thérapeutiques"
        sous_titre="Conseils et ordonnances médicales"
        couleur="emerald"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
            <div className="mt-1 shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <MessageSquare className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <Champ
                id="conseils"
                label="Conseils au patient"
                sous_label="Recommandations générales"
                placeholder="Conseils hygiéno-diététiques, repos, activité physique, instructions particulières..."
                value={form.traitements.conseils}
                onChange={(v) => setTrait('conseils', v)}
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
            <div className="mt-1 shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Syringe className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <Champ
                id="injections"
                label="Injections administrées"
                sous_label="Traitement intra-consultation"
                placeholder="Médicaments injectés, nom, dose, voie d'administration (IM/IV/SC)..."
                value={form.traitements.injections}
                onChange={(v) => setTrait('injections', v)}
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
            <div className="mt-1 shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <FileText className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <Champ
                id="ordonnance"
                label="Ordonnance médicale"
                sous_label="Prescription à domicile"
                placeholder="Médicaments (DCI + dosage), posologie, durée (ex: 1 cp x2/j pendant 10j)..."
                value={form.traitements.ordonnance}
                onChange={(v) => setTrait('ordonnance', v)}
                rows={3}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Section 4 — Suivi */}
      <Section
        icon={<CalendarCheck className="h-4 w-4" />}
        titre="Suivi préconisé"
        sous_titre="Plan de suivi et prochain RDV"
        couleur="orange"
      >
        <Champ
          id="suivi"
          label="Suivi et prochaine consultation"
          sous_label="Optionnel"
          placeholder="Contrôle prévu (délai), examens complémentaires, signes d'alerte, complications possibles..."
          value={form.suivi}
          onChange={(v) => set('suivi', v)}
          rows={3}
        />
      </Section>

      {/* Résumé des champs vides */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Champs obligatoires manquants</p>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
        <Button 
          type="button" 
          variant="outline" 
          onClick={resetForm}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={loading || success} 
            className="min-w-40"
          >
            {success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Enregistré
              </>
            ) : loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Valider et enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

/* ── Composants internes ── */

const COULEURS = {
  blue: {
    border: 'border-blue-100 dark:border-blue-900/40',
    header: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-300',
  },
  violet: {
    border: 'border-violet-100 dark:border-violet-900/40',
    header: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40',
    icon: 'text-violet-600 dark:text-violet-400',
    title: 'text-violet-900 dark:text-violet-300',
  },
  emerald: {
    border: 'border-emerald-100 dark:border-emerald-900/40',
    header: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-300',
  },
  orange: {
    border: 'border-orange-100 dark:border-orange-900/40',
    header: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40',
    icon: 'text-orange-600 dark:text-orange-400',
    title: 'text-orange-900 dark:text-orange-300',
  },
} as const

function Section({
  icon,
  titre,
  sous_titre,
  couleur,
  children,
}: {
  icon: React.ReactNode
  titre: string
  sous_titre?: string
  couleur: keyof typeof COULEURS
  children: React.ReactNode
}) {
  const c = COULEURS[couleur]
  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden shadow-sm`}>
      <div className={`px-4 py-3 border-b ${c.header} flex items-start justify-between`}>
        <div className="flex items-start gap-2">
          <span className={`${c.icon} mt-0.5`}>{icon}</span>
          <div>
            <h3 className={`text-sm font-semibold ${c.title}`}>{titre}</h3>
            {sous_titre && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{sous_titre}</p>}
          </div>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-zinc-900/50">
        {children}
      </div>
    </div>
  )
}

function Champ({
  id,
  label,
  sous_label,
  placeholder,
  value,
  onChange,
  error,
  rows = 3,
}: {
  id: string
  label: string
  sous_label?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={error ? 'text-red-600 dark:text-red-400' : ''}>{label}</Label>
        {sous_label && <span className="text-xs text-gray-400 dark:text-zinc-500">{sous_label}</span>}
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
