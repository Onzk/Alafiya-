'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, UserCheck, UserX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Personnel {
  id: string
  nom: string
  prenoms: string
  email: string
  telephone?: string
  estActif: boolean
  specialites?: { specialite: { nom: string } }[]
}

interface Specialite {
  id: string
  nom: string
  code: string
}

const inputCls = 'h-12 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

export default function PersonnelsPage() {
  const { toast } = useToast()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

    const res = await fetch('/api/utilisateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }

    setPersonnel((prev) => [data.utilisateur, ...prev])
    setDialogOpen(false)
  }

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Personnel médical</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{personnel.length} membre(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
              <Plus className="h-4 w-4" />Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader title="Nouveau compte personnel" description="Créez un compte de gestion système avec les permissions appropriées." icon={Plus} />
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'nom',        label: 'Nom',          placeholder: 'Nom' },
                  { key: 'prenoms',    label: 'Prénoms',      placeholder: 'Prénoms' },
                  { key: 'email',      label: 'Email',        placeholder: 'personnel@centre.tg', type: 'email' },
                  { key: 'motDePasse', label: 'Mot de passe', placeholder: 'Min. 8 caractères', type: 'password' },
                  { key: 'telephone',  label: 'Téléphone',    placeholder: '+228 XX XX XX XX', required: false },
                ].map(({ key, label, type, placeholder, required }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                    <Input
                      type={type || 'text'}
                      placeholder={placeholder}
                      value={(form as Record<string, unknown>)[key] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      required={required !== false}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              {specialites.length > 0 && (
                <div className="space-y-2">
                  <Label className={labelCls}>Spécialités assignées</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialites.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => toggleSpecialite(sp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          form.specialites.includes(sp.id)
                            ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-brand/40'
                        }`}
                      >
                        {sp.nom}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full h-12 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer le compte
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="dash-in delay-75 flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : personnel.length === 0 ? (
        <div className="dash-in delay-75 py-14 text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 dark:border dark:border-zinc-700/60 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Aucun personnel enregistré</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Commencez par ajouter un membre</p>
        </div>
      ) : (
        <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Nom</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Email</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Statut</span>
          </div>
          <ul>
            {personnel.map((p, i) => (
              <li key={p.id} className={`dash-in delay-${[0,75,100,150,200,225,300][Math.min(i,6)]} flex sm:grid sm:grid-cols-[1fr_1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand font-bold text-xs">{p.nom[0]}{p.prenoms[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.nom} {p.prenoms}</p>
                    {p.specialites && p.specialites.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {p.specialites.map((sp) => (
                          <span key={sp.specialite.nom} className="text-[10px] bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                            {sp.specialite.nom}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block truncate">{p.email}</p>
                <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                  p.estActif
                    ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                }`}>
                  {p.estActif ? <><UserCheck className="h-3 w-3" /> Actif</> : <><UserX className="h-3 w-3" /> Inactif</>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
