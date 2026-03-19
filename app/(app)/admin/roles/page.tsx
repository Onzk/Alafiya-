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
  permissions: { permission: { code: string; description: string } }[]
}

export default function AdminRolesPage() {
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

  const rolesLocaux = roles.filter((r) => r.creePar === 'CENTRE')
  const rolesGlobaux = roles.filter((r) => r.creePar === 'MINISTERE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rôles et permissions</h1>
          <p className="text-gray-500 text-sm">{roles.length} rôle(s) disponibles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nouveau rôle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Créer un rôle</DialogTitle></DialogHeader>
            {erreur && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{erreur}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du rôle *</Label>
                <Input
                  value={form.nom}
                  onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex: Médecin généraliste"
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
                <Label>Permissions assignées</Label>
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
                Créer le rôle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
      ) : (
        <div className="space-y-6">
          {rolesLocaux.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Rôles de ce centre</h2>
              {rolesLocaux.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          )}

          {rolesGlobaux.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Rôles globaux (Ministère)</h2>
              {rolesGlobaux.map((role) => (
                <RoleCard key={role.id} role={role} readonly />
              ))}
            </div>
          )}

          {roles.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-400">
                Aucun rôle disponible. Créez le premier rôle pour votre centre.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function RoleCard({ role, readonly }: { role: Role; readonly?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900">{role.nom}</p>
                {readonly && (
                  <Badge variant="outline" className="text-xs">Global</Badge>
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
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono"
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
