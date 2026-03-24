'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Loader2, Phone, Mail, Calendar,
  Pencil, CheckCircle2, XCircle, Camera, ClipboardList,
  AlertTriangle, Power, Users, Shield, Trash2, UserRound,
  ChevronLeft, ChevronRight, FileText, UserPlus,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogScrollableWrapper } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface PersonnelDetail {
  id: string
  nom: string
  prenoms: string
  email: string
  telephone?: string
  estActif: boolean
  createdAt: string
  photo?: string
  role?: { nom: string }
  specialites: { specialite: { id: string; nom: string; code: string } }[]
  _count: { enregistrements: number; accesUrgences: number; patientsCrees: number }
  patientsCrees: { id: string; nom: string; prenoms: string; createdAt: string }[]
}

interface Specialite { id: string; nom: string; code: string }

const inputCls = 'h-11 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'
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

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

type DayData = { jour: number; count: number }

function MonthNav({ year, month, onChange }: { year: number; month: number; onChange: (y: number, m: number) => void }) {
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  function prev() { if (month === 1) onChange(year - 1, 12); else onChange(year, month - 1) }
  function next() { if (isCurrentMonth) return; if (month === 12) onChange(year + 1, 1); else onChange(year, month + 1) }
  return (
    <div className="flex items-center gap-1">
      <button onClick={prev} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 min-w-[110px] text-center">
        {MOIS[month - 1]} {year}
      </span>
      <button onClick={next} disabled={isCurrentMonth} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function PersonnelChart({
  personnelId, type, title, subtitle, icon: Icon,
  iconBg, iconColor, gradientId, strokeColor, fillColor,
}: {
  personnelId: string; type: 'enregistrements' | 'patients'
  title: string; subtitle: string; icon: React.ElementType
  iconBg: string; iconColor: string; gradientId: string; strokeColor: string; fillColor: string
}) {
  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [data, setData]       = useState<DayData[] | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/utilisateurs/${personnelId}/charts?year=${y}&month=${m}&type=${type}`)
      if (res.ok) setData((await res.json()).data)
    } finally { setLoading(false) }
  }, [personnelId, type])

  useEffect(() => { fetchData(year, month) }, [year, month, fetchData])

  const empty: DayData[] = Array.from({ length: 30 }, (_, i) => ({ jour: i + 1, count: 0 }))
  const chartData = data ?? empty
  const total = chartData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{title}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">{total}</p>
          <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
        </div>
      </div>
      <div className="h-48 px-1 pb-3">
        {loading ? (
          <div className="h-48 flex items-end gap-1 px-2 pb-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-sm animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fillColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', fontSize: 12, padding: '6px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                labelFormatter={(v) => `Jour ${v}`}
                formatter={(v) => [v ?? 0, 'Créations']}
                cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="count" stroke={strokeColor} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default function PersonnelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [personnel, setPersonnel] = useState<PersonnelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [confirmToggle, setConfirmToggle] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nom: '', prenoms: '', telephone: '', specialites: [] as string[] })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [allSpecialites, setAllSpecialites] = useState<Specialite[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/utilisateurs/${id}`).then((r) => r.json()),
      fetch('/api/specialites').then((r) => r.json()),
    ]).then(([userData, spData]) => {
      setPersonnel(userData.utilisateur)
      setAllSpecialites(spData.specialites || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  function openEdit() {
    if (!personnel) return
    setEditForm({
      nom: personnel.nom,
      prenoms: personnel.prenoms,
      telephone: personnel.telephone || '',
      specialites: personnel.specialites.map((s) => {
        const found = allSpecialites.find((sp) => sp.code === s.specialite.code)
        return found?.id || ''
      }).filter(Boolean),
    })
    setEditOpen(true)
  }

  function toggleSpecialite(spId: string) {
    setEditForm((prev) => ({
      ...prev,
      specialites: prev.specialites.includes(spId)
        ? prev.specialites.filter((s) => s !== spId)
        : [...prev.specialites, spId],
    }))
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditSubmitting(true)
    const res = await fetch(`/api/utilisateurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    setEditSubmitting(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    const fresh = await fetch(`/api/utilisateurs/${id}`).then((r) => r.json())
    setPersonnel(fresh.utilisateur)
    setEditOpen(false)
    toast({ description: 'Personnel modifié avec succès' })
  }

  async function toggleActif() {
    if (!personnel) return
    setToggling(true)
    const res = await fetch(`/api/utilisateurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActif: !personnel.estActif }),
    })
    setToggling(false)
    if (res.ok) setPersonnel((prev) => prev ? { ...prev, estActif: !prev.estActif } : prev)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/utilisateurs/${id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      toast({ description: 'Personnel supprimé' })
      router.push('/admin/personnels')
    } else {
      toast({ description: 'Erreur lors de la suppression', variant: 'destructive' })
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('photo', file)
    const res = await fetch(`/api/utilisateurs/${id}/photo`, { method: 'POST', body: formData })
    const data = await res.json()
    setUploadingPhoto(false)
    if (!res.ok) { toast({ description: data.error || "Erreur lors de l'upload", variant: 'destructive' }); return }
    setPersonnel((prev) => prev ? { ...prev, photo: data.photo } : prev)
    toast({ description: 'Photo de profil mise à jour' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-brand" />
      </div>
    )
  }

  if (!personnel) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-2">Personnel introuvable</p>
        <Link href="/admin/personnels">
          <Button variant="outline" className="h-10 rounded-xl">Retour</Button>
        </Link>
      </div>
    )
  }

  const dateCreation = new Date(personnel.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const initiales = `${personnel.nom[0]}${personnel.prenoms[0]}`

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── En-tête ── */}
      <div className="dash-in delay-0">

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">

            {/* Avatar + upload photo */}
            <div className="relative group flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-sm">
                {personnel.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={personnel.photo} alt={`${personnel.nom} ${personnel.prenoms}`} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-brand font-extrabold text-xl">{initiales}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Changer la photo de profil"
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploadingPhoto
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {personnel.nom.toUpperCase()} {personnel.prenoms}
                </h1>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${
                  personnel.estActif
                    ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand'
                    : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                }`}>
                  {personnel.estActif
                    ? <><CheckCircle2 className="h-3 w-3" />Actif</>
                    : <><XCircle className="h-3 w-3" />Inactif</>
                  }
                </span>
                {personnel.role && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">
                    {personnel.role.nom}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                {personnel.email} · Enregistré le {dateCreation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setConfirmToggle(true)}
              disabled={toggling}
              variant="outline"
              className={`h-10 rounded-xl text-sm font-semibold border-slate-200 dark:border-zinc-700 ${
                personnel.estActif
                  ? 'hover:border-orange-300 hover:text-orange-500 dark:hover:border-orange-800 dark:hover:text-orange-400'
                  : 'hover:border-brand/40 hover:text-brand'
              }`}
            >
              {personnel.estActif ? 'Désactiver' : 'Activer'}
            </Button>
            <Button
              onClick={() => setConfirmDelete(true)}
              variant="outline"
              className="h-10 w-10 rounded-xl border-red-200 dark:border-red-400/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-0 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button onClick={openEdit} className="h-10 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
              <Pencil className="h-4 w-4" />Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="dash-in delay-75 grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Consultations"        value={personnel._count.enregistrements} color="bg-violet-50 dark:bg-violet-500/10 text-violet-500" />
        <StatCard icon={AlertTriangle} label="Accès urgences"       value={personnel._count.accesUrgences}   color="bg-orange-50 dark:bg-orange-500/10 text-orange-500" />
        <StatCard icon={Users}         label="Patients enregistrés" value={personnel._count.patientsCrees}   color="bg-blue-50 dark:bg-blue-500/10 text-blue-500" />
      </div>

      {/* ── Panneaux ── */}
      <div className="dash-in delay-100 grid lg:grid-cols-2 gap-5">

        {/* Informations + Spécialités */}
        <div className="space-y-5">

          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Informations</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-700 dark:text-zinc-300 break-all">{personnel.email}</p>
              </div>
              {personnel.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-zinc-300">{personnel.telephone}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-700 dark:text-zinc-300">Membre depuis le {dateCreation}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand" />Spécialités
            </h2>
            {personnel.specialites.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune spécialité assignée</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {personnel.specialites.map((s) => (
                  <span
                    key={s.specialite.code}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-400/20"
                  >
                    {s.specialite.nom}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Derniers patients */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center flex-shrink-0">
              <UserRound className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Derniers patients enregistrés</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
                5 plus récents sur {personnel._count.patientsCrees}
              </p>
            </div>
          </div>
          {personnel.patientsCrees.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="h-6 w-6 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucun patient enregistré</p>
            </div>
          ) : (
            <ul>
              {personnel.patientsCrees.map((p, i) => (
                <li
                  key={p.id}
                  className={`dash-in delay-${[0, 75, 100, 150, 200][i]} flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-50 dark:border-zinc-800/60 last:border-0`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand font-bold text-xs">{p.nom[0]}{p.prenoms[0]}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                      {p.nom.toUpperCase()} {p.prenoms}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">
                    {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Graphes d'activité ── */}
      <div className="dash-in delay-150 grid md:grid-cols-2 gap-4">
        <PersonnelChart
          personnelId={id}
          type="enregistrements"
          title="Enregistrements médicaux"
          subtitle="Créations par jour"
          icon={FileText}
          iconBg="bg-brand/10 dark:bg-brand/15"
          iconColor="text-brand"
          gradientId="gradPEnreg"
          strokeColor="#21c488"
          fillColor="#21c488"
        />
        <PersonnelChart
          personnelId={id}
          type="patients"
          title="Création de comptes patients"
          subtitle="Nouveaux patients par jour"
          icon={UserPlus}
          iconBg="bg-blue-500/10 dark:bg-blue-400/15"
          iconColor="text-blue-600 dark:text-blue-300"
          gradientId="gradPPatients"
          strokeColor="#3b82f6"
          fillColor="#3b82f6"
        />
      </div>

      {/* ── Dialog toggle ── */}
      <Dialog open={confirmToggle} onOpenChange={setConfirmToggle}>
        <DialogContent className="max-w-sm">
          <DialogHeader
            title={personnel.estActif ? 'Désactiver le personnel ?' : 'Activer le personnel ?'}
            description={personnel.estActif
              ? `${personnel.nom} ${personnel.prenoms} n'aura plus accès à la plateforme.`
              : `${personnel.nom} ${personnel.prenoms} aura de nouveau accès à la plateforme.`}
            icon={Power}
          />
          <div className="flex gap-3 px-5 md:px-7 pb-5 md:pb-6">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setConfirmToggle(false)}>
              Annuler
            </Button>
            <Button
              className={`flex-1 h-11 rounded-xl text-white shadow-sm ${
                personnel.estActif ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand hover:bg-brand-dark'
              }`}
              onClick={async () => { await toggleActif(); setConfirmToggle(false) }}
              disabled={toggling}
            >
              {toggling
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : personnel.estActif ? 'Désactiver' : 'Activer'
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog supprimer ── */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader
            title="Supprimer le personnel ?"
            description={`Vous êtes sur le point de supprimer ${personnel.nom} ${personnel.prenoms}. Cette action est irréversible.`}
            icon={Trash2}
            danger
          />
          <div className="flex gap-3 px-5 md:px-7 pb-5 md:pb-6">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog modifier ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader
            title="Modifier le personnel"
            description="Mettez à jour les informations du membre du personnel pour garder vos données à jour."
            icon={Pencil}
          />
          <DialogScrollableWrapper>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  { key: 'nom',       label: 'Nom',       placeholder: 'Nom' },
                  { key: 'prenoms',   label: 'Prénoms',   placeholder: 'Prénoms' },
                  { key: 'telephone', label: 'Téléphone', placeholder: '+224 XX XX XX XX', required: false },
                ] as { key: string; label: string; placeholder: string; required?: boolean }[]).map(({ key, label, placeholder, required }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className={labelCls}>{label}{required !== false && ' *'}</Label>
                    <Input
                      placeholder={placeholder}
                      value={(editForm as Record<string, unknown>)[key] as string}
                      onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                      required={required !== false}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              {allSpecialites.length > 0 && (
                <div className="space-y-2">
                  <Label className={labelCls}>Spécialités</Label>
                  <div className="flex flex-wrap gap-2">
                    {allSpecialites.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => toggleSpecialite(sp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          editForm.specialites.includes(sp.id)
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

              <Button type="submit" disabled={editSubmitting} className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {editSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</>
                  : 'Enregistrer les modifications'
                }
              </Button>
            </form>
          </DialogScrollableWrapper>
        </DialogContent>
      </Dialog>
    </div>
  )
}
