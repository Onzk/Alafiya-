'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Loader2, UserCheck, UserX, Users, Search, Stethoscope, Building2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Medecin {
  id: string
  nom: string
  prenoms: string
  email: string
  telephone?: string
  estActif: boolean
  createdAt: string
  specialites: { specialite: { nom: string; code: string } }[]
  centres: { centre: { id: string; nom: string; type: string } }[]
}

interface Specialite { id: string; nom: string; code: string }
interface Centre { id: string; nom: string; type: string; region: string }

const inputCls = 'h-12 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

type StatusFilter = 'tous' | 'actif' | 'inactif'

export default function MedecinsPage() {
  const { toast } = useToast()
  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<StatusFilter>('tous')
  const [filterCentre, setFilterCentre] = useState('tous')
  const [filterSpecialite, setFilterSpecialite] = useState('tous')
  const [toggling, setToggling] = useState<string | null>(null)

  const [form, setForm] = useState({
    nom: '', prenoms: '', email: '', motDePasse: '', telephone: '',
    centreId: '',
    niveauAcces: 'PERSONNEL' as const,
    specialites: [] as string[],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/utilisateurs?niveauAcces=PERSONNEL').then((r) => r.json()),
      fetch('/api/specialites').then((r) => r.json()),
      fetch('/api/centres').then((r) => r.json()),
    ]).then(([users, sps, ctrs]) => {
      setMedecins(users.utilisateurs || [])
      setSpecialites(sps.specialites || [])
      setCentres(ctrs.centres || [])
      setLoading(false)
    })
  }, [])

  function toggleSpecialite(id: string) {
    setForm((prev) => ({
      ...prev,
      specialites: prev.specialites.includes(id)
        ? prev.specialites.filter((s) => s !== id)
        : [...prev.specialites, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/utilisateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }

    // Re-fetch to get full data with specialites and centres
    const refreshed = await fetch('/api/utilisateurs?niveauAcces=PERSONNEL').then((r) => r.json())
    setMedecins(refreshed.utilisateurs || [])
    setDialogOpen(false)
    setForm({ nom: '', prenoms: '', email: '', motDePasse: '', telephone: '', centreId: '', niveauAcces: 'PERSONNEL', specialites: [] })
    toast({ description: 'Médecin créé avec succès' })
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

  function clearFilters() {
    setSearch('')
    setFilterStatut('tous')
    setFilterCentre('tous')
    setFilterSpecialite('tous')
  }

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Médecins</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {medecins.length} médecin(s) · <span className="text-brand">{actifs} actif(s)</span> · <span className="text-slate-400">{inactifs} inactif(s)</span>
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0">
              <Plus className="h-4 w-4" />Ajouter un médecin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white font-extrabold">Nouveau médecin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'nom',        label: 'Nom',           placeholder: 'Ex: KOFI' },
                  { key: 'prenoms',    label: 'Prénoms',       placeholder: 'Ex: Kwame Mensah' },
                  { key: 'email',      label: 'Email',         placeholder: 'medecin@hopital.tg', type: 'email' },
                  { key: 'motDePasse', label: 'Mot de passe',  placeholder: 'Min. 8 caractères',  type: 'password' },
                  { key: 'telephone',  label: 'Téléphone',     placeholder: '+228 XX XX XX XX',   required: false },
                ].map(({ key, label, type, placeholder, required }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                    <Input
                      type={type || 'text'}
                      placeholder={placeholder}
                      value={(form as Record<string, unknown>)[key] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      required={required !== false}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              {/* Centre */}
              <div className="space-y-1.5">
                <Label className={labelCls}>Centre de santé *</Label>
                <Select
                  value={form.centreId}
                  onValueChange={(v) => setForm((p) => ({ ...p, centreId: v }))}
                  required
                >
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Sélectionner un centre" /></SelectTrigger>
                  <SelectContent>
                    {centres.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Spécialités */}
              {specialites.length > 0 && (
                <div className="space-y-2">
                  <Label className={labelCls}>Spécialités</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialites.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => toggleSpecialite(sp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          form.specialites.includes(sp.id)
                            ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-brand/40'
                        }`}
                      >
                        {sp.nom}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" disabled={submitting || !form.centreId} className="w-full h-12 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer le médecin
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="dash-in delay-75 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
          <Input
            placeholder="Rechercher un médecin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>

        {/* Statut pills */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl p-1">
          {(['tous', 'actif', 'inactif'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatut === s
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s === 'tous' ? 'Tous' : s === 'actif' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>

        {/* Centre filter */}
        <Select value={filterCentre} onValueChange={setFilterCentre}>
          <SelectTrigger className={`${inputCls} w-[180px]`}>
            <Building2 className="h-3.5 w-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
            <SelectValue placeholder="Tous les centres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les centres</SelectItem>
            {centres.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Spécialité filter */}
        <Select value={filterSpecialite} onValueChange={setFilterSpecialite}>
          <SelectTrigger className={`${inputCls} w-[180px]`}>
            <Stethoscope className="h-3.5 w-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
            <SelectValue placeholder="Toutes spécialités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Toutes spécialités</SelectItem>
            {specialites.map((sp) => (
              <SelectItem key={sp.code} value={sp.code}>{sp.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
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
          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">
            {hasFilters ? 'Aucun résultat pour ces filtres' : 'Aucun médecin enregistré'}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            {hasFilters ? 'Modifiez les filtres ou' : 'Commencez par'} ajouter un médecin
          </p>
        </div>
      ) : (
        <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Médecin</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Centre</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Spécialités</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Statut</span>
          </div>

          <ul>
            {filtered.map((m, i) => {
              const centre = m.centres[0]?.centre
              return (
                <li
                  key={m.id}
                  className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} flex flex-col lg:grid lg:grid-cols-[1fr_1fr_1fr_auto] items-start lg:items-center gap-3 lg:gap-4 px-5 py-4 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors`}
                >
                  {/* Médecin */}
                  <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
                    <div className="h-9 w-9 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand font-bold text-xs">{m.nom[0]}{m.prenoms[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Dr. {m.nom} {m.prenoms}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{m.email}</p>
                    </div>
                  </div>

                  {/* Centre */}
                  <div className="lg:block">
                    {centre ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate">{centre.nom}</p>
                          <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-zinc-500">{centre.type}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                    )}
                  </div>

                  {/* Spécialités */}
                  <div className="flex flex-wrap gap-1">
                    {m.specialites.length > 0 ? m.specialites.map((sp) => (
                      <span key={sp.specialite.code} className="text-[10px] bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                        {sp.specialite.nom}
                      </span>
                    )) : (
                      <span className="text-xs text-slate-300 dark:text-zinc-600">Aucune</span>
                    )}
                  </div>

                  {/* Statut + action */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                      m.estActif
                        ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                    }`}>
                      {m.estActif ? <><UserCheck className="h-3 w-3" /> Actif</> : <><UserX className="h-3 w-3" /> Inactif</>}
                    </div>
                    <button
                      onClick={() => toggleActif(m.id, m.estActif)}
                      disabled={toggling === m.id}
                      className={`h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-colors disabled:opacity-50 ${
                        m.estActif
                          ? 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-red-300 hover:text-red-500 dark:hover:border-red-800 dark:hover:text-red-400'
                          : 'border-brand/30 text-brand hover:bg-brand/5 dark:hover:bg-brand/10'
                      }`}
                    >
                      {toggling === m.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : m.estActif ? 'Désactiver' : 'Activer'
                      }
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/20">
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              {filtered.length} médecin(s) affiché(s) sur {medecins.length} au total
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
