'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Centre {
  id: string
  nom: string
  type: string
  region: string
  prefecture: string
  estActif: boolean
  admin?: { nom: string; prenoms: string; email: string }
}

export default function CentresPage() {
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    nom: '', adresse: '', telephone: '', email: '', region: '', prefecture: '',
    type: 'HOPITAL' as const,
    adminNom: '', adminPrenoms: '', adminEmail: '', adminMotDePasse: '', adminTelephone: '',
  })

  useEffect(() => {
    fetch('/api/centres')
      .then((r) => r.json())
      .then((d) => { setCentres(d.centres); setLoading(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErreur('')

    const res = await fetch('/api/centres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setErreur(data.error || 'Erreur'); return }

    setCentres((prev) => [data.centre, ...prev])
    setDialogOpen(false)
  }

  async function toggleActif(id: string, actuel: boolean) {
    await fetch(`/api/centres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActif: !actuel }),
    })
    setCentres((prev) => prev.map((c) => c.id === id ? { ...c, estActif: !actuel } : c))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centres de santé</h1>
          <p className="text-gray-500 text-sm">{centres.length} centre(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nouveau centre</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un centre de santé</DialogTitle>
            </DialogHeader>
            {erreur && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{erreur}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'nom', label: 'Nom du centre' },
                  { key: 'adresse', label: 'Adresse' },
                  { key: 'telephone', label: 'Téléphone' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'region', label: 'Région' },
                  { key: 'prefecture', label: 'Préfecture' },
                ].map(({ key, label, type }) => (
                  <div key={key} className="space-y-1">
                    <Label>{label} *</Label>
                    <Input
                      type={type || 'text'}
                      value={(form as Record<string, string>)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      required
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof form.type }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['HOPITAL', 'CLINIQUE', 'CSU', 'CMS', 'AUTRE'].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-700 border-t pt-3">Compte administrateur du centre</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'adminNom', label: 'Nom' },
                  { key: 'adminPrenoms', label: 'Prénoms' },
                  { key: 'adminEmail', label: 'Email', type: 'email' },
                  { key: 'adminMotDePasse', label: 'Mot de passe', type: 'password' },
                  { key: 'adminTelephone', label: 'Téléphone', required: false },
                ].map(({ key, label, type, required }) => (
                  <div key={key} className="space-y-1">
                    <Label>{label}{required !== false && ' *'}</Label>
                    <Input
                      type={type || 'text'}
                      value={(form as Record<string, string>)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      required={required !== false}
                    />
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le centre'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {centres.map((centre) => (
            <Card key={centre.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-green-600" />
                    <CardTitle className="text-sm font-semibold">{centre.nom}</CardTitle>
                  </div>
                  <Badge variant={centre.estActif ? 'default' : 'outline'}>
                    {centre.estActif ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-500">
                <p>{centre.type} • {centre.region}, {centre.prefecture}</p>
                {centre.admin && (
                  <p>Admin : {centre.admin.nom} {centre.admin.prenoms}</p>
                )}
                <Button
                  size="sm"
                  variant={centre.estActif ? 'outline' : 'default'}
                  className="w-full mt-2"
                  onClick={() => toggleActif(centre.id, centre.estActif)}
                >
                  {centre.estActif ? 'Désactiver' : 'Activer'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
