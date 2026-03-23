'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, ArrowLeft, Users, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Role { id: string; nom: string }
interface Specialite { id: string; nom: string; code: string }

type EditForm = {
  nom: string; prenoms: string; telephone: string
  roleId: string; specialites: string[]
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

const STEPS = [
  { title: 'Identité', subtitle: 'Informations personnelles' },
  { title: 'Profil',   subtitle: 'Rôle et spécialités' },
]

export default function ModifierMedecinPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [personnelName, setPersonnelName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<EditForm>({ nom: '', prenoms: '', telephone: '', roleId: '', specialites: [] })
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [spSearch, setSpSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/roles').then((r) => r.json()),
      fetch('/api/specialites').then((r) => r.json()),
      fetch(`/api/utilisateurs/${id}`).then((r) => r.json()),
    ]).then(([rls, sps, userData]) => {
      setRoles(rls.roles || [])
      setSpecialites(sps.specialites || [])
      const u = userData.utilisateur
      if (u) {
        setPersonnelName(`${u.nom} ${u.prenoms}`)
        setForm({
          nom: u.nom,
          prenoms: u.prenoms,
          telephone: u.telephone || '',
          roleId: u.role?.id || '',
          specialites: u.specialites?.map((s: { specialite: { id: string } }) => s.specialite.id).filter(Boolean) || [],
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  function validateStep(s: number): boolean {
    if (s === 0) return !!(form.nom.trim() && form.prenoms.trim())
    if (s === 1) return !!form.roleId
    return true
  }

  function goNext() {
    if (!validateStep(step)) {
      const msg = step === 0 ? 'Veuillez remplir nom et prénoms' : 'Veuillez sélectionner un rôle'
      toast({ description: msg, variant: 'destructive' })
      return
    }
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    if (!validateStep(1)) {
      toast({ description: 'Veuillez sélectionner un rôle', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const res = await fetch(`/api/utilisateurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: 'Personnel modifié avec succès' })
    router.push('/superadmin/medecins')
  }

  const roleOptions = roles.map((r) => ({ id: r.id, label: r.nom }))
  const filteredSp = specialites.filter((sp) => sp.nom.toLowerCase().includes(spSearch.toLowerCase()))

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
          href="/superadmin/medecins"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au personnel
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Modifier le personnel</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{personnelName}</p>
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
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'nom',       label: 'Nom',       placeholder: 'Nom' },
                        { key: 'prenoms',   label: 'Prénoms',   placeholder: 'Prénoms' },
                        { key: 'telephone', label: 'Téléphone', placeholder: '+228 XX XX XX XX', required: false },
                      ].map(({ key, label, placeholder, required }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                          <Input
                            placeholder={placeholder}
                            value={(form as Record<string, unknown>)[key] as string}
                            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Step 1 : Profil ── */}
                  {step === 1 && (
                    <div className="space-y-4">
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

                      {specialites.length > 0 && (
                        <div className="space-y-2">
                          <Label className={labelCls}>Spécialités</Label>
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
                        </div>
                      )}
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
