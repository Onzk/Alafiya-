'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default function MinistereRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    nom: '',
    description: '',
    permissions: [] as string[],
  })

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rôles globaux</h1>
          <p className="text-gray-500 text-sm">{roles.length} rôle(s) dans le système</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nouveau rôle global</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Créer un rôle global</DialogTitle></DialogHeader>
            {erreur && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{erreur}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du rôle *</Label>
                <Input
                  value={form.nom}
                  onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex: Médecin spécialiste"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description optionnelle"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAll} className="text-xs text-green-600 hover:underline">Tout sélectionner</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={clearAll} className="text-xs text-gray-400 hover:underline">Effacer</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-3 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{perm.description}</p>
                        <p className="text-xs text-gray-400 font-mono">{perm.code}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer le rôle global
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Rôles créés par le Ministère ({rolesGlobaux.length})
            </h2>
            {rolesGlobaux.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-400 text-sm">
                  Aucun rôle global défini.
                </CardContent>
              </Card>
            ) : (
              rolesGlobaux.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))
            )}
          </div>

          {rolesCentres.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Rôles créés par les centres ({rolesCentres.length})
              </h2>
              {rolesCentres.map((role) => (
                <RoleCard key={role.id} role={role} fromCentre />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoleCard({ role, fromCentre }: { role: Role; fromCentre?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${fromCentre ? 'bg-orange-50' : 'bg-green-50'}`}>
              <ShieldCheck className={`h-5 w-5 ${fromCentre ? 'text-orange-600' : 'text-green-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900">{role.nom}</p>
                {fromCentre && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">Centre</Badge>
                )}
              </div>
              {role.description && (
                <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {(role.permissions ?? []).length} permission(s)
          </span>
        </div>
        {(role.permissions ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(role.permissions ?? []).map((rp) => (
              <span
                key={rp.permission.code}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono"
              >
                {rp.permission.code}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
