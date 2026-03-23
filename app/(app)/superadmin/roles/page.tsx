'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Loader2, ShieldCheck, Search, X,
  MoreHorizontal, Pencil, Trash2, Eye, Users,
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

interface Permission {
  id: string
  code: string
  description: string
}

interface Role {
  id: string
  nom: string
  description?: string
  creePar: 'SUPERADMIN' | 'CENTRE'
  centreId?: string | null
  permissions: { permission: { code: string; description: string } }[]
  _count?: { utilisateurs: number }
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

type EditForm = { nom: string; description: string; permissions: string[] }

export default function MinistereRolesPage() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nom: '', description: '', permissions: [] as string[] })

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Role | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ nom: '', description: '', permissions: [] })
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState(false)

  // View dialog
  const [viewTarget, setViewTarget] = useState<Role | null>(null)

  // Filters
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/roles').then((r) => r.json()),
      fetch('/api/permissions').then((r) => r.json()),
    ]).then(([rolesData, permsData]) => {
      setRoles(rolesData.roles || [])
      setPermissions(permsData.permissions || [])
      setLoading(false)
    })
  }, [])

  function togglePermission(id: string, target: 'create' | 'edit') {
    if (target === 'create') {
      setForm((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(id)
          ? prev.permissions.filter((p) => p !== id)
          : [...prev.permissions, id],
      }))
    } else {
      setEditForm((prev) => ({
        ...prev,
        permissions: prev.permissions.includes(id)
          ? prev.permissions.filter((p) => p !== id)
          : [...prev.permissions, id],
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setRoles((prev) => [data.role, ...prev])
    setDialogOpen(false)
    setForm({ nom: '', description: '', permissions: [] })
    toast({ description: 'Rôle créé avec succès' })
  }

  function openEdit(role: Role) {
    setEditTarget(role)
    setEditForm({
      nom: role.nom,
      description: role.description || '',
      permissions: role.permissions.map((rp) => {
        const found = permissions.find((p) => p.code === rp.permission.code)
        return found?.id || ''
      }).filter(Boolean),
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditSubmitting(true)
    const res = await fetch(`/api/roles/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    setEditSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setRoles((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, ...data.role } : r))
    setEditTarget(null)
    toast({ description: 'Rôle modifié avec succès' })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/roles/${deleteTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id))
    setDeleteTarget(null)
    toast({ description: 'Rôle supprimé' })
  }

  const filtered = useMemo(() => {
    if (search === '') return roles
    return roles.filter((r) =>
      `${r.nom} ${r.description || ''}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [roles, search])

  const rolesGlobaux = filtered.filter((r) => r.creePar === 'SUPERADMIN')
  const rolesCentres = filtered.filter((r) => r.creePar === 'CENTRE')

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Types de personnel</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{roles.length} type(s) de personnel médical dans le système</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20 flex-shrink-0">
              <Plus className="h-4 w-4" />Nouveau type de personnel médical
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader title="Créer un type de personnel médical" description="Définissez les permissions et responsabilités pour améliorer la gestion des accès." icon={Plus} />
            <DialogScrollableWrapper>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Nom du type de personnel médical *</Label>
                  <Input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Ex: Médecin spécialiste" required className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle" className={inputCls} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={labelCls}>Permissions</Label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setForm((p) => ({ ...p, permissions: permissions.map((p) => p.id) }))}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold">Tout sélectionner</button>
                      <span className="text-slate-300 dark:text-zinc-600">|</span>
                      <button type="button" onClick={() => setForm((p) => ({ ...p, permissions: [] }))}
                        className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 font-semibold">Effacer</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {permissions.map((perm) => (
                      <label key={perm.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                        <input type="checkbox" checked={form.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id, 'create')} className="mt-0.5 accent-emerald-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{perm.description}</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{perm.code}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le type de personnel médical'}
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
          <Input placeholder="Rechercher un type de personnel médical..." value={search} onChange={(e) => setSearch(e.target.value)}
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
      ) : (
        <>
          {/* ── TABLE desktop ── */}
          <div className="dash-in delay-75 hidden lg:block bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[2fr_100px_70px_1fr_44px] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              {['Rôle', 'Origine', 'Personnel', 'Permissions', ''].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
              ))}
            </div>
            <ul>
              {filtered.map((role, i) => (
                <li key={role.id} onClick={() => setViewTarget(role)} className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} grid grid-cols-[2fr_100px_70px_1fr_44px] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer`}>
                  {/* Rôle */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${role.creePar === 'CENTRE' ? 'bg-orange-50 dark:bg-orange-400/15' : 'bg-brand/10 dark:bg-brand/15'}`}>
                      <ShieldCheck className={`h-4 w-4 ${role.creePar === 'CENTRE' ? 'text-orange-600 dark:text-orange-400' : 'text-brand'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{role.nom}</p>
                      {role.description && <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{role.description}</p>}
                    </div>
                  </div>
                  {/* Origine */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg w-fit ${role.creePar === 'CENTRE' ? 'bg-orange-50 dark:bg-orange-400/15 text-orange-600 dark:text-orange-400' : 'bg-brand/8 dark:bg-brand/12 text-brand'}`}>
                    {role.creePar === 'SUPERADMIN' ? 'Ministère' : 'Centre'}
                  </span>
                  {/* Personnel */}
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    <Users className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    {role._count?.utilisateurs ?? 0}
                  </div>
                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {role.permissions.slice(0, 3).map((rp) => (
                      <span key={rp.permission.code} className="text-[10px] bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">{rp.permission.code}</span>
                    ))}
                    {role.permissions.length > 3 && <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">+{role.permissions.length - 3}</span>}
                    {role.permissions.length === 0 && <span className="text-xs text-slate-300 dark:text-zinc-600">Aucune</span>}
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
                        <DropdownMenuItem onClick={() => setViewTarget(role)}>
                          <Eye className="h-4 w-4 text-slate-400" /><span>Voir les détails</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(role)}>
                          <Pencil className="h-4 w-4 text-slate-400" /><span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget(role)} className="text-red-500 focus:text-red-600">
                          <Trash2 className="h-4 w-4" /><span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/20">
              <p className="text-xs text-slate-400 dark:text-zinc-500">{filtered.length} type de personnel médical(s) affiché(s) sur {roles.length} au total</p>
            </div>
          </div>

          {/* ── CARDS mobile ── */}
          <div className="lg:hidden space-y-5">
            <div className="dash-in delay-75 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Rôles créés par le Ministère ({rolesGlobaux.length})
              </p>
              {rolesGlobaux.length === 0 ? (
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-8 text-center">
                  <p className="text-sm text-slate-400 dark:text-zinc-500">Aucun type de personnel médical défini.</p>
                </div>
              ) : (
                rolesGlobaux.map((role, i) => (
                  <RoleCard key={role.id} role={role} delay={i * 75}
                    onView={() => setViewTarget(role)} onEdit={() => openEdit(role)} onDelete={() => setDeleteTarget(role)} />
                ))
              )}
            </div>

            {rolesCentres.length > 0 && (
              <div className="dash-in delay-150 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Rôles créés par les centres ({rolesCentres.length})
                </p>
                {rolesCentres.map((role, i) => (
                  <RoleCard key={role.id} role={role} fromCentre delay={i * 75}
                    onView={() => setViewTarget(role)} onEdit={() => openEdit(role)} onDelete={() => setDeleteTarget(role)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Dialog voir ── */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => { if (!o) setViewTarget(null) }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {viewTarget && (
            <>
              {/* Header coloré */}
              <div className={`px-6 pt-6 pb-5 ${viewTarget.creePar === 'CENTRE' ? 'bg-orange-50 dark:bg-orange-400/10' : 'bg-brand/8 dark:bg-brand/12'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${viewTarget.creePar === 'CENTRE' ? 'bg-orange-100 dark:bg-orange-400/20' : 'bg-brand/15 dark:bg-brand/20'}`}>
                      <ShieldCheck className={`h-5 w-5 ${viewTarget.creePar === 'CENTRE' ? 'text-orange-600 dark:text-orange-400' : 'text-brand'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight truncate">{viewTarget.nom}</p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1 ${viewTarget.creePar === 'CENTRE' ? 'bg-orange-100 dark:bg-orange-400/20 text-orange-600 dark:text-orange-400' : 'bg-brand/15 dark:bg-brand/20 text-brand'}`}>
                        {viewTarget.creePar === 'SUPERADMIN' ? 'Ministère' : 'Centre'}
                      </span>
                    </div>
                  </div>
                </div>
                {viewTarget.description && (
                  <p className="text-sm text-slate-600 dark:text-zinc-300 mt-3 leading-relaxed">{viewTarget.description}</p>
                )}
              </div>

              <DialogScrollableWrapper>
                <div className="space-y-5">

                  {/* Stat personnel */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-emerald-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">{viewTarget._count?.utilisateurs ?? 0}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">personnel(s) assigné(s) à ce type</p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Permissions
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${viewTarget.permissions.length > 0 ? 'bg-brand/10 dark:bg-brand/15 text-brand' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}>
                        {viewTarget.permissions.length}
                      </span>
                    </div>
                    {viewTarget.permissions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                        <ShieldCheck className="h-6 w-6 text-slate-300 dark:text-zinc-600 mb-2" />
                        <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune permission assignée</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {viewTarget.permissions.map((rp) => (
                          <div key={rp.permission.code} className="flex items-center gap-3 px-3 py-3 bg-slate-50 dark:bg-transparent rounded-xl border border-slate-100 dark:border-zinc-900">
                            <div className="h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0" />
                            <p className="text-sm text-slate-700 dark:text-zinc-300 flex-1">{rp.permission.description}</p>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 flex-shrink-0">{rp.permission.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl border-slate-200 dark:border-zinc-700" onClick={() => setViewTarget(null)}>Fermer</Button>
                    <Button className="flex-1 h-10 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20" onClick={() => { openEdit(viewTarget); setViewTarget(null) }}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />Modifier
                    </Button>
                  </div>
                </div>
              </DialogScrollableWrapper>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog modifier ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader title="Modifier le type de personnel médical" description="Mettez à jour les informations et permissions du type de personnel médical." icon={Pencil} />
          <DialogScrollableWrapper>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Nom du type de personnel médical *</Label>
                <Input value={editForm.nom} onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom du type de personnel médical" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Description</Label>
                <Input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle" className={inputCls} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className={labelCls}>Permissions</Label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditForm((p) => ({ ...p, permissions: permissions.map((pm) => pm.id) }))}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold">Tout sélectionner</button>
                    <span className="text-slate-300 dark:text-zinc-600">|</span>
                    <button type="button" onClick={() => setEditForm((p) => ({ ...p, permissions: [] }))}
                      className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 font-semibold">Effacer</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {permissions.map((perm) => (
                    <label key={perm.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                      <input type="checkbox" checked={editForm.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id, 'edit')} className="mt-0.5 accent-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{perm.description}</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{perm.code}</p>
                      </div>
                    </label>
                  ))}
                </div>
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
          <DialogHeader title="Supprimer le type de personnel médical ?" description={`Vous êtes sur le point de supprimer le type de personnel médical "${deleteTarget?.nom}". Cette action est irréversible.`} icon={Trash2} danger />
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

function RoleCard({
  role, fromCentre, delay = 0, onView, onEdit, onDelete,
}: {
  role: Role; fromCentre?: boolean; delay?: number
  onView: () => void; onEdit: () => void; onDelete: () => void
}) {
  return (
    <div className="dash-in" style={{ animationDelay: `${delay}ms` }}>
      <div onClick={onView} className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 hover:shadow-sm transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${fromCentre ? 'bg-orange-50 dark:bg-orange-400/15' : 'bg-brand/10 dark:bg-brand/15'}`}>
              <ShieldCheck className={`h-5 w-5 ${fromCentre ? 'text-orange-600 dark:text-orange-400' : 'text-brand'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-900 dark:text-white">{role.nom}</p>
                {fromCentre && (
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-400/30 text-orange-600 dark:text-orange-400">Centre</span>
                )}
              </div>
              {role.description && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{role.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap">{(role.permissions ?? []).length} permission(s)</span>
              <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap"><Users className="h-3 w-3" />{role._count?.utilisateurs ?? 0} personnel</span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 text-slate-400" /><span>Voir les détails</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 text-slate-400" /><span>Modifier</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-600">
                    <Trash2 className="h-4 w-4" /><span>Supprimer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        {(role.permissions ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(role.permissions ?? []).map((rp) => (
              <span key={rp.permission.code} className="text-xs bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded font-mono">
                {rp.permission.code}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
