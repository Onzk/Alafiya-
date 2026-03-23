'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, ArrowLeft, Building2, Check } from 'lucide-react'
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
  { title: 'Informations générales', subtitle: 'Coordonnées et type du centre' },
  { title: 'Tarification',           subtitle: 'Prix par dossier et commission' },
]

type EditForm = {
  nom: string; adresse: string; telephone: string; email: string
  region: string; prefecture: string; type: string
  prixParDossier: number; commissionNdi: number
}

export default function ModifierCentrePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [centreName, setCentreName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<EditForm>({
    nom: '', adresse: '', telephone: '', email: '', region: '', prefecture: '', type: 'HOPITAL',
    prixParDossier: 0, commissionNdi: 0,
  })

  useEffect(() => {
    fetch(`/api/centres/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const c = d.centre
        if (c) {
          setCentreName(c.nom)
          setForm({
            nom: c.nom, adresse: c.adresse, telephone: c.telephone, email: c.email,
            region: c.region, prefecture: c.prefecture, type: c.type,
            prixParDossier: c.prixParDossier ?? 0, commissionNdi: c.commissionNdi ?? 0,
          })
        }
        setLoading(false)
      })
  }, [id])

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch(`/api/centres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: 'Centre modifié avec succès' })
    router.push('/superadmin/centres')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="dash-in delay-0">
        <Link
          href="/superadmin/centres"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux centres
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Modifier le centre</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{centreName}</p>
          </div>
        </div>
      </div>

      <div className="dash-in delay-75 bg-white dark:bg-zinc-950">
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

                  {/* ── Step 0 : Informations générales ── */}
                  {step === 0 && (
                    <>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Type *</Label>
                        <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
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
                          { key: 'nom',        label: 'Nom du centre', placeholder: 'Nom du centre' },
                          { key: 'adresse',    label: 'Adresse',       placeholder: 'Adresse' },
                          { key: 'telephone',  label: 'Téléphone',     placeholder: '+228 XX XX XX XX' },
                          { key: 'email',      label: 'Email',         placeholder: 'email@centre.tg', type: 'email' },
                          { key: 'region',     label: 'Région',        placeholder: 'Région' },
                          { key: 'prefecture', label: 'Préfecture',    placeholder: 'Préfecture' },
                        ].map(({ key, label, type, placeholder }) => (
                          <div key={key} className="space-y-1.5">
                            <Label className={labelCls}>{label} *</Label>
                            <Input
                              type={type || 'text'}
                              placeholder={placeholder}
                              value={(form as Record<string, string>)[key]}
                              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                              required
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
                          onChange={(e) => setForm((p) => ({ ...p, prixParDossier: Number(e.target.value) }))}
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Commission N'di Solutions (FCFA)</Label>
                        <Input
                          type="number" min="0" placeholder="Ex : 1000"
                          value={form.commissionNdi}
                          onChange={(e) => setForm((p) => ({ ...p, commissionNdi: Number(e.target.value) }))}
                          className={inputCls}
                        />
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
                        onClick={() => setStep((s) => s + 1)}
                      >
                        Suivant
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={submitting}
                        className="h-10 bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm shadow-brand/20"
                        onClick={handleSubmit}
                      >
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer'}
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
