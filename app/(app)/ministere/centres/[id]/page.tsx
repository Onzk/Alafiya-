'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Building2, Loader2, ArrowLeft, Phone, Mail, MapPin, Users, UserCheck,
  ClipboardList, AlertTriangle, Pencil, CheckCircle2, XCircle, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface CentreDetail {
  id: string
  nom: string
  type: string
  adresse: string
  telephone: string
  email: string
  region: string
  prefecture: string
  estActif: boolean
  createdAt: string
  admin?: { nom: string; prenoms: string; email: string; telephone?: string }
  _count: { utilisateurs: number; patients: number; enregistrements: number; accesUrgences: number }
  utilisateurs: { user: { nom: string; prenoms: string; email: string; estActif: boolean; niveauAcces: string } }[]
  patients: { id: string; nom: string; prenoms: string; createdAt: string }[]
}

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', CSU: 'CSU', CMS: 'CMS', AUTRE: 'Autre',
}

const NIVEAU_LABELS: Record<string, string> = {
  MINISTERE: 'Ministère', ADMIN_CENTRE: 'Admin centre', PERSONNEL: 'Personnel médical',
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function CentreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [centre, setCentre] = useState<CentreDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nom: '', adresse: '', telephone: '', email: '', region: '', prefecture: '', type: 'HOPITAL' })
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/centres/${id}`)
      .then((r) => r.json())
      .then((d) => { setCentre(d.centre); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  function openEdit() {
    if (!centre) return
    setEditForm({ nom: centre.nom, adresse: centre.adresse, telephone: centre.telephone, email: centre.email, region: centre.region, prefecture: centre.prefecture, type: centre.type })
    setEditOpen(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditSubmitting(true)
    const res = await fetch(`/api/centres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    setEditSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setCentre((prev) => prev ? { ...prev, ...data.centre } : prev)
    setEditOpen(false)
    toast({ description: 'Centre modifié avec succès' })
  }

  async function toggleActif() {
    if (!centre) return
    setToggling(true)
    const res = await fetch(`/api/centres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActif: !centre.estActif }),
    })
    setToggling(false)
    if (res.ok) setCentre((prev) => prev ? { ...prev, estActif: !prev.estActif } : prev)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-brand" />
      </div>
    )
  }

  if (!centre) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-2">Centre introuvable</p>
        <Link href="/ministere/centres">
          <Button variant="outline" className="h-10 rounded-xl">Retour</Button>
        </Link>
      </div>
    )
  }

  const dateCreation = new Date(centre.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-[1200px]">

      {/* Retour + en-tête */}
      <div className="dash-in delay-0">
        <Link href="/ministere/centres" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Centres de santé
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{centre.nom}</h1>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">{TYPE_LABELS[centre.type] ?? centre.type}</span>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${centre.estActif ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                  {centre.estActif ? <><CheckCircle2 className="h-3 w-3" />Actif</> : <><XCircle className="h-3 w-3" />Inactif</>}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Enregistré le {dateCreation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={toggleActif} disabled={toggling} variant="outline"
              className={`h-10 rounded-xl text-sm font-semibold border-slate-200 dark:border-zinc-700 ${centre.estActif ? 'hover:border-red-300 hover:text-red-500 dark:hover:border-red-800 dark:hover:text-red-400' : 'hover:border-brand/40 hover:text-brand'}`}>
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : centre.estActif ? 'Désactiver' : 'Activer'}
            </Button>
            <Button onClick={openEdit} className="h-10 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
              <Pencil className="h-4 w-4" />Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-in delay-75 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Personnel médical"  value={centre._count.utilisateurs}   color="bg-blue-50 dark:bg-blue-500/10 text-blue-500" />
        <StatCard icon={UserCheck}     label="Patients enregistrés" value={centre._count.patients}      color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={ClipboardList} label="Consultations"       value={centre._count.enregistrements} color="bg-violet-50 dark:bg-violet-500/10 text-violet-500" />
        <StatCard icon={AlertTriangle} label="Accès urgences"      value={centre._count.accesUrgences}  color="bg-orange-50 dark:bg-orange-500/10 text-orange-500" />
      </div>

      <div className="dash-in delay-100 grid lg:grid-cols-3 gap-5">

        {/* Informations */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Informations</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{centre.adresse}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">{centre.region} · {centre.prefecture}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-700 dark:text-zinc-300">{centre.telephone}</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-700 dark:text-zinc-300 break-all">{centre.email}</p>
            </div>
          </div>

          {centre.admin && (
            <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-3">Administrateur</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand font-bold text-xs">{centre.admin.nom[0]}{centre.admin.prenoms[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{centre.admin.nom} {centre.admin.prenoms}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">{centre.admin.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personnel récent */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Personnel récent</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{centre._count.utilisateurs} au total</p>
          </div>
          {centre.utilisateurs.length === 0 ? (
            <div className="py-10 text-center">
              <User className="h-6 w-6 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucun personnel</p>
            </div>
          ) : (
            <ul>
              {centre.utilisateurs.map((u, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 dark:border-zinc-800/60 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-600 dark:text-zinc-300 font-bold text-xs">{u.user.nom[0]}{u.user.prenoms[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.user.nom} {u.user.prenoms}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{NIVEAU_LABELS[u.user.niveauAcces] ?? u.user.niveauAcces}</p>
                  </div>
                  <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${u.user.estActif ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'}`} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Patients récents */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Patients récents</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{centre._count.patients} au total</p>
          </div>
          {centre.patients.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucun patient</p>
            </div>
          ) : (
            <ul>
              {centre.patients.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 dark:border-zinc-800/60 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-600 dark:text-zinc-300 font-bold text-xs">{p.nom[0]}{p.prenoms[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.nom} {p.prenoms}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Enregistré le {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Dialog modifier ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white font-extrabold">Modifier le centre</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3 mt-2">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'nom',        label: 'Nom',        placeholder: 'Nom du centre' },
                { key: 'adresse',    label: 'Adresse',    placeholder: 'Adresse' },
                { key: 'telephone',  label: 'Téléphone',  placeholder: '+228 XX XX XX XX' },
                { key: 'email',      label: 'Email',      placeholder: 'email@centre.tg', type: 'email' },
                { key: 'region',     label: 'Région',     placeholder: 'Région' },
                { key: 'prefecture', label: 'Préfecture', placeholder: 'Préfecture' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className={labelCls}>{label} *</Label>
                  <Input type={type || 'text'} placeholder={placeholder}
                    value={(editForm as Record<string, string>)[key]}
                    onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                    required className={inputCls} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className={labelCls}>Type *</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={editSubmitting} className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
              {editSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer les modifications'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
