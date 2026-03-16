'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Personnel {
  _id: string
  nom: string
  prenoms: string
  email: string
  telephone?: string
  estActif: boolean
  specialites?: { nom: string }[]
}

interface Specialite {
  _id: string
  nom: string
  code: string
}

export default function PersonnelsPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    nom: '', prenoms: '', email: '', motDePasse: '', telephone: '',
    niveauAcces: 'PERSONNEL' as const,
    specialites: [] as string[],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/utilisateurs').then((r) => r.json()),
      fetch('/api/specialites').then((r) => r.json()),
    ]).then(([users, sps]) => {
      setPersonnel(users.utilisateurs || [])
      setSpecialites(sps.specialites || [])
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
    setErreur('')

    const res = await fetch('/api/utilisateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setErreur(data.error || 'Erreur'); return }

    setPersonnel((prev) => [data.utilisateur, ...prev])
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel médical</h1>
          <p className="text-gray-500 text-sm">{personnel.length} membre(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouveau compte personnel</DialogTitle></DialogHeader>
            {erreur && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{erreur}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'nom', label: 'Nom' },
                  { key: 'prenoms', label: 'Prénoms' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'motDePasse', label: 'Mot de passe', type: 'password' },
                  { key: 'telephone', label: 'Téléphone', required: false },
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

              <div className="space-y-2">
                <Label>Spécialités assignées</Label>
                <div className="flex flex-wrap gap-2">
                  {specialites.map((sp) => (
                    <button
                      key={sp._id}
                      type="button"
                      onClick={() => toggleSpecialite(sp._id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.specialites.includes(sp._id)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:border-green-400'
                      }`}
                    >
                      {sp.nom}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer le compte
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
      ) : (
        <div className="space-y-3">
          {personnel.map((p) => (
            <Card key={p._id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 text-sm font-semibold">{p.nom[0]}{p.prenoms[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.nom} {p.prenoms}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                    {p.specialites && p.specialites.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {p.specialites.map((sp: { nom: string }) => (
                          <span key={sp.nom} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            {sp.nom}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={p.estActif ? 'default' : 'outline'}>
                  {p.estActif ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                  {p.estActif ? 'Actif' : 'Inactif'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
