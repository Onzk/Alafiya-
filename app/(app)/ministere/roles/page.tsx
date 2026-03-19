'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Permission {
  id: string
  code: string
  description: string
}

interface Role {
  id: string
  nom: string
  description?: string
  creePar: 'MINISTERE' | 'CENTRE'
  centreId?: string | null
  permissions: { permission: { code: string; description: string } }[]
}

const inputCls = 'h-12 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

export default function MinistereRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({ nom: '', description: '', permissions: [] as string[] })

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

  function togglePermission(id: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id],
    }))
  }

  function selectAll() {
    setForm((prev) => ({ ...prev, permissions: permissions.map((p) => p.id) }))
  }

  function clearAll() {
    setForm((prev) => ({ ...prev, permissions: [] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErreur('')

    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setErreur(data.error || 'Erreur'); return }

    setRoles((prev) => [data.role, ...prev])
    setDialogOpen(false)
    setForm({ nom: '', description: '', permissions: [] })
  }

  const rolesGlobaux = roles.filter((r) => r.creePar === 'MINISTERE')
  const rolesCentres = roles.filter((r) => r.creePar === 'CENTRE')

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Rôles globaux</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{roles.length} rôle(s) dans le système</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
              <Plus className="h-4 w-4" />Nouveau rôle global
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader title="Créer un rôle global" description="Définissez les permissions et responsabilités pour améliorer la gestion des accès." icon={Plus} />
            {erreur && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                {erreur}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className={labelCls}>Nom du rôle *</Label>
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
                    <button type="button" onClick={selectAll} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold">Tout sélectionner</button>
                    <span className="text-slate-300 dark:text-zinc-600">|</span>
                    <button type="button" onClick={clearAll} className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 font-semibold">Effacer</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-0.5 accent-emerald-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{perm.description}</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{perm.code}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-12 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer le rôle global
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="dash-in delay-75 flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <div className="space-y-5">
          <div className="dash-in delay-75 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Rôles créés par le Ministère ({rolesGlobaux.length})
            </p>
            {rolesGlobaux.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-8 text-center">
                <p className="text-sm text-slate-400 dark:text-zinc-500">Aucun rôle global défini.</p>
              </div>
            ) : (
              rolesGlobaux.map((role, i) => <RoleCard key={role.id} role={role} delay={i * 75} />)
            )}
          </div>

          {rolesCentres.length > 0 && (
            <div className="dash-in delay-150 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Rôles créés par les centres ({rolesCentres.length})
              </p>
              {rolesCentres.map((role, i) => <RoleCard key={role.id} role={role} fromCentre delay={i * 75} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoleCard({ role, fromCentre, delay = 0 }: { role: Role; fromCentre?: boolean; delay?: number }) {
  return (
    <div className="dash-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 hover:shadow-sm transition-shadow">
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
              {role.description && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{role.description}</p>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap">
            {(role.permissions ?? []).length} permission(s)
          </span>
        </div>
        {(role.permissions ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(role.permissions ?? []).map((rp) => (
              <span key={rp.permission.code} className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded font-mono">
                {rp.permission.code}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
