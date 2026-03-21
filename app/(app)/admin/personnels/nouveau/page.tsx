'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Role { id: string; nom: string }
interface Specialite { id: string; nom: string; code: string }

type CreateForm = {
  nom: string; prenoms: string; email: string; motDePasse: string;
  telephone: string; roleId: string; specialites: string[]
}

const EMPTY_FORM: CreateForm = {
  nom: '', prenoms: '', email: '', motDePasse: '', telephone: '', roleId: '', specialites: [],
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

export default function NouveauPersonnelPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [spSearch, setSpSearch] = useState('')

  useEffect(() => {
    fetch('/api/roles')
      .then((r) => r.json())
      .then((d) => setRoles(d.roles || []))
      .catch(() => {})

    fetch('/api/specialites')
      .then((r) => r.json())
      .then((d) => setSpecialites(d.specialites || []))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { nom, prenoms, email, motDePasse } = form
    if (!nom.trim() || !prenoms.trim() || !email.trim() || !motDePasse.trim()) {
      toast({ description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    if (motDePasse.length < 8) {
      toast({ description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' })
      return
    }
    if (!form.roleId) {
      toast({ description: 'Veuillez sélectionner un rôle', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/utilisateurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, niveauAcces: 'PERSONNEL' }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: 'Personnel créé avec succès' })
    router.push('/admin/personnels')
  }

  const roleOptions = roles.map((r) => ({ id: r.id, label: r.nom }))
  const filteredSp = specialites.filter((sp) => sp.nom.toLowerCase().includes(spSearch.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="dash-in delay-0">
        <Link
          href="/admin/personnels"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au personnel
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Nouveau personnel médical</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Créez un compte de personnel médical</p>
          </div>
        </div>
      </div>

      <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Identité */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Identité</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'nom',        label: 'Nom',          placeholder: 'Nom' },
                { key: 'prenoms',    label: 'Prénoms',      placeholder: 'Prénoms' },
                { key: 'email',      label: 'Email',        placeholder: 'personnel@centre.tg', type: 'email' },
                { key: 'motDePasse', label: 'Mot de passe', placeholder: 'Min. 8 caractères', type: 'password' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className={labelCls}>{label} *</Label>
                  <Input
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className={labelCls}>Téléphone</Label>
                <Input
                  placeholder="+228 XX XX XX XX"
                  value={form.telephone}
                  onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Profil */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Profil</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelCls}>Rôle *</Label>
                <SearchableSelect
                  options={roleOptions}
                  value={form.roleId}
                  onChange={(v) => setForm((p) => ({ ...p, roleId: v }))}
                  placeholder="Sélectionner un rôle..."
                  emptyText="Aucun rôle disponible"
                />
              </div>
            </div>

            {specialites.length > 0 && (
              <div className="space-y-2">
                <Label className={labelCls}>Spécialités</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={spSearch}
                    onChange={(e) => setSpSearch(e.target.value)}
                    placeholder="Filtrer les spécialités..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand/30"
                  />
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto py-1">
                  {filteredSp.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setForm((p) => ({
                        ...p,
                        specialites: p.specialites.includes(sp.id)
                          ? p.specialites.filter((s) => s !== sp.id)
                          : [...p.specialites, sp.id],
                      }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        form.specialites.includes(sp.id)
                          ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-brand/40'
                      }`}
                    >
                      {sp.nom}
                    </button>
                  ))}
                  {filteredSp.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune spécialité trouvée</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-min h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20"
          >
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer le compte'}
          </Button>
        </form>
      </div>
    </div>
  )
}
