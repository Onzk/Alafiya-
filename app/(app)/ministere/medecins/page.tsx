'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Loader2, UserCheck, UserX, Users, Search, X,
  Building2, MoreHorizontal, Pencil, Trash2, Power, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

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
  specialites: { specialite: { nom: string; code: string } }[]
  centres: { centre: { id: string; nom: string; type: string } }[]
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'

type StatusFilter = 'tous' | 'actif' | 'inactif'

export default function MedecinsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)

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
    ]).then(([users, sps, ctrs]) => {
      setMedecins(users.utilisateurs || [])
      setSpecialites(sps.specialites || [])
      setCentres(ctrs.centres || [])
      setLoading(false)
    })
  }, [])

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

        <Button
          onClick={() => router.push('/ministere/medecins/nouveau')}
          className="h-11 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />Ajouter un personnel
        </Button>
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
            <div className="grid grid-cols-[2fr_1fr_1fr_90px_44px] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              {['Personnel', 'Centre', 'Spécialités', 'Statut', ''].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
              ))}
            </div>
            <ul>
              {filtered.map((m, i) => {
                const centre = m.centres[0]?.centre
                return (
                  <li key={m.id} onClick={() => router.push(`/ministere/medecins/${m.id}`)} className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} grid grid-cols-[2fr_1fr_1fr_90px_44px] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer`}>
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
                          <DropdownMenuItem onClick={() => router.push(`/ministere/medecins/${m.id}/modifier`)}>
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
                            <DropdownMenuItem onClick={() => router.push(`/ministere/medecins/${m.id}/modifier`)}>
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
