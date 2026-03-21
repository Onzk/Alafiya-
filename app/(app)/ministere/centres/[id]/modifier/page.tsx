'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, ArrowLeft, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', CSU: 'CSU', CMS: 'CMS', AUTRE: 'Autre',
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

type EditForm = { nom: string; adresse: string; telephone: string; email: string; region: string; prefecture: string; type: string }

export default function ModifierCentrePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [centreName, setCentreName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<EditForm>({
    nom: '', adresse: '', telephone: '', email: '', region: '', prefecture: '', type: 'HOPITAL',
  })

  useEffect(() => {
    fetch(`/api/centres/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const c = d.centre
        if (c) {
          setCentreName(c.nom)
          setForm({ nom: c.nom, adresse: c.adresse, telephone: c.telephone, email: c.email, region: c.region, prefecture: c.prefecture, type: c.type })
        }
        setLoading(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch(`/api/centres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: 'Centre modifié avec succès' })
    router.push('/ministere/centres')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="dash-in delay-0">
        <Link
          href="/ministere/centres"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux centres
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Modifier le centre</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{centreName}</p>
          </div>
        </div>
      </div>

      <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'nom',        label: 'Nom du centre', placeholder: 'Nom du centre' },
              { key: 'adresse',    label: 'Adresse',       placeholder: 'Adresse' },
              { key: 'telephone',  label: 'Téléphone',     placeholder: '+228 XX XX XX XX' },
              { key: 'email',      label: 'Email',         placeholder: 'email@centre.tg', type: 'email' },
              { key: 'region',     label: 'Région',        placeholder: 'Région' },
              { key: 'prefecture', label: 'Préfecture',    placeholder: 'Préfecture' },
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
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20"
          >
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer'}
          </Button>
        </form>
      </div>
    </div>
  )
}
