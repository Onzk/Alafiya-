'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Centre {
  id: string
  nom: string
  type: string
  region: string
  prefecture: string
  estActif: boolean
  admin?: { nom: string; prenoms: string; email: string }
}

const inputCls = 'h-12 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

export default function CentresPage() {
  const { toast } = useToast()
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

    const res = await fetch('/api/centres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }

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
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Centres de santé</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{centres.length} centre(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
              <Plus className="h-4 w-4" />Nouveau centre
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white font-extrabold">Créer un centre de santé</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'nom',        label: 'Nom du centre', placeholder: 'Ex: CHU de Lomé' },
                  { key: 'adresse',    label: 'Adresse',       placeholder: 'Ex: Rue des Fleurs, Lomé' },
                  { key: 'telephone',  label: 'Téléphone',     placeholder: '+228 XX XX XX XX' },
                  { key: 'email',      label: 'Email',         placeholder: 'centre@sante.tg', type: 'email' },
                  { key: 'region',     label: 'Région',        placeholder: 'Ex: Maritime' },
                  { key: 'prefecture', label: 'Préfecture',    placeholder: 'Ex: Golfe' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className={labelCls}>{label} *</Label>
                    <Input
                      type={type || 'text'}
                      placeholder={placeholder}
                      value={(form as Record<string, string>)[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      required
                      className={inputCls}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof form.type }))}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['HOPITAL', 'CLINIQUE', 'CSU', 'CMS', 'AUTRE'].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-3">Compte administrateur du centre</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { key: 'adminNom',        label: 'Nom',          placeholder: 'Nom' },
                    { key: 'adminPrenoms',    label: 'Prénoms',      placeholder: 'Prénoms' },
                    { key: 'adminEmail',      label: 'Email',        placeholder: 'admin@centre.tg', type: 'email' },
                    { key: 'adminMotDePasse', label: 'Mot de passe', placeholder: 'Min. 8 caractères', type: 'password' },
                    { key: 'adminTelephone',  label: 'Téléphone',    placeholder: '+228 XX XX XX XX', required: false },
                  ].map(({ key, label, type, placeholder, required }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                      <Input
                        type={type || 'text'}
                        placeholder={placeholder}
                        value={(form as Record<string, string>)[key]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        required={required !== false}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-12 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le centre'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="dash-in delay-75 flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {centres.map((centre, i) => (
            <div
              key={centre.id}
              className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow`}
            >
              <div className="h-1.5 bg-brand rounded-t-2xl" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-brand" />
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{centre.nom}</p>
                  </div>
                  <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                    centre.estActif
                      ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                      : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                  }`}>
                    {centre.estActif ? <><CheckCircle2 className="h-2.5 w-2.5" /> Actif</> : <><XCircle className="h-2.5 w-2.5" /> Inactif</>}
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-500 dark:text-zinc-400 mb-3">
                  <p>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-mono text-[9px] mr-1">{centre.type}</span>
                    {centre.region}, {centre.prefecture}
                  </p>
                  {centre.admin && (
                    <p>Admin : <span className="font-medium text-slate-600 dark:text-zinc-300">{centre.admin.nom} {centre.admin.prenoms}</span></p>
                  )}
                </div>
                <Button
                  variant={centre.estActif ? 'outline' : 'default'}
                  className={`w-full h-12 rounded-xl text-sm font-semibold ${centre.estActif ? 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300' : 'bg-brand hover:bg-brand-dark text-white shadow-sm shadow-brand/20'}`}
                  onClick={() => toggleActif(centre.id, centre.estActif)}
                >
                  {centre.estActif ? 'Désactiver' : 'Activer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
