'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Loader2, Stethoscope, CheckCircle2, XCircle, Search, X,
  MoreHorizontal, Pencil, Trash2, Power, Eye, Calendar, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogScrollableWrapper } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface Specialite {
  id: string
  nom: string
  code: string
  description?: string
  estActive: boolean
  createdAt?: string
  _count?: { userSpecialites: number }
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

type EditForm = { nom: string; code: string; description: string }

export default function SpecialitesPage() {
  const { toast } = useToast()
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nom: '', code: '', description: '' })

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Specialite | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ nom: '', code: '', description: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Specialite | null>(null)
  const [deleting, setDeleting] = useState(false)

  // View dialog
  const [viewTarget, setViewTarget] = useState<Specialite | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/specialites').then((r) => r.json()).then((d) => {
      setSpecialites(d.specialites || [])
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/specialites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setSpecialites((prev) => [...prev, data.specialite])
    setDialogOpen(false)
    setForm({ nom: '', code: '', description: '' })
    toast({ description: 'Spécialité créée avec succès' })
  }

  function openEdit(sp: Specialite) {
    setEditTarget(sp)
    setEditForm({ nom: sp.nom, code: sp.code, description: sp.description || '' })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditSubmitting(true)
    const res = await fetch(`/api/specialites/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    setEditSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setSpecialites((prev) => prev.map((s) => s.id === editTarget.id ? { ...s, ...data.specialite } : s))
    setEditTarget(null)
    toast({ description: 'Spécialité modifiée avec succès' })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/specialites/${deleteTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setSpecialites((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast({ description: 'Spécialité supprimée' })
  }

  async function toggleActive(id: string, actuel: boolean) {
    setToggling(id)
    const res = await fetch(`/api/specialites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActive: !actuel }),
    })
    setToggling(null)
    if (res.ok) {
      setSpecialites((prev) => prev.map((s) => s.id === id ? { ...s, estActive: !actuel } : s))
    }
  }

  const filtered = useMemo(() => {
    if (search === '') return specialites
    return specialites.filter((s) =>
      `${s.nom} ${s.code} ${s.description || ''}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [specialites, search])

  const actives = specialites.filter((s) => s.estActive).length

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Spécialités médicales</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {specialites.length} spécialité(s) · <span className="text-brand">{actives} active(s)</span>
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0">
              <Plus className="h-4 w-4" />Nouvelle spécialité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader title="Créer une spécialité" description="Enregistrez une spécialité médicale pour organiser les services de santé." icon={Plus} />
            <DialogScrollableWrapper>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Nom *</Label>
                    <Input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Ex: Cardiologie" required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Code *</Label>
                    <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Ex: CARDIO" required className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle" className={inputCls} />
                </div>
                <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer la spécialité'}
                </Button>
              </form>
            </DialogScrollableWrapper>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtre recherche */}
      <div className="dash-in delay-75 flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
          <Input placeholder="Rechercher une spécialité..." value={search} onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`} />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
            <X className="h-3.5 w-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      {loading ? (
        <div className="dash-in delay-75 flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <div className="dash-in delay-75 py-16 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Aucune spécialité trouvée</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Créez votre première spécialité médicale</p>
        </div>
      ) : (
        <>
          {/* ── TABLE desktop ── */}
          <div className="dash-in delay-100 hidden lg:block bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_80px_90px_44px] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              {['Spécialité', 'Code', 'Personnel', 'Statut', ''].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
              ))}
            </div>
            <ul>
              {filtered.map((sp, i) => (
                <li key={sp.id} onClick={() => setViewTarget(sp)} className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} grid grid-cols-[2fr_1fr_80px_90px_44px] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer`}>
                  {/* Spécialité */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{sp.nom}</p>
                      {sp.description && <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{sp.description}</p>}
                    </div>
                  </div>
                  {/* Code */}
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 font-mono w-fit">{sp.code}</span>
                  {/* Personnel */}
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    <Users className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    {sp._count?.userSpecialites ?? 0}
                  </div>
                  {/* Statut */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold w-fit ${sp.estActive ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                    {sp.estActive ? <><CheckCircle2 className="h-2.5 w-2.5" />Active</> : <><XCircle className="h-2.5 w-2.5" />Inactive</>}
                  </div>
                  {/* Dropdown */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setViewTarget(sp)}>
                          <Eye className="h-4 w-4 text-slate-400" /><span>Voir les détails</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(sp)}>
                          <Pencil className="h-4 w-4 text-slate-400" /><span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleActive(sp.id, sp.estActive)} disabled={toggling === sp.id}
                          className={sp.estActive ? 'text-orange-500 focus:text-orange-600' : 'text-brand focus:text-brand'}>
                          {toggling === sp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                          <span>{sp.estActive ? 'Désactiver' : 'Activer'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(sp)} className="text-red-500 focus:text-red-600">
                          <Trash2 className="h-4 w-4" /><span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/20">
              <p className="text-xs text-slate-400 dark:text-zinc-500">{filtered.length} spécialité(s) affichée(s) sur {specialites.length} au total</p>
            </div>
          </div>

          {/* ── CARDS mobile ── */}
          <div className="dash-in delay-100 lg:hidden grid sm:grid-cols-2 gap-4">
            {filtered.map((sp, i) => (
              <div key={sp.id} onClick={() => setViewTarget(sp)} className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}>
                <div className="h-1 bg-blue-500" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{sp.nom}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 font-mono">{sp.code}</span>
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
                          <DropdownMenuItem onClick={() => setViewTarget(sp)}>
                            <Eye className="h-4 w-4 text-slate-400" /><span>Voir les détails</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(sp)}>
                            <Pencil className="h-4 w-4 text-slate-400" /><span>Modifier</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleActive(sp.id, sp.estActive)} disabled={toggling === sp.id}
                            className={sp.estActive ? 'text-orange-500 focus:text-orange-600' : 'text-brand focus:text-brand'}>
                            {toggling === sp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                            <span>{sp.estActive ? 'Désactiver' : 'Activer'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(sp)} className="text-red-500 focus:text-red-600">
                            <Trash2 className="h-4 w-4" /><span>Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {sp.description && <p className="text-xs text-slate-500 dark:text-zinc-400">{sp.description}</p>}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold w-fit ${sp.estActive ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                      {sp.estActive ? <><CheckCircle2 className="h-2.5 w-2.5" />Active</> : <><XCircle className="h-2.5 w-2.5" />Inactive</>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                      <Users className="h-3 w-3" />{sp._count?.userSpecialites ?? 0} personnel
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Dialog voir ── */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => { if (!o) setViewTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader title="Détails de la spécialité" description="Informations complètes sur cette spécialité médicale." icon={Stethoscope} />
          {viewTarget && (
            <div className="space-y-4 px-5 md:px-7 pb-5 md:pb-6">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{viewTarget.nom}</p>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300">{viewTarget.code}</span>
                  </div>
                  {viewTarget.description && <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{viewTarget.description}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Statut</p>
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${viewTarget.estActive ? 'text-brand' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {viewTarget.estActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {viewTarget.estActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Personnel</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    <Users className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    {viewTarget._count?.userSpecialites ?? 0}
                  </div>
                </div>
                {viewTarget.createdAt && (
                  <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Créée le</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                      {new Date(viewTarget.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setViewTarget(null)}>Fermer</Button>
                <Button className="flex-1 h-10 bg-brand hover:bg-brand-dark text-white rounded-xl" onClick={() => { openEdit(viewTarget); setViewTarget(null) }}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog modifier ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader title="Modifier la spécialité" description="Mettez à jour les informations de la spécialité médicale." icon={Pencil} />
          <DialogScrollableWrapper>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Nom *</Label>
                  <Input value={editForm.nom} onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" required className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Code *</Label>
                  <Input value={editForm.code} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="CODE" required className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Description</Label>
                <Input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle" className={inputCls} />
              </div>
              <Button type="submit" disabled={editSubmitting} className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {editSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer les modifications'}
              </Button>
            </form>
          </DialogScrollableWrapper>
        </DialogContent>
      </Dialog>

      {/* ── Dialog supprimer ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader title="Supprimer la spécialité ?" description={`Vous êtes sur le point de supprimer "${deleteTarget?.nom}". Cette action est irréversible.`} icon={Trash2} danger />
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
