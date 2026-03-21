'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', CSU: 'CSU', CMS: 'CMS', AUTRE: 'Autre',
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

const EMPTY_FORM = {
  nom: '', adresse: '', telephone: '', email: '', region: '', prefecture: '',
  type: 'HOPITAL' as const,
  adminNom: '', adminPrenoms: '', adminEmail: '', adminMotDePasse: '', adminTelephone: '',
}

export default function NouveauCentrePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const missing = (['nom', 'adresse', 'telephone', 'email', 'region', 'prefecture', 'adminNom', 'adminPrenoms', 'adminEmail', 'adminMotDePasse'] as const)
      .filter((k) => !form[k].trim())
    if (missing.length > 0) {
      toast({ description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/centres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: 'Centre créé avec succès' })
    router.push('/ministere/centres')
  }

  return (
    <div className="space-y-6">
      <div className="dash-in delay-0">
        <Link
          href="/ministere/centres"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux centres
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Nouveau centre de santé</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Remplissez les informations du centre et du compte administrateur</p>
          </div>
        </div>
      </div>

      <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 md:p-8">
        <form onSubmit={handleCreate} className="flex flex-col gap-6">

          {/* Centre de santé */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Centre de santé</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-full">
                <Label className={labelCls}>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof form.type }))}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {[
                { key: 'nom',        label: 'Nom du centre', placeholder: 'Ex: CHU de Lomé' },
                { key: 'adresse',    label: 'Adresse',       placeholder: 'Ex: Rue des Fleurs, Lomé' },
                { key: 'telephone',  label: 'Téléphone',     placeholder: '+228 XX XX XX XX' },
                { key: 'email',      label: 'Email',         placeholder: 'centre@sante.tg', type: 'email' },
                { key: 'region',     label: 'Région',        placeholder: 'Ex: Maritime' },
                { key: 'prefecture', label: 'Préfecture',    placeholder: 'Ex: Golfe' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className={labelCls}>{label} *</Label>
                  <Input
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Compte administrateur */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Compte administrateur</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'adminNom',        label: 'Nom',          placeholder: 'Nom' },
                { key: 'adminPrenoms',    label: 'Prénoms',      placeholder: 'Prénoms' },
                { key: 'adminEmail',      label: 'Email',        placeholder: 'admin@centre.tg', type: 'email' },
                { key: 'adminMotDePasse', label: 'Mot de passe', placeholder: 'Min. 8 caractères', type: 'password' },
                { key: 'adminTelephone',  label: 'Téléphone',    placeholder: '+228 XX XX XX XX', required: false },
              ].map(({ key, label, type, placeholder, required }) => (
                <div key={key} className="space-y-1.5">
                  <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                  <Input
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-min h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20"
          >
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le centre'}
          </Button>
        </form>
      </div>
    </div>
  )
}
