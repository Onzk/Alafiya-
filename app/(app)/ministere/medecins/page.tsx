'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  Plus, Loader2, UserCheck, UserX, Users, Search, X, Check,
  Building2, MoreHorizontal, Pencil, Trash2, Power, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface TypePersonnel { id: string; nom: string; code: string }
interface Specialite { id: string; nom: string; code: string }
interface Centre { id: string; nom: string; type: string; region: string }

interface Medecin {
  id: string
  nom: string
  prenoms: string
  email: string
  telephone?: string
  estActif: boolean
  createdAt: string
  typePersonnel?: TypePersonnel
  specialites: { specialite: { nom: string; code: string } }[]
  centres: { centre: { id: string; nom: string; type: string } }[]
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

type StatusFilter = 'tous' | 'actif' | 'inactif'

type CreateForm = {
  nom: string; prenoms: string; email: string; motDePasse: string; telephone: string
  centreId: string; typePersonnelId: string; specialites: string[]
}
type EditForm = { nom: string; prenoms: string; telephone: string; typePersonnelId: string; specialites: string[] }

const EMPTY_CREATE: CreateForm = { nom: '', prenoms: '', email: '', motDePasse: '', telephone: '', centreId: '', typePersonnelId: '', specialites: [] }
const EMPTY_EDIT: EditForm = { nom: '', prenoms: '', telephone: '', typePersonnelId: '', specialites: [] }

function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-start mb-8">
      {steps.map((label, i) => (
        <Fragment key={i}>
          <div className="flex flex-col items-center shrink-0">
            {/* Cercle étape */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 border-2 ${
              i < current
                ? 'bg-brand border-brand text-white shadow-md shadow-brand/30'
                : i === current
                ? 'bg-white dark:bg-zinc-800 border-brand text-brand shadow-lg shadow-brand/20 ring-4 ring-brand/15 scale-110'
                : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
            }`}>
              {i < current ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </div>
            {/* Label */}
            <span className={`text-xs font-bold whitespace-nowrap mt-2 transition-all duration-300 ${
              i === current ? 'text-slate-900 dark:text-white scale-105' : 'text-slate-500 dark:text-zinc-400'
            }`}>
              {label}
            </span>
          </div>
          {/* Connecteur */}
          {i < steps.length - 1 && (
            <div className="flex-1 flex items-center">
              <div className={`flex-1 h-1 mx-2 mt-0.5 rounded-full transition-all duration-500 ${
                i < current ? 'bg-brand shadow-sm shadow-brand/30' : 'bg-slate-200 dark:bg-zinc-700'
              }`} />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

export default function MedecinsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [typesPersonnel, setTypesPersonnel] = useState<TypePersonnel[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_CREATE)
  const [spCreateSearch, setSpCreateSearch] = useState('')

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Medecin | null>(null)
  const [editStep, setEditStep] = useState(0)
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [spEditSearch, setSpEditSearch] = useState('')

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Medecin | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toggle dialog
  const [toggleTarget, setToggleTarget] = useState<Medecin | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<StatusFilter>('tous')
  const [filterCentre, setFilterCentre] = useState('tous')
  const [filterSpecialite, setFilterSpecialite] = useState('tous')
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/utilisateurs?niveauAcces=PERSONNEL').then((r) => r.json()),
      fetch('/api/specialites').then((r) => r.json()),
      fetch('/api/centres').then((r) => r.json()),
      fetch('/api/types-personnel').then((r) => r.json()),
    ]).then(([users, sps, ctrs, tps]) => {
      setMedecins(users.utilisateurs || [])
      setSpecialites(sps.specialites || [])
      setCentres(ctrs.centres || [])
      setTypesPersonnel(tps.types || [])
      setLoading(false)
    })
  }, [])

  function validateCreateStep1() {
    const { nom, prenoms, email, motDePasse } = form
    if (!nom.trim() || !prenoms.trim() || !email.trim() || !motDePasse.trim()) {
      toast({ description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return false
    }
    if (motDePasse.length < 8) {
      toast({ description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' })
      return false
    }
    return true
  }

  function validateCreateStep2() {
    if (!form.typePersonnelId) {
      toast({ description: 'Veuillez sélectionner un type de personnel', variant: 'destructive' })
      return false
    }
    if (!form.centreId) {
      toast({ description: 'Veuillez sélectionner un centre de santé', variant: 'destructive' })
      return false
    }
    return true
  }

  function validateEditStep1() {
    if (!editForm.nom.trim() || !editForm.prenoms.trim()) {
      toast({ description: 'Veuillez remplir nom et prénoms', variant: 'destructive' })
      return false
    }
    return true
  }

  function validateEditStep2() {
    if (!editForm.typePersonnelId) {
      toast({ description: 'Veuillez sélectionner un type de personnel', variant: 'destructive' })
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateCreateStep2()) return
    setSubmitting(true)
    const res = await fetch('/api/utilisateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, niveauAcces: 'PERSONNEL' }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    const refreshed = await fetch('/api/utilisateurs?niveauAcces=PERSONNEL').then((r) => r.json())
    setMedecins(refreshed.utilisateurs || [])
    setDialogOpen(false)
    setForm(EMPTY_CREATE)
    setCreateStep(0)
    toast({ description: 'Personnel créé avec succès' })
  }

  function openEdit(m: Medecin) {
    setEditTarget(m)
    setEditStep(0)
    setSpEditSearch('')
    setEditForm({
      nom: m.nom,
      prenoms: m.prenoms,
      telephone: m.telephone || '',
      typePersonnelId: m.typePersonnel?.id || '',
      specialites: m.specialites.map((s) => {
        const found = specialites.find((sp) => sp.code === s.specialite.code)
        return found?.id || ''
      }).filter(Boolean),
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEditStep2()) return
    if (!editTarget) return
    setEditSubmitting(true)
    const res = await fetch(`/api/utilisateurs/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    setEditSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    const refreshed = await fetch('/api/utilisateurs?niveauAcces=PERSONNEL').then((r) => r.json())
    setMedecins(refreshed.utilisateurs || [])
    setEditTarget(null)
    toast({ description: 'Personnel modifié avec succès' })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/utilisateurs/${deleteTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setMedecins((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast({ description: 'Personnel supprimé' })
  }

  async function toggleActif(id: string, actuel: boolean) {
    setToggling(id)
    const res = await fetch(`/api/utilisateurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActif: !actuel }),
    })
    setToggling(null)
    if (res.ok) {
      setMedecins((prev) => prev.map((m) => m.id === id ? { ...m, estActif: !actuel } : m))
    }
  }

  const filtered = useMemo(() => {
    return medecins.filter((m) => {
      const matchSearch = search === '' ||
        `${m.nom} ${m.prenoms} ${m.email}`.toLowerCase().includes(search.toLowerCase())
      const matchStatut = filterStatut === 'tous' ||
        (filterStatut === 'actif' ? m.estActif : !m.estActif)
      const matchCentre = filterCentre === 'tous' ||
        m.centres.some((c) => c.centre.id === filterCentre)
      const matchSpecialite = filterSpecialite === 'tous' ||
        m.specialites.some((s) => s.specialite.code === filterSpecialite)
      return matchSearch && matchStatut && matchCentre && matchSpecialite
    })
  }, [medecins, search, filterStatut, filterCentre, filterSpecialite])

  const actifs = medecins.filter((m) => m.estActif).length
  const inactifs = medecins.length - actifs
  const hasFilters = search !== '' || filterStatut !== 'tous' || filterCentre !== 'tous' || filterSpecialite !== 'tous'

  const centreOptions = centres.map((c) => ({ id: c.id, label: c.nom, sublabel: c.type }))
  const typeOptions = typesPersonnel.map((t) => ({ id: t.id, label: t.nom }))
  const filteredSpCreate = specialites.filter((sp) => sp.nom.toLowerCase().includes(spCreateSearch.toLowerCase()))
  const filteredSpEdit = specialites.filter((sp) => sp.nom.toLowerCase().includes(spEditSearch.toLowerCase()))

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Personnel médical</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {medecins.length} personnel(s) · <span className="text-brand">{actifs} actif(s)</span> · <span className="text-slate-400">{inactifs} inactif(s)</span>
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(EMPTY_CREATE); setCreateStep(0); setSpCreateSearch('') } }}>
          <DialogTrigger asChild>
            <Button className="h-11 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0">
              <Plus className="h-4 w-4" />Ajouter un personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader title="Nouveau personnel médical" description="Ajoutez un membre du personnel avec ses compétences et son affectation." icon={Plus} />
            <form onSubmit={handleSubmit} className="px-5 md:px-7 py-5 md:py-6 flex flex-col gap-4">
              <StepBar steps={['Identité', 'Affectation']} current={createStep} />

              {createStep === 0 && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { key: 'nom',        label: 'Nom',          placeholder: 'Ex: KOFI' },
                      { key: 'prenoms',    label: 'Prénoms',      placeholder: 'Ex: Kwame Mensah' },
                      { key: 'email',      label: 'Email',        placeholder: 'personnel@hopital.tg', type: 'email' },
                      { key: 'motDePasse', label: 'Mot de passe', placeholder: 'Min. 8 caractères', type: 'password' },
                    ].map(({ key, label, type, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className={labelCls}>{label} *</Label>
                        <Input type={type || 'text'} placeholder={placeholder}
                          value={(form as Record<string, unknown>)[key] as string}
                          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                          className={inputCls} />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Téléphone</Label>
                      <Input placeholder="+228 XX XX XX XX" value={form.telephone}
                        onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
                        className={inputCls} />
                    </div>
                  </div>
                  <Button type="button" onClick={() => validateCreateStep1() && setCreateStep(1)}
                    className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                    Suivant — Affectation
                  </Button>
                </div>
              )}

              {createStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Type de personnel *</Label>
                    <SearchableSelect
                      options={typeOptions}
                      value={form.typePersonnelId}
                      onChange={(v) => setForm((p) => ({ ...p, typePersonnelId: v }))}
                      placeholder="Sélectionner un type..."
                      emptyText="Aucun type disponible"
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

                  {specialites.length > 0 && (
                    <div className="space-y-2">
                      <Label className={labelCls}>Spécialités</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text" value={spCreateSearch}
                          onChange={(e) => setSpCreateSearch(e.target.value)}
                          placeholder="Filtrer les spécialités..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand/30"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto py-1">
                        {filteredSpCreate.map((sp) => (
                          <button key={sp.id} type="button" onClick={() => setForm((p) => ({
                            ...p,
                            specialites: p.specialites.includes(sp.id)
                              ? p.specialites.filter((s) => s !== sp.id)
                              : [...p.specialites, sp.id],
                          }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                              form.specialites.includes(sp.id)
                                ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                                : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-brand/40'
                            }`}>
                            {sp.nom}
                          </button>
                        ))}
                        {filteredSpCreate.length === 0 && (
                          <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune spécialité trouvée</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={() => setCreateStep(0)} className="h-11 rounded-xl flex-1">
                      Retour
                    </Button>
                    <Button type="submit" disabled={submitting} className="flex-1 h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                      {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le personnel'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="dash-in delay-75 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
          <Input placeholder="Rechercher un personnel..." value={search} onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`} />
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-1">
          {(['tous', 'actif', 'inactif'] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => setFilterStatut(s)}
              className={`px-3 py-1 h-9 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatut === s ? 'bg-brand text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}>
              {s === 'tous' ? 'Tous' : s === 'actif' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>

        <Select value={filterCentre} onValueChange={setFilterCentre}>
          <SelectTrigger className={`${inputCls} w-[180px]`}>
            <Building2 className="h-3.5 w-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
            <SelectValue placeholder="Tous les centres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les centres</SelectItem>
            {centres.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterSpecialite} onValueChange={setFilterSpecialite}>
          <SelectTrigger className={`${inputCls} w-[180px]`}>
            <SelectValue placeholder="Toutes spécialités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Toutes spécialités</SelectItem>
            {specialites.map((sp) => <SelectItem key={sp.code} value={sp.code}>{sp.nom}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterStatut('tous'); setFilterCentre('tous'); setFilterSpecialite('tous') }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
            <X className="h-3.5 w-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="dash-in delay-75 flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-in delay-75 py-16 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">
            {hasFilters ? 'Aucun résultat pour ces filtres' : 'Aucun personnel enregistré'}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            {hasFilters ? 'Modifiez les filtres ou' : 'Commencez par'} ajouter un personnel
          </p>
        </div>
      ) : (
        <>
          {/* ── TABLE desktop ── */}
          <div className="dash-in delay-150 hidden lg:block bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_90px_44px] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              {['Personnel', 'Type', 'Centre', 'Spécialités', 'Statut', ''].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
              ))}
            </div>
            <ul>
              {filtered.map((m, i) => {
                const centre = m.centres[0]?.centre
                return (
                  <li key={m.id} onClick={() => router.push(`/ministere/medecins/${m.id}`)} className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} grid grid-cols-[2fr_1fr_1fr_1fr_90px_44px] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand font-bold text-xs">{m.nom[0]}{m.prenoms[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.nom} {m.prenoms}</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{m.email}</p>
                      </div>
                    </div>
                    <div>
                      {m.typePersonnel ? (
                        <span className="text-xs bg-purple-50 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg font-semibold">{m.typePersonnel.nom}</span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                      )}
                    </div>
                    <div>
                      {centre ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-zinc-950 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate">{centre.nom}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.specialites.length > 0 ? m.specialites.slice(0, 2).map((sp) => (
                        <span key={sp.specialite.code} className="text-[10px] bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                          {sp.specialite.nom}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-300 dark:text-zinc-600">Aucune</span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold w-fit ${m.estActif ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                      {m.estActif ? <><UserCheck className="h-2.5 w-2.5" />Actif</> : <><UserX className="h-2.5 w-2.5" />Inactif</>}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/ministere/medecins/${m.id}`)}>
                            <Eye className="h-4 w-4 text-slate-400" /><span>Voir les détails</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(m)}>
                            <Pencil className="h-4 w-4 text-slate-400" /><span>Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setToggleTarget(m)}
                            className={m.estActif ? 'text-orange-500 focus:text-orange-600' : 'text-brand focus:text-brand'}>
                            <Power className="h-4 w-4" />
                            <span>{m.estActif ? 'Désactiver' : 'Activer'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(m)} className="text-red-500 focus:text-red-600">
                            <Trash2 className="h-4 w-4" /><span>Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/20">
              <p className="text-xs text-slate-400 dark:text-zinc-500">{filtered.length} personnel(s) affiché(s) sur {medecins.length} au total</p>
            </div>
          </div>

          {/* ── CARDS mobile ── */}
          <div className="dash-in delay-150 lg:hidden grid sm:grid-cols-2 gap-4">
            {filtered.map((m, i) => {
              const centre = m.centres[0]?.centre
              return (
                <div key={m.id} onClick={() => router.push(`/ministere/medecins/${m.id}`)} className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}>
                  <div className="h-1 bg-brand" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand font-bold text-xs">{m.nom[0]}{m.prenoms[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.nom} {m.prenoms}</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{m.email}</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => router.push(`/ministere/medecins/${m.id}`)}>
                              <Eye className="h-4 w-4 text-slate-400" /><span>Voir les détails</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(m)}>
                              <Pencil className="h-4 w-4 text-slate-400" /><span>Modifier</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setToggleTarget(m)}
                              className={m.estActif ? 'text-orange-500 focus:text-orange-600' : 'text-brand focus:text-brand'}>
                              <Power className="h-4 w-4" />
                              <span>{m.estActif ? 'Désactiver' : 'Activer'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(m)} className="text-red-500 focus:text-red-600">
                              <Trash2 className="h-4 w-4" /><span>Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {m.typePersonnel && (
                      <span className="inline-block text-xs bg-purple-50 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg font-semibold">{m.typePersonnel.nom}</span>
                    )}
                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      {centre && (
                        <p className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{centre.nom}</span>
                        </p>
                      )}
                      {m.specialites.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {m.specialites.map((sp) => (
                            <span key={sp.specialite.code} className="text-[10px] bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                              {sp.specialite.nom}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold w-fit ${m.estActif ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                      {m.estActif ? <><UserCheck className="h-2.5 w-2.5" />Actif</> : <><UserX className="h-2.5 w-2.5" />Inactif</>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Dialog modifier ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) { setEditTarget(null); setEditStep(0); setSpEditSearch('') } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader title="Modifier le personnel" description="Mettez à jour les informations de ce membre du personnel." icon={Pencil} />
          <form onSubmit={handleEdit} className="px-5 md:px-7 py-5 md:py-6 flex flex-col gap-4">
            <StepBar steps={['Identité', 'Affectation']} current={editStep} />

            {editStep === 0 && (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { key: 'nom',     label: 'Nom',     placeholder: 'Nom' },
                    { key: 'prenoms', label: 'Prénoms', placeholder: 'Prénoms' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className={labelCls}>{label} *</Label>
                      <Input placeholder={placeholder}
                        value={(editForm as Record<string, unknown>)[key] as string}
                        onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                        className={inputCls} />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Téléphone</Label>
                    <Input placeholder="+228 XX XX XX XX" value={editForm.telephone}
                      onChange={(e) => setEditForm((p) => ({ ...p, telephone: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <Button type="button" onClick={() => validateEditStep1() && setEditStep(1)}
                  className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                  Suivant — Affectation
                </Button>
              </div>
            )}

            {editStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Type de personnel *</Label>
                  <SearchableSelect
                    options={typeOptions}
                    value={editForm.typePersonnelId}
                    onChange={(v) => setEditForm((p) => ({ ...p, typePersonnelId: v }))}
                    placeholder="Sélectionner un type..."
                    emptyText="Aucun type disponible"
                  />
                </div>

                {specialites.length > 0 && (
                  <div className="space-y-2">
                    <Label className={labelCls}>Spécialités</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text" value={spEditSearch}
                        onChange={(e) => setSpEditSearch(e.target.value)}
                        placeholder="Filtrer les spécialités..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand/30"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto py-1">
                      {filteredSpEdit.map((sp) => (
                        <button key={sp.id} type="button" onClick={() => setEditForm((p) => ({
                          ...p,
                          specialites: p.specialites.includes(sp.id)
                            ? p.specialites.filter((s) => s !== sp.id)
                            : [...p.specialites, sp.id],
                        }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            editForm.specialites.includes(sp.id)
                              ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                              : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-brand/40'
                          }`}>
                          {sp.nom}
                        </button>
                      ))}
                      {filteredSpEdit.length === 0 && (
                        <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune spécialité trouvée</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setEditStep(0)} className="h-11 rounded-xl flex-1">
                    Retour
                  </Button>
                  <Button type="submit" disabled={editSubmitting} className="flex-1 h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                    {editSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog toggle actif ── */}
      <Dialog open={!!toggleTarget} onOpenChange={(o) => { if (!o) setToggleTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader
            title={toggleTarget?.estActif ? 'Désactiver le personnel ?' : 'Activer le personnel ?'}
            description={toggleTarget?.estActif
              ? `${toggleTarget?.nom} ${toggleTarget?.prenoms} n'aura plus accès à la plateforme.`
              : `${toggleTarget?.nom} ${toggleTarget?.prenoms} aura de nouveau accès à la plateforme.`}
            icon={Power}
          />
          <div className="flex gap-3 px-5 md:px-7 pb-5 md:pb-6">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setToggleTarget(null)}>Annuler</Button>
            <Button
              className={`flex-1 h-11 rounded-xl text-white shadow-sm ${toggleTarget?.estActif ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand hover:bg-brand-dark'}`}
              onClick={async () => {
                if (toggleTarget) {
                  await toggleActif(toggleTarget.id, toggleTarget.estActif)
                  setToggleTarget(null)
                }
              }}
              disabled={toggling === toggleTarget?.id}
            >
              {toggling === toggleTarget?.id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (toggleTarget?.estActif ? 'Désactiver' : 'Activer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog supprimer ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader title="Supprimer le personnel ?" description={`Vous êtes sur le point de supprimer ${deleteTarget?.nom} ${deleteTarget?.prenoms}. Cette action est irréversible.`} icon={Trash2} danger />
          <div className="flex gap-3 px-5 md:px-7 pb-5 md:pb-6">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
