'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Save, ArrowLeft, Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PhotoPicker } from '@/components/patients/PhotoPicker'

const RELATIONS_PRESET = [
  'Époux/Épouse', 'Père', 'Mère', 'Fils', 'Fille',
  'Frère', 'Sœur', 'Grand-père', 'Grand-mère',
  'Oncle/Tante', 'Ami(e)', 'Tuteur/Tutrice',
]

const STEPS = [
  { title: 'Informations personnelles', subtitle: 'Données obligatoires' },
  { title: 'Contact & identité',        subtitle: 'Téléphone, email et CNI (optionnels)' },
  { title: 'Personnes à prévenir',      subtitle: "Contacts d'urgence — au moins 1" },
]

type PersonneUrgence = {
  nom: string
  prenoms: string
  telephone: string
  adresse: string
  relation: string
}

const emptyContact = (): PersonneUrgence => ({
  nom: '', prenoms: '', telephone: '', adresse: '', relation: '',
})

type InitialData = {
  nom: string
  prenoms: string
  genre: 'M' | 'F'
  dateNaissance: string
  dateNaissancePresumee: boolean
  adresse: string
  telephone: string
  email: string
  numeroCNI: string
  photo: string | null
  personnesUrgence: PersonneUrgence[]
}

export function FormulaireModificationPatient({
  patientId,
  initialData,
}: {
  patientId: string
  initialData: InitialData
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nom: initialData.nom,
    prenoms: initialData.prenoms,
    genre: initialData.genre,
    dateNaissance: initialData.dateNaissance,
    dateNaissancePresumee: initialData.dateNaissancePresumee,
    adresse: initialData.adresse,
    telephone: initialData.telephone,
    email: initialData.email,
    numeroCNI: initialData.numeroCNI,
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const initialContacts = initialData.personnesUrgence.length > 0 ? initialData.personnesUrgence : [emptyContact()]
  const [personnesUrgence, setPersonnesUrgence] = useState<PersonneUrgence[]>(initialContacts)
  const [contactSelectVals, setContactSelectVals] = useState<string[]>(
    initialContacts.map((c) => RELATIONS_PRESET.includes(c.relation) ? c.relation : (c.relation ? 'autre' : ''))
  )

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateContact = (idx: number, field: keyof PersonneUrgence, value: string) => {
    setPersonnesUrgence((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const handleRelationSelect = (idx: number, val: string) => {
    setContactSelectVals((prev) => prev.map((v, i) => i === idx ? val : v))
    if (val !== 'autre') updateContact(idx, 'relation', val)
    else updateContact(idx, 'relation', '')
  }

  const addContact = () => {
    if (personnesUrgence.length < 3) {
      setPersonnesUrgence((prev) => [...prev, emptyContact()])
      setContactSelectVals((prev) => [...prev, ''])
    }
  }

  const removeContact = (idx: number) => {
    setPersonnesUrgence((prev) => prev.filter((_, i) => i !== idx))
    setContactSelectVals((prev) => prev.filter((_, i) => i !== idx))
  }

  function validateStep(s: number): boolean {
    if (s === 0) {
      return ['nom', 'prenoms', 'dateNaissance', 'adresse'].every(
        (k) => (form as Record<string, string | boolean>)[k]?.toString().trim() !== ''
      )
    }
    if (s === 2) {
      return personnesUrgence.length > 0 && personnesUrgence.every(
        (c) => c.nom.trim() && c.prenoms.trim() && c.telephone.trim() && c.adresse.trim() && c.relation.trim()
      )
    }
    return true
  }

  function goNext() {
    if (!validateStep(step)) {
      toast({ description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    if (!validateStep(2)) {
      toast({ description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    setLoading(true)

    const res = await fetch(`/api/patients/${patientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        numeroCNI: form.numeroCNI || undefined,
        personnesUrgence,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      toast({ description: data.error || 'Erreur lors de la modification.', variant: 'destructive' })
      return
    }

    // Upload photo si une nouvelle a été sélectionnée
    if (photoFile) {
      const fd = new FormData()
      fd.append('photo', photoFile)
      await fetch(`/api/patients/${patientId}/photo`, { method: 'POST', body: fd })
    }

    setLoading(false)
    toast({ description: 'Dossier mis à jour avec succès.' })
    window.location.href = `/patients/${patientId}`
  }

  const inputCls = 'h-12 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
  const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

  return (
    <div className="max-w-2xl space-y-6">

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
          <Save className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Modifier le dossier</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {initialData.nom.toUpperCase()} {initialData.prenoms}
          </p>
        </div>
      </div>

      <div>
        {STEPS.map((s, i) => (
          <div key={i} className="flex gap-4">

            {/* Indicateur + connecteur */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 transition-all duration-200',
                i < step   ? 'bg-brand border-brand text-white' :
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

                  {/* ── Step 0 : Informations personnelles ── */}
                  {step === 0 && (
                    <>
                      <PhotoPicker initialUrl={initialData.photo} onChange={setPhotoFile} />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="nom" className={labelCls}>Nom *</Label>
                          <Input id="nom" value={form.nom} onChange={(e) => update('nom', e.target.value)} placeholder="NOM DE FAMILLE" className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="prenoms" className={labelCls}>Prénoms *</Label>
                          <Input id="prenoms" value={form.prenoms} onChange={(e) => update('prenoms', e.target.value)} placeholder="Prénoms" className={inputCls} />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className={labelCls}>Genre *</Label>
                          <div className="flex gap-2">
                            {(['M', 'F'] as const).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => update('genre', g)}
                                className={`flex-1 h-12 rounded-xl border text-sm font-semibold transition-colors ${
                                  form.genre === g
                                    ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                                }`}
                              >
                                {g === 'M' ? 'Homme' : 'Femme'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="dateNaissance" className={labelCls}>Date de naissance *</Label>
                          <Input id="dateNaissance" type="date" value={form.dateNaissance} onChange={(e) => update('dateNaissance', e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.dateNaissancePresumee}
                              onChange={(e) => update('dateNaissancePresumee', e.target.checked)}
                              className="accent-emerald-500"
                            />
                            Date présumée
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="adresse" className={labelCls}>Adresse *</Label>
                        <Input id="adresse" value={form.adresse} onChange={(e) => update('adresse', e.target.value)} placeholder="Quartier, ville" className={inputCls} />
                      </div>
                    </>
                  )}

                  {/* ── Step 1 : Contact & identité ── */}
                  {step === 1 && (
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="telephone" className={labelCls}>Téléphone</Label>
                        <Input id="telephone" type="tel" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} placeholder="+228 XX XX XX XX" className={inputCls} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className={labelCls}>Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@exemple.com" className={inputCls} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="numeroCNI" className={labelCls}>Numéro CNI</Label>
                        <Input id="numeroCNI" value={form.numeroCNI} onChange={(e) => update('numeroCNI', e.target.value)} placeholder="N° carte d'identité" className={inputCls} />
                      </div>
                    </div>
                  )}

                  {/* ── Step 2 : Personnes à prévenir ── */}
                  {step === 2 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                          {personnesUrgence.length} / 3 contact(s)
                        </p>
                        {personnesUrgence.length < 3 && (
                          <button
                            type="button"
                            onClick={addContact}
                            className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter un contact
                          </button>
                        )}
                      </div>

                      {personnesUrgence.map((contact, idx) => (
                        <div key={idx} className="border border-orange-100 dark:border-orange-900/40 rounded-xl p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                              Contact {idx + 1}
                            </p>
                            {personnesUrgence.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeContact(idx)}
                                className="text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Nom *</Label>
                              <Input value={contact.nom} onChange={(e) => updateContact(idx, 'nom', e.target.value)} placeholder="Nom" className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Prénoms *</Label>
                              <Input value={contact.prenoms} onChange={(e) => updateContact(idx, 'prenoms', e.target.value)} placeholder="Prénoms" className={inputCls} />
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Téléphone *</Label>
                              <Input type="tel" value={contact.telephone} onChange={(e) => updateContact(idx, 'telephone', e.target.value)} placeholder="+228 XX XX XX XX" className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Relation *</Label>
                              <Select value={contactSelectVals[idx] || ''} onValueChange={(val) => handleRelationSelect(idx, val)}>
                                <SelectTrigger className={inputCls}>
                                  <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {RELATIONS_PRESET.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                  <SelectItem value="autre">Autre...</SelectItem>
                                </SelectContent>
                              </Select>
                              {contactSelectVals[idx] === 'autre' && (
                                <Input
                                  value={contact.relation}
                                  onChange={(e) => updateContact(idx, 'relation', e.target.value)}
                                  placeholder="Préciser la relation"
                                  className={inputCls}
                                />
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label className={labelCls}>Adresse *</Label>
                              <Input value={contact.adresse} onChange={(e) => updateContact(idx, 'adresse', e.target.value)} placeholder="Adresse" className={inputCls} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {step > 0 ? (
                      <Button
                        type="button" variant="outline"
                        className="h-10 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
                        onClick={() => setStep((s) => s - 1)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                      </Button>
                    ) : (
                      <Link href={`/patients/${patientId}`}>
                        <Button variant="outline" type="button" className="h-10 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                          Annuler
                        </Button>
                      </Link>
                    )}

                    {step < STEPS.length - 1 ? (
                      <Button type="button" className="h-10 bg-brand hover:bg-brand-dark text-white rounded-lg" onClick={goNext}>
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
