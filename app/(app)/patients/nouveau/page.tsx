'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, UserPlus, User, Phone, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function NouveauPatientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    prenoms: '',
    genre: 'M' as 'M' | 'F',
    dateNaissance: '',
    dateNaissancePresumee: false,
    adresse: '',
    telephone: '',
    email: '',
    numeroCNI: '',
    personneUrgence: {
      nom: '',
      prenoms: '',
      telephone: '',
      adresse: '',
      relation: '',
    },
  })

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateUrgence = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      personneUrgence: { ...prev.personneUrgence, [field]: value },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        numeroCNI: form.numeroCNI || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || 'Erreur lors de la création du patient.', variant: 'destructive' })
      return
    }

    router.push(`/patients/${data.patient._id}/qrcode`)
  }

  const inputCls = 'h-12 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
  const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* En-tête */}
      <div className="dash-in delay-0">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Nouveau patient</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Créer un dossier médical patient</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Informations personnelles */}
        <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
            <div className="h-8 w-8 rounded-lg bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Informations personnelles</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">Données obligatoires</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nom" className={labelCls}>Nom *</Label>
                <Input id="nom" value={form.nom} onChange={(e) => update('nom', e.target.value)} placeholder="NOM DE FAMILLE" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prenoms" className={labelCls}>Prénoms *</Label>
                <Input id="prenoms" value={form.prenoms} onChange={(e) => update('prenoms', e.target.value)} placeholder="Prénoms" required className={inputCls} />
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
                <Input id="dateNaissance" type="date" value={form.dateNaissance} onChange={(e) => update('dateNaissance', e.target.value)} required className={inputCls} />
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
              <Input id="adresse" value={form.adresse} onChange={(e) => update('adresse', e.target.value)} placeholder="Quartier, ville" required className={inputCls} />
            </div>
          </div>
        </div>

        {/* Informations optionnelles */}
        <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Informations optionnelles</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">Contact & identité</p>
            </div>
          </div>
          <div className="p-5">
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
          </div>
        </div>

        {/* Personne à prévenir */}
        <div className="dash-in delay-225 bg-white dark:bg-zinc-950 rounded-2xl border border-orange-200 dark:border-orange-900/40 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-orange-100 dark:border-orange-900/30">
            <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-400/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Personne à prévenir en urgence *</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">Obligatoire pour tous les patients</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Nom *</Label>
                <Input value={form.personneUrgence.nom} onChange={(e) => updateUrgence('nom', e.target.value)} placeholder="Nom" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Prénoms *</Label>
                <Input value={form.personneUrgence.prenoms} onChange={(e) => updateUrgence('prenoms', e.target.value)} placeholder="Prénoms" required className={inputCls} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Téléphone *</Label>
                <Input type="tel" value={form.personneUrgence.telephone} onChange={(e) => updateUrgence('telephone', e.target.value)} placeholder="+228 XX XX XX XX" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Relation *</Label>
                <Input value={form.personneUrgence.relation} onChange={(e) => updateUrgence('relation', e.target.value)} placeholder="Ex: Époux, Mère, Enfant..." required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Adresse *</Label>
                <Input value={form.personneUrgence.adresse} onChange={(e) => updateUrgence('adresse', e.target.value)} placeholder="Adresse" required className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        <div className="dash-in delay-300 flex gap-3 justify-end">
          <Link href="/patients">
            <Button variant="outline" type="button" className="h-12 rounded-xl border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="h-12 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création en cours...</>
            ) : (
              <><UserPlus className="h-4 w-4" />Créer le dossier</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
