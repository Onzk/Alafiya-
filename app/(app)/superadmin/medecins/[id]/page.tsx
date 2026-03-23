'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Loader2, ArrowLeft, Phone, Mail, Building2, Stethoscope,
  Pencil, CheckCircle2, XCircle, Camera, ClipboardList, AlertTriangle,
  UserPlus, Power, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogScrollableWrapper } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface MedecinDetail {
  id: string
  nom: string
  prenoms: string
  email: string
  telephone?: string
  niveauAcces: string
  estActif: boolean
  createdAt: string
  photo?: string
  role?: { nom: string }
  specialites: { specialite: { id: string; nom: string; code: string } }[]
  centres: { centre: { id: string; nom: string; type: string } }[]
  _count: { enregistrements: number; accesUrgences: number; patientsCrees: number }
}

interface Specialite { id: string; nom: string; code: string }

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', CSU: 'CSU', CMS: 'CMS', AUTRE: 'Autre',
}

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

export default function MedecinDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [medecin, setMedecin] = useState<MedecinDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [confirmToggle, setConfirmToggle] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nom: '', prenoms: '', telephone: '', specialites: [] as string[] })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [allSpecialites, setAllSpecialites] = useState<Specialite[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/utilisateurs/${id}`).then((r) => r.json()),
      fetch('/api/specialites').then((r) => r.json()),
    ]).then(([userData, spData]) => {
      setMedecin(userData.utilisateur)
      setAllSpecialites(spData.specialites || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  function openEdit() {
    if (!medecin) return
    setEditForm({
      nom: medecin.nom,
      prenoms: medecin.prenoms,
      telephone: medecin.telephone || '',
      specialites: medecin.specialites.map((s) => {
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
    setMedecin(fresh.utilisateur)
    setEditOpen(false)
    toast({ description: 'Personnel modifié avec succès' })
  }

  async function toggleActif() {
    if (!medecin) return
    setToggling(true)
    const res = await fetch(`/api/utilisateurs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estActif: !medecin.estActif }),
    })
    setToggling(false)
    if (res.ok) setMedecin((prev) => prev ? { ...prev, estActif: !prev.estActif } : prev)
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
    if (!res.ok) { toast({ description: data.error || 'Erreur lors de l\'upload', variant: 'destructive' }); return }
    setMedecin((prev) => prev ? { ...prev, photo: data.photo } : prev)
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

  if (!medecin) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-2">Personnel introuvable</p>
        <Link href="/superadmin/medecins">
          <Button variant="outline" className="h-10 rounded-xl">Retour</Button>
        </Link>
      </div>
    )
  }

  const dateCreation = new Date(medecin.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const initiales = `${medecin.nom[0]}${medecin.prenoms[0]}`

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── En-tête ── */}
      <div className="dash-in delay-0">
        <Link href="/superadmin/medecins" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Personnel médical
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Avatar avec upload photo */}
            <div className="relative group flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-sm">
                {medecin.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={medecin.photo} alt={`${medecin.nom} ${medecin.prenoms}`} className="object-cover w-full h-full" />
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
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{medecin.nom} {medecin.prenoms}</h1>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${medecin.estActif ? 'bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'}`}>
                  {medecin.estActif ? <><CheckCircle2 className="h-3 w-3" />Actif</> : <><XCircle className="h-3 w-3" />Inactif</>}
                </span>
                {medecin.role && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">{medecin.role.nom}</span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{medecin.email} · Enregistré le {dateCreation}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setConfirmToggle(true)} disabled={toggling} variant="outline"
              className={`h-10 rounded-xl text-sm font-semibold border-slate-200 dark:border-zinc-700 ${medecin.estActif ? 'hover:border-red-300 hover:text-red-500 dark:hover:border-red-800 dark:hover:text-red-400' : 'hover:border-brand/40 hover:text-brand'}`}>
              {medecin.estActif ? 'Désactiver' : 'Activer'}
            </Button>
            <Button onClick={openEdit} className="h-10 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20">
              <Pencil className="h-4 w-4" />Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="dash-in delay-75 grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Consultations"        value={medecin._count.enregistrements} color="bg-violet-50 dark:bg-violet-500/10 text-violet-500" />
        <StatCard icon={AlertTriangle} label="Accès urgences"       value={medecin._count.accesUrgences}   color="bg-orange-50 dark:bg-orange-500/10 text-orange-500" />
        <StatCard icon={Users}         label="Patients enregistrés" value={medecin._count.patientsCrees}   color="bg-blue-50 dark:bg-blue-500/10 text-blue-500" />
      </div>

      {/* ── Panneaux ── */}
      <div className="dash-in delay-100 grid lg:grid-cols-2 gap-5">

        {/* Informations + Spécialités */}
        <div className="space-y-5">

          {/* Contact */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Informations</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-700 dark:text-zinc-300 break-all">{medecin.email}</p>
              </div>
              {medecin.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-zinc-300">{medecin.telephone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Spécialités */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-brand" />Spécialités
            </h2>
            {medecin.specialites.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucune spécialité assignée</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {medecin.specialites.map((s) => (
                  <span key={s.specialite.code}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-400/15 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-400/20">
                    {s.specialite.nom}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Centres affiliés */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Centres affiliés</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{medecin.centres.length} centre(s)</p>
          </div>
          {medecin.centres.length === 0 ? (
            <div className="py-10 text-center">
              <Building2 className="h-6 w-6 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-zinc-500">Aucun centre affilié</p>
            </div>
          ) : (
            <ul>
              {medecin.centres.map((c) => (
                <li key={c.centre.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 dark:border-zinc-800/60 last:border-0">
                  <div className="h-9 w-9 rounded-xl bg-brand/8 dark:bg-brand/12 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{c.centre.nom}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">{TYPE_LABELS[c.centre.type] ?? c.centre.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* ── Dialog confirmation toggle ── */}
      <Dialog open={confirmToggle} onOpenChange={setConfirmToggle}>
        <DialogContent className="max-w-sm">
          <DialogHeader
            title={medecin.estActif ? 'Désactiver le personnel ?' : 'Activer le personnel ?'}
            description={medecin.estActif
              ? `${medecin.nom} ${medecin.prenoms} n'aura plus accès à la plateforme.`
              : `${medecin.nom} ${medecin.prenoms} aura de nouveau accès à la plateforme.`}
            icon={Power}
          />
          <div className="flex gap-3 px-5 md:px-7 pb-5 md:pb-6">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setConfirmToggle(false)}>Annuler</Button>
            <Button
              className={`flex-1 h-11 rounded-xl text-white shadow-sm ${medecin.estActif ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand hover:bg-brand-dark'}`}
              onClick={async () => { await toggleActif(); setConfirmToggle(false) }}
              disabled={toggling}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : (medecin.estActif ? 'Désactiver' : 'Activer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog modifier ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader title="Modifier le personnel" description="Mettez à jour les informations du membre du personnel pour garder vos données à jour." icon={Pencil} />
          <DialogScrollableWrapper>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'nom',       label: 'Nom',       placeholder: 'Nom' },
                  { key: 'prenoms',   label: 'Prénoms',   placeholder: 'Prénoms' },
                  { key: 'telephone', label: 'Téléphone', placeholder: '+228 XX XX XX XX', required: false },
                ].map(({ key, label, placeholder, required }) => (
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
                      <button key={sp.id} type="button" onClick={() => toggleSpecialite(sp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          editForm.specialites.includes(sp.id)
                            ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-brand/40'
                        }`}>
                        {sp.nom}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
