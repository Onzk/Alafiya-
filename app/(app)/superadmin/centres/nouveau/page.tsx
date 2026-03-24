'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Building2, Check, Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', CSU: 'CSU', CMS: 'CMS', AUTRE: 'Autre',
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

const STEPS = [
  { title: 'Centre de santé',        subtitle: 'Informations générales' },
  { title: 'Tarification',           subtitle: 'Prix par dossier et commission' },
  { title: 'Compte administrateur',  subtitle: "Identifiants d'accès à la plateforme" },
]

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const EMPTY_FORM = {
  nom: '', adresse: '', telephone: '', email: '', region: '', prefecture: '',
  type: 'HOPITAL' as const,
  prixParDossier: '' as string | number,
  commissionNdi: '' as string | number,
  adminNom: '', adminPrenoms: '', adminEmail: '', adminMotDePasse: '', adminTelephone: '',
}

export default function NouveauCentrePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, adminMotDePasse: generatePassword() }))

  function setField(key: string, value: string | number) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function field(key: string): string {
    return String((form as Record<string, string | number>)[key] ?? '')
  }

  function validateStep(s: number): boolean {
    if (s === 0) {
      return (['nom', 'adresse', 'telephone', 'email', 'region', 'prefecture'] as const).every((k) => form[k].trim() !== '')
    }
    if (s === 2) {
      return (['adminNom', 'adminPrenoms', 'adminEmail'] as const).every((k) => form[k].trim() !== '') && form.adminMotDePasse.length >= 8
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

  async function handleCreate() {
    if (!validateStep(2)) {
      toast({ description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/centres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    let data: Record<string, string> = {}
    try { data = await res.json() } catch {}
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: 'Centre créé avec succès' })
    router.push('/superadmin/centres')
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(form.adminMotDePasse)
    } catch {
      const el = document.createElement('textarea')
      el.value = form.adminMotDePasse
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    toast({ description: 'Mot de passe copié' })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="dash-in delay-0">

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

      <div className="dash-in delay-75 dark:bg-zinc-950 p-0 md:p-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex gap-4">
            {/* Indicator + connector */}
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

            {/* Content */}
            <div className={cn('flex-1', i < STEPS.length - 1 ? 'pb-6' : 'pb-0')}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => i < step && setStep(i)}
                className={cn(
                  'flex flex-col gap-0.5 text-left w-full',
                  i < step && 'cursor-pointer group',
                )}
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

                  {/* ── Step 0 : Centre de santé ── */}
                  {step === 0 && (
                    <>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Type *</Label>
                        <Select value={form.type} onValueChange={(v) => setField('type', v)}>
                          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(TYPE_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
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
                              value={field(key)}
                              onChange={(e) => setField(key, e.target.value)}
                              className={inputCls}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── Step 1 : Tarification ── */}
                  {step === 1 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Prix par dossier (FCFA)</Label>
                        <Input
                          type="number" min="0" placeholder="Ex : 2000"
                          value={form.prixParDossier}
                          onChange={(e) => setField('prixParDossier', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Commission N'di Solutions (FCFA)</Label>
                        <Input
                          type="number" min="0" placeholder="Ex : 1000"
                          value={form.commissionNdi}
                          onChange={(e) => setField('commissionNdi', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Step 2 : Compte administrateur ── */}
                  {step === 2 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'adminNom',       label: 'Nom',       placeholder: 'Nom' },
                        { key: 'adminPrenoms',   label: 'Prénoms',   placeholder: 'Prénoms' },
                        { key: 'adminEmail',     label: 'Email',     placeholder: 'admin@centre.tg', type: 'email' },
                        { key: 'adminTelephone', label: 'Téléphone', placeholder: '+228 XX XX XX XX', required: false },
                      ].map(({ key, label, type, placeholder, required }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                          <Input
                            type={type || 'text'}
                            placeholder={placeholder}
                            value={field(key)}
                            onChange={(e) => setField(key, e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      ))}
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className={labelCls}>Mot de passe généré *</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={form.adminMotDePasse}
                            className={cn(inputCls, 'font-mono flex-1')}
                          />
                          <Button
                            type="button" variant="outline" size="icon"
                            className="h-11 w-11 flex-shrink-0 border-slate-200 dark:border-zinc-700"
                            onClick={copyPassword}
                            title="Copier"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button" variant="outline" size="icon"
                            className="h-11 w-11 flex-shrink-0 border-slate-200 dark:border-zinc-700"
                            onClick={() => setForm((p) => ({ ...p, adminMotDePasse: generatePassword() }))}
                            title="Régénérer"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                          Communiquez ce mot de passe à l'administrateur du centre.
                        </p>
                      </div>
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
                    ) : <div />}

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
                        disabled={submitting}
                        className="h-10 bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm shadow-brand/20"
                        onClick={handleCreate}
                      >
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le centre'}
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
