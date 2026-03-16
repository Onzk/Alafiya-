'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Specialite {
  _id: string
  nom: string
  code: string
  description?: string
  estActive: boolean
}

export default function SpecialitesPage() {
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nom: '', code: '', description: '' })

  useEffect(() => {
    fetch('/api/specialites').then((r) => r.json()).then((d) => {
      setSpecialites(d.specialites)
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
    if (res.ok) {
      setSpecialites((prev) => [...prev, data.specialite])
      setDialogOpen(false)
      setForm({ nom: '', code: '', description: '' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Spécialités médicales</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nouvelle spécialité</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une spécialité</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Ex: MED_GEN" required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialites.map((sp) => (
            <Card key={sp._id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{sp.nom}</p>
                  <p className="text-xs text-gray-400 font-mono">{sp.code}</p>
                </div>
                <Badge variant={sp.estActive ? 'default' : 'outline'} className="text-xs">
                  {sp.estActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
