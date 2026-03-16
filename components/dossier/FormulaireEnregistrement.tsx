'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DicteeVocale } from '@/components/ia/DicteeVocale'
import { StructureIA } from '@/types'

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
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [transcriptionBrute, setTranscriptionBrute] = useState('')

  const [form, setForm] = useState({
    antecedents: '',
    signes: '',
    examens: '',
    bilan: '',
    traitements: { conseils: '', injections: '', ordonnance: '' },
    suivi: '',
  })

  function updateTrait(field: 'conseils' | 'injections' | 'ordonnance', val: string) {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErreur('')

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
      setErreur(data.error || 'Erreur lors de l\'enregistrement.')
      return
    }

    router.refresh()
    router.back()
  }

  const champs = [
    { key: 'antecedents', label: 'Antécédents médicaux', placeholder: 'Antécédents pertinents du patient...' },
    { key: 'signes', label: 'Signes et symptômes', placeholder: 'Signes cliniques observés, symptômes rapportés...' },
    { key: 'examens', label: 'Examens effectués', placeholder: 'Examens cliniques, paracliniques réalisés...' },
    { key: 'bilan', label: 'Bilan et analyses', placeholder: 'Résultats des analyses et bilans...' },
    { key: 'suivi', label: 'Suivi préconisé', placeholder: 'Contrôle à prévoir, examens complémentaires...' },
  ] as const

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Nouvelle consultation — {specialiteNom}
        </h2>
      </div>

      {erreur && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {erreur}
        </div>
      )}

      {/* Dictée vocale */}
      <DicteeVocale onStructure={handleStructureIA} />

      {transcriptionBrute && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
          <p className="font-medium mb-1">Transcription brute Whisper :</p>
          <p className="italic">{transcriptionBrute}</p>
          <p className="mt-2 text-yellow-700 font-medium">
            Formulaire pré-rempli par IA — Relisez et corrigez si nécessaire avant de valider.
          </p>
        </div>
      )}

      {/* Champs médicaux */}
      {champs.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key}>{label}</Label>
          <Textarea
            id={key}
            value={form[key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={3}
          />
        </div>
      ))}

      {/* Traitements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Traitements prescrits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            { key: 'conseils', label: 'Conseils au patient', placeholder: 'Conseils hygiéno-diététiques, instructions...' },
            { key: 'injections', label: 'Injections administrées', placeholder: 'Médicaments injectés, doses...' },
            { key: 'ordonnance', label: 'Ordonnance médicale', placeholder: 'Médicaments prescrits, posologies, durée...' },
          ] as const).map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Textarea
                value={form.traitements[key]}
                onChange={(e) => updateTrait(key, e.target.value)}
                placeholder={placeholder}
                rows={2}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
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
    </form>
  )
}
