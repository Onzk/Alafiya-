'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Stethoscope, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Specialite {
  _id: string
  nom: string
  code: string
  description?: string
  estActive: boolean
}

const inputCls = 'h-12 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

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
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Spécialités médicales</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{specialites.length} spécialité(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
              <Plus className="h-4 w-4" />Nouvelle spécialité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader title="Créer une spécialité" description="Enregistrez une spécialité médicale pour organiser les services de santé." icon={Plus} />
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className={labelCls}>Nom *</Label>
                <Input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Ex: Cardiologie" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Code *</Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Ex: MED_GEN" required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Description</Label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle" className={inputCls} />
              </div>
              <Button type="submit" className="w-full h-12 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="dash-in delay-75 flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialites.map((sp, i) => (
            <div
              key={sp._id}
              className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow`}
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{sp.nom}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{sp.code}</p>
              </div>
              <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                sp.estActive
                  ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                  : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
              }`}>
                {sp.estActive ? <><CheckCircle2 className="h-2.5 w-2.5" /> Active</> : <><XCircle className="h-2.5 w-2.5" /> Inactive</>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
