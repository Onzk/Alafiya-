'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Users, Search, Check, Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Role { id: string; nom: string }
interface Specialite { id: string; nom: string; code: string }
interface Centre { id: string; nom: string; type: string }

type CreateForm = {
  nom: string; prenoms: string; email: string; motDePasse: string
  telephone: string; centreId: string; roleId: string; specialites: string[]
}

const EMPTY_FORM: CreateForm = {
  nom: '', prenoms: '', email: '', motDePasse: '', telephone: '',
  centreId: '', roleId: '', specialites: [],
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

const STEPS = [
  { title: 'Identité',     subtitle: 'Informations personnelles et accès' },
  { title: 'Affectation',  subtitle: 'Rôle et centre de santé' },
  { title: 'Spécialités',  subtitle: 'Domaines de compétence (optionnel)' },
]

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function NouveauMedecinPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateForm>(() => ({ ...EMPTY_FORM, motDePasse: generatePassword() }))
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [spSearch, setSpSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/roles').then((r) => r.json()),
      fetch('/api/specialites').then((r) => r.json()),
      fetch('/api/centres').then((r) => r.json()),
    ]).then(([rls, sps, ctrs]) => {
      setRoles(rls.roles || [])
      setSpecialites(sps.specialites || [])
      setCentres(ctrs.centres || [])
    }).catch(() => {})
  }, [])

  function validateStep(s: number): boolean {
    if (s === 0) return !!(form.nom.trim() && form.prenoms.trim() && form.email.trim() && form.motDePasse.length >= 8)
    if (s === 1) return !!(form.roleId && form.centreId)
    return true
  }

  function goNext() {
    if (!validateStep(step)) {
      const msg = step === 0
        ? 'Veuillez remplir tous les champs obligatoires (mot de passe min. 8 caractères)'
        : 'Veuillez sélectionner un rôle et un centre de santé'
      toast({ description: msg, variant: 'destructive' })
      return
    }
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch('/api/utilisateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, niveauAcces: 'PERSONNEL' }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: 'Personnel créé avec succès' })
    router.push('/superadmin/medecins')
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(form.motDePasse)
    } catch {
      const el = document.createElement('textarea')
      el.value = form.motDePasse
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    toast({ description: 'Mot de passe copié' })
  }

  const roleOptions = roles.map((r) => ({ id: r.id, label: r.nom }))
  const centreOptions = centres.map((c) => ({ id: c.id, label: c.nom, sublabel: c.type }))
  const filteredSp = specialites.filter((sp) => sp.nom.toLowerCase().includes(spSearch.toLowerCase()))

  return (
    <div className="max-w-2xl space-y-6">
      <div className="dash-in delay-0">

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Nouveau personnel médical</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Créez un compte de personnel médical</p>
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
                i < step   ? 'bg-brand border-brand text-white' :
                i === step  ? 'border-brand text-brand bg-brand/10' :
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

                  {/* ── Step 0 : Identité ── */}
                  {step === 0 && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { key: 'nom',     label: 'Nom',     placeholder: 'Nom' },
                          { key: 'prenoms', label: 'Prénoms', placeholder: 'Prénoms' },
                          { key: 'email',   label: 'Email',   placeholder: 'personnel@centre.tg', type: 'email' },
                          { key: 'telephone', label: 'Téléphone', placeholder: '+228 XX XX XX XX', required: false },
                        ].map(({ key, label, type, placeholder, required }) => (
                          <div key={key} className="space-y-1.5">
                            <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                            <Input
                              type={type || 'text'}
                              placeholder={placeholder}
                              value={(form as Record<string, unknown>)[key] as string}
                              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Mot de passe généré *</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={form.motDePasse}
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
                            onClick={() => setForm((p) => ({ ...p, motDePasse: generatePassword() }))}
                            title="Régénérer"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                          Communiquez ce mot de passe au membre du personnel.
                        </p>
                      </div>
                    </>
                  )}

                  {/* ── Step 1 : Affectation ── */}
                  {step === 1 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Rôle *</Label>
                        <SearchableSelect
                          options={roleOptions}
                          value={form.roleId}
                          onChange={(v) => setForm((p) => ({ ...p, roleId: v }))}
                          placeholder="Sélectionner un rôle..."
                          emptyText="Aucun rôle disponible"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Centre de santé *</Label>
                        <SearchableSelect
                          options={centreOptions}
                          value={form.centreId}
                          onChange={(v) => setForm((p) => ({ ...p, centreId: v }))}
                          placeholder="Rechercher un centre..."
                          emptyText="Aucun centre trouvé"
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Step 2 : Spécialités ── */}
                  {step === 2 && (
                    <div className="space-y-2">
                      {specialites.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-zinc-500">Aucune spécialité disponible.</p>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              value={spSearch}
                              onChange={(e) => setSpSearch(e.target.value)}
                              placeholder="Filtrer les spécialités..."
                              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand/30"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto py-1">
                            {filteredSp.map((sp) => (
                              <button
                                key={sp.id}
                                type="button"
                                onClick={() => setForm((p) => ({
                                  ...p,
                                  specialites: p.specialites.includes(sp.id)
                                    ? p.specialites.filter((x) => x !== sp.id)
                                    : [...p.specialites, sp.id],
                                }))}
                                className={cn(
                                  'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors',
                                  form.specialites.includes(sp.id)
                                    ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-brand/40',
                                )}
                              >
                                {sp.nom}
                              </button>
                            ))}
                            {filteredSp.length === 0 && (
                              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune spécialité trouvée</p>
                            )}
                          </div>
                          {form.specialites.length > 0 && (
                            <p className="text-xs text-brand font-medium">{form.specialites.length} spécialité(s) sélectionnée(s)</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {step > 0 ? (
                      <Button
                        type="button" variant="outline"
                        className="h-10 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 dark:bg-zinc-950"
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
                        onClick={handleSubmit}
                      >
                        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le compte'}
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
