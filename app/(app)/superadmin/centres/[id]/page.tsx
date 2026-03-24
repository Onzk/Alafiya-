'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  Building2, Loader2, Phone, Mail, MapPin, Users, UserCheck,
  ClipboardList, AlertTriangle, Pencil, CheckCircle2, XCircle, Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogScrollableWrapper } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import CentreCharts from '@/components/superadmin/centre-charts'

interface UserSpecialite {
  specialite: { nom: string; code: string }
}

interface PersonnelUser {
  nom: string
  prenoms: string
  email: string
  estActif: boolean
  niveauAcces: string
  createdAt: string
  specialites: UserSpecialite[]
}

interface CentreDetail {
  id: string
  nom: string
  type: string
  adresse: string
  telephone: string
  email: string
  region: string
  prefecture: string
  prixParDossier: number
  commissionNdi: number
  estActif: boolean
  createdAt: string
  admin?: { nom: string; prenoms: string; email: string; telephone?: string }
  _count: { utilisateurs: number; patients: number; enregistrements: number; accesUrgences: number }
  utilisateurs: { user: PersonnelUser }[]
}

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', CSU: 'CSU', CMS: 'CMS', AUTRE: 'Autre',
}

const NIVEAU_LABELS: Record<string, string> = {
  SUPERADMIN: 'N\'di Solutions', ADMIN_CENTRE: 'Admin centre', PERSONNEL: 'Personnel médical',
}

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
const labelCls = 'text-slate-700 dark:text-zinc-300 text-sm font-medium'

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#06b6d4', '#ec4899']

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

function DonutChart({ data }: { data: { label: string; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.count, 0)

  if (total === 0) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune donnée</p>
    </div>
  )

  const r = 62, cx = 76, cy = 76, strokeW = 22
  const circ = 2 * Math.PI * r
  let cumulativePct = 0

  const segments = data.map((d, i) => {
    const pct = d.count / total
    const dashLen = pct * circ
    const rotateAngle = cumulativePct * 360 - 90
    cumulativePct += pct
    return { ...d, pct, dashLen, rotateAngle, color: CHART_COLORS[i % CHART_COLORS.length] }
  })

  const hSeg = hovered !== null ? segments[hovered] : null

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <svg width="152" height="152" viewBox="0 0 152 152">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={strokeW} className="text-slate-100 dark:text-zinc-800" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={hovered === i ? strokeW + 4 : strokeW}
            strokeDasharray={`${s.dashLen} ${circ}`}
            transform={`rotate(${s.rotateAngle} ${cx} ${cy})`}
            style={{
              cursor: 'pointer',
              opacity: hovered === null || hovered === i ? 1 : 0.2,
              transition: 'opacity 0.15s, stroke-width 0.15s',
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {hSeg ? (
          <>
            <text x={cx} y={cy - 10} textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor">{hSeg.count}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill={hSeg.color}>{Math.round(hSeg.pct * 100)}%</text>
            <text x={cx} y={cy + 26} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {hSeg.label.length > 16 ? hSeg.label.slice(0, 15) + '…' : hSeg.label}
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy + 7} textAnchor="middle" fontSize="24" fontWeight="800" fill="currentColor">{total}</text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize="9" fill="#94a3b8">total</text>
          </>
        )}
      </svg>

      <div className="w-full space-y-1">
        {segments.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-default"
            style={{ backgroundColor: hovered === i ? `${s.color}18` : 'transparent' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-600 dark:text-zinc-400 flex-1 truncate">{s.label}</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{s.count}</span>
          </div>
        ))}
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
  const [editForm, setEditForm] = useState({ nom: '', adresse: '', telephone: '', email: '', region: '', prefecture: '', type: 'HOPITAL', prixParDossier: 0, commissionNdi: 0 })
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/centres/${id}`)
      .then((r) => r.json())
      .then((d) => { setCentre(d.centre); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  // Compute personnel type stats
  const personnelTypeData = useMemo(() => {
    if (!centre) return []
    const counts: Record<string, number> = {}
    centre.utilisateurs.forEach((u) => {
      if (u.user.specialites.length === 0) {
        const label = NIVEAU_LABELS[u.user.niveauAcces] ?? u.user.niveauAcces
        counts[label] = (counts[label] || 0) + 1
      } else {
        u.user.specialites.forEach((s) => {
          counts[s.specialite.nom] = (counts[s.specialite.nom] || 0) + 1
        })
      }
    })
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [centre])

  function openEdit() {
    if (!centre) return
    setEditForm({ nom: centre.nom, adresse: centre.adresse, telephone: centre.telephone, email: centre.email, region: centre.region, prefecture: centre.prefecture, type: centre.type, prixParDossier: centre.prixParDossier ?? 0, commissionNdi: centre.commissionNdi ?? 0 })
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
        <Link href="/superadmin/centres">
          <Button variant="outline" className="h-10 rounded-xl">Retour</Button>
        </Link>
      </div>
    )
  }

  const dateCreation = new Date(centre.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">

      {/* Retour + en-tête */}
      <div className="dash-in delay-0">

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{centre.nom}</h1>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">{TYPE_LABELS[centre.type] ?? centre.type}</span>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${centre.estActif ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
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
        <StatCard icon={Users}         label="Personnel médical"    value={centre._count.utilisateurs}    color="bg-blue-50 dark:bg-blue-500/10 text-blue-500" />
        <StatCard icon={UserCheck}     label="Patients enregistrés" value={centre._count.patients}        color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={ClipboardList} label="Consultations"         value={centre._count.enregistrements} color="bg-violet-50 dark:bg-violet-500/10 text-violet-500" />
        <StatCard icon={AlertTriangle} label="Accès urgences"        value={centre._count.accesUrgences}   color="bg-orange-50 dark:bg-orange-500/10 text-orange-500" />
      </div>

      {/* 3 graphes sur une ligne : répartition personnel + 2 area charts */}
      <div className="dash-in delay-100 grid lg:grid-cols-3 gap-4">

        {/* Répartition du personnel */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Répartition du personnel</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">Par spécialité ou rôle · ce centre</p>
          </div>
          {personnelTypeData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <Users className="h-8 w-8 text-slate-200 dark:text-zinc-700 mb-2" />
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucun personnel</p>
            </div>
          ) : (
            <DonutChart data={personnelTypeData} />
          )}
        </div>

        {/* 2 area charts via CentreCharts, contents = participent directement au grid parent */}
        <CentreCharts centreId={centre.id} className="contents" />

      </div>

      {/* Informations en grid */}
      <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5">
        <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Informations</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Adresse
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{centre.adresse}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{centre.region} · {centre.prefecture}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> Téléphone
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{centre.telephone}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white break-all">{centre.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Banknote className="h-3 w-3" /> Prix par dossier
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{centre.prixParDossier.toLocaleString('fr-FR')} FCFA</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Banknote className="h-3 w-3" /> Commission N&apos;di
            </p>
            <p className="text-sm font-bold text-brand">{centre.commissionNdi.toLocaleString('fr-FR')} FCFA</p>
          </div>

          {centre.admin && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Administrateur</p>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand font-bold text-xs">{centre.admin.nom[0]}{centre.admin.prenoms[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{centre.admin.nom} {centre.admin.prenoms}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{centre.admin.email}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Dialog modifier ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader title="Modifier le centre" description="Mettez à jour les informations du centre pour garder vos données à jour." icon={Pencil} />
          <DialogScrollableWrapper>
            <form onSubmit={handleEdit} className="space-y-3">
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
                      value={(editForm as Record<string, unknown>)[key] as string}
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
                <div className="space-y-1.5">
                  <Label className={labelCls}>Prix par dossier (FCFA)</Label>
                  <Input type="number" min="0" placeholder="Ex : 2000"
                    value={editForm.prixParDossier}
                    onChange={(e) => setEditForm((p) => ({ ...p, prixParDossier: Number(e.target.value) }))}
                    className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelCls}>Commission N'di Solutions (FCFA)</Label>
                  <Input type="number" min="0" placeholder="Ex : 1000"
                    value={editForm.commissionNdi}
                    onChange={(e) => setEditForm((p) => ({ ...p, commissionNdi: Number(e.target.value) }))}
                    className={inputCls} />
                </div>
              </div>
              <Button type="submit" disabled={editSubmitting} className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {editSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer les modifications'}
              </Button>
            </form>
          </DialogScrollableWrapper>
        </DialogContent>
      </Dialog>
    </div>
  )
}
