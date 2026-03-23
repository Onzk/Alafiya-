'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Building2, Loader2, CheckCircle2, XCircle, Search,
  Pencil, Trash2, X, MapPin, MoreHorizontal, Eye, Power, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Centre {
  id: string
  nom: string
  type: string
  adresse: string
  telephone: string
  email: string
  region: string
  prefecture: string
  estActif: boolean
  admin?: { nom: string; prenoms: string; email: string }
  _count?: { utilisateurs: number }
}

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', CSU: 'CSU', CMS: 'CMS', AUTRE: 'Autre',
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'

export default function CentresPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<'tous' | 'actif' | 'inactif'>('tous')
  const [filterType, setFilterType] = useState<string>('tous')

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Centre | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toggle loading
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/centres')
      .then((r) => r.json())
      .then((d) => { setCentres(d.centres || []); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    return centres.filter((c) => {
      const matchSearch = search === '' ||
        `${c.nom} ${c.region} ${c.prefecture} ${c.type}`.toLowerCase().includes(search.toLowerCase())
      const matchStatut = filterStatut === 'tous' || (filterStatut === 'actif' ? c.estActif : !c.estActif)
      const matchType = filterType === 'tous' || c.type === filterType
      return matchSearch && matchStatut && matchType
    })
  }, [centres, search, filterStatut, filterType])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/centres/${deleteTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setCentres((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast({ description: 'Centre supprimé' })
  }

  async function toggleActif(id: string, actuel: boolean) {
    setToggling(id)
    const res = await fetch(`/api/centres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActif: !actuel }),
    })
    setToggling(null)
    if (res.ok) setCentres((prev) => prev.map((c) => c.id === id ? { ...c, estActif: !actuel } : c))
  }

  const actifs = centres.filter((c) => c.estActif).length

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Centres de santé</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {centres.length} centre(s) · <span className="text-brand">{actifs} actif(s)</span>
          </p>
        </div>

        <Button
          onClick={() => router.push('/superadmin/centres/nouveau')}
          className="h-11 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />Nouveau centre
        </Button>
      </div>

      {/* Filtres */}
      <div className="dash-in delay-75 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
          <Input placeholder="Rechercher un centre..." value={search} onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`} />
        </div>
        <div className="flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:border-zinc-700 rounded-xl p-1">
          {(['tous', 'actif', 'inactif'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatut(s)}
              className={`px-3 py-1 h-9 rounded-lg text-xs font-semibold capitalize transition-colors ${filterStatut === s ? 'bg-brand text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}>
              {s === 'tous' ? 'Tous' : s === 'actif' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-11 w-[150px] border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-400">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterStatut !== 'tous' || filterType !== 'tous') && (
          <button onClick={() => { setSearch(''); setFilterStatut('tous'); setFilterType('tous') }}
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
            <Building2 className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Aucun centre trouvé</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Créez votre premier centre de santé</p>
        </div>
      ) : (
        <>
          {/* ── TABLE desktop ── */}
          <div className="dash-in delay-100 hidden lg:block bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[2fr_100px_1fr_1fr_70px_90px_44px] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              {['Centre', 'Type', 'Localisation', 'Administrateur', 'Personnel', 'Statut', ''].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
              ))}
            </div>
            <ul>
              {filtered.map((c, i) => (
                <li key={c.id}
                  onClick={() => router.push(`/superadmin/centres/${c.id}`)}
                  className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} grid grid-cols-[2fr_100px_1fr_1fr_70px_90px_44px] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer`}>
                  {/* Centre */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.nom}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{c.email}</p>
                    </div>
                  </div>
                  {/* Type */}
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 w-fit">{TYPE_LABELS[c.type] ?? c.type}</span>
                  {/* Localisation */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300 truncate">{c.region}, {c.prefecture}</span>
                  </div>
                  {/* Admin */}
                  <div className="min-w-0">
                    {c.admin ? (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 truncate">{c.admin.nom} {c.admin.prenoms}</p>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                    )}
                  </div>
                  {/* Personnel */}
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{c._count?.utilisateurs ?? 0}</span>
                  </div>
                  {/* Statut */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold w-fit ${c.estActif ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                    {c.estActif ? <><CheckCircle2 className="h-2.5 w-2.5" />Actif</> : <><XCircle className="h-2.5 w-2.5" />Inactif</>}
                  </div>
                  {/* Dropdown actions */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => router.push(`/superadmin/centres/${c.id}`)}>
                          <Eye className="h-4 w-4 text-slate-400" />
                          <span>Voir les détails</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/superadmin/centres/${c.id}/modifier`)}>
                          <Pencil className="h-4 w-4 text-slate-400" />
                          <span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleActif(c.id, c.estActif)} disabled={toggling === c.id}
                          className={c.estActif ? 'text-orange-500 focus:text-orange-600' : 'text-brand focus:text-brand'}>
                          {toggling === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                          <span>{c.estActif ? 'Désactiver' : 'Activer'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(c)} className="text-red-500 focus:text-red-600">
                          <Trash2 className="h-4 w-4" />
                          <span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/20">
              <p className="text-xs text-slate-400 dark:text-zinc-500">{filtered.length} centre(s) affiché(s) sur {centres.length} au total</p>
            </div>
          </div>

          {/* ── CARDS mobile ── */}
          <div className="dash-in delay-100 lg:hidden grid sm:grid-cols-2 gap-4">
            {filtered.map((c, i) => (
              <div key={c.id}
                onClick={() => router.push(`/superadmin/centres/${c.id}`)}
                className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}>
                <div className="h-1 bg-brand" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{c.nom}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">{TYPE_LABELS[c.type] ?? c.type}</span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/superadmin/centres/${c.id}`)}>
                            <Eye className="h-4 w-4 text-slate-400" /><span>Voir les détails</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/superadmin/centres/${c.id}/modifier`)}>
                            <Pencil className="h-4 w-4 text-slate-400" /><span>Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleActif(c.id, c.estActif)} disabled={toggling === c.id}
                            className={c.estActif ? 'text-orange-500 focus:text-orange-600' : 'text-brand focus:text-brand'}>
                            {toggling === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                            <span>{c.estActif ? 'Désactiver' : 'Activer'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(c)} className="text-red-500 focus:text-red-600">
                            <Trash2 className="h-4 w-4" /><span>Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-0.5">
                      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 flex-shrink-0" />{c.region}, {c.prefecture}</p>
                      {c.admin && <p>Admin : <span className="font-medium text-slate-700 dark:text-zinc-300">{c.admin.nom} {c.admin.prenoms}</span></p>}
                      <p className="flex items-center gap-1.5"><Users className="h-3 w-3 flex-shrink-0" /><span className="font-medium text-slate-700 dark:text-zinc-300">{c._count?.utilisateurs ?? 0}</span> personnel(s)</p>
                    </div>
                    <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${c.estActif ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                      {c.estActif ? <><CheckCircle2 className="h-2.5 w-2.5" />Actif</> : <><XCircle className="h-2.5 w-2.5" />Inactif</>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Dialog supprimer ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader title="Supprimer le centre ?" description={`Vous êtes sur le point de supprimer ${deleteTarget?.nom}. Cette action est irréversible.`} icon={Trash2} danger />
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
