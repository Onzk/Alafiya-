'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, FlaskConical, Pill, CalendarCheck,
  FileText, ScrollText, Plus, Trash2, ExternalLink, Loader2, X,
  Clock, CheckCircle2, CalendarX2, Pencil, Save, CornerDownRight,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { OrdonnanceLigneChamp, parseLignes } from '@/components/dossier/OrdonnanceLigneChamp'
import { ConsultationCardHeader } from '@/app/(app)/patients/[id]/modules/[specialite]/ConsultationCardHeader'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocConsultation = {
  id: string
  titre: string
  note: string | null
  fichier: string
  createdAt: string
}

export type OrdConsultation = {
  id: string
  titre: string | null
  texte: string | null
  fichier: string | null
  createdAt: string
}

export type StatutConsultation = 'EN_COURS' | 'TERMINEE' | 'REPORTEE'

export type ConsultationData = {
  id: string
  patientId: string
  dossierId: string
  specialiteId: string
  specialiteNom: string
  parentId: string | null
  jour: string
  heure: string
  genereParIA: boolean
  statut: StatutConsultation
  causeReport: string | null
  dateProchainRdv: string | null
  antecedents: string | null
  signes: string | null
  examens: string | null
  bilan: string | null
  traitConseils: string | null
  traitInjections: string | null
  traitOrdonnance: string | null
  suivi: string | null
  medecin: {
    nom: string
    prenoms: string
    telephone: string | null
    photo: string | null
    role: { nom: string } | null
  }
  centre: {
    nom: string
    adresse: string
    region: string
    prefecture: string
    type: string
    telephone: string | null
    email: string | null
    logo: string | null
  }
  documents: DocConsultation[]
  ordonnances: OrdConsultation[]
  sousConsultations: ConsultationData[]
}

type TabId = 'contenu' | 'ordonnances' | 'documents'

// ─── Config statut ─────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<StatutConsultation, {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  btnCls: string
  activeCls: string
}> = {
  EN_COURS: {
    label: 'En cours',
    Icon: Clock,
    btnCls: 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400',
    activeCls: 'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30',
  },
  TERMINEE: {
    label: 'Terminée',
    Icon: CheckCircle2,
    btnCls: 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400',
    activeCls: 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30',
  },
  REPORTEE: {
    label: 'Reportée',
    Icon: CalendarX2,
    btnCls: 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400',
    activeCls: 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30',
  },
}

// ─── Section couleur ──────────────────────────────────────────────────────────

const COLORS = {
  blue:    { icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400',    label: 'text-blue-600 dark:text-blue-400'    },
  violet:  { icon: 'bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400', label: 'text-violet-600 dark:text-violet-400' },
  emerald: { icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400', label: 'text-emerald-600 dark:text-emerald-400' },
  orange:  { icon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400',  label: 'text-orange-600 dark:text-orange-400'  },
}

function Section({
  icon: Icon, color, label, value, className = '',
}: {
  icon: React.ComponentType<{ className?: string }>
  color: keyof typeof COLORS
  label: string
  value: string
  className?: string
}) {
  const c = COLORS[color]
  const lines = value.split('\n').filter((l) => l.trim() !== '')
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md ${c.icon}`}>
          <Icon className="h-3 w-3" />
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${c.label}`}>{label}</span>
      </div>
      {lines.length <= 1 ? (
        <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{value}</p>
      ) : (
        <ul className="space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-zinc-300">
              <span className="text-slate-300 dark:text-zinc-600 shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Affichage d'une ordonnance textuelle ─────────────────────────────────────

function OrdonnanceTexteDisplay({ texte }: { texte: string }) {
  const lignes = parseLignes(texte).filter(
    (l) => l.produit || l.quantite || l.frequence,
  )
  if (lignes.length === 0) return null

  const isStructured = lignes.some((l) => l.quantite || l.frequence)

  if (!isStructured) {
    return (
      <ul className="space-y-1 mt-1">
        {lignes.map((l, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-zinc-300">
            <span className="text-slate-300 dark:text-zinc-600 shrink-0 mt-0.5">•</span>
            <span>{l.produit}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="mt-1 rounded-lg border border-slate-100 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-900 text-xs text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
            <th className="px-3 py-1.5 text-left font-medium">Produit</th>
            <th className="px-3 py-1.5 text-left font-medium">Qté</th>
            <th className="px-3 py-1.5 text-left font-medium">Fréquence / Durée</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {lignes.map((l, i) => (
            <tr key={i} className="text-slate-700 dark:text-zinc-300">
              <td className="px-3 py-2 font-medium">{l.produit || '—'}</td>
              <td className="px-3 py-2 text-slate-500 dark:text-zinc-400 whitespace-nowrap">{l.quantite || '—'}</td>
              <td className="px-3 py-2 text-slate-500 dark:text-zinc-400">{l.frequence || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ConsultationCard({ enr }: { enr: ConsultationData }) {
  const router = useRouter()
  const { toast } = useToast()

  const [tab, setTab] = useState<TabId>('contenu')
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [showAddOrd, setShowAddOrd] = useState(false)

  // ── Statut ──────────────────────────────────────────────────────────────
  const [statut, setStatutState] = useState<StatutConsultation>(enr.statut)
  const [showStatutForm, setShowStatutForm] = useState(false)
  const [statutPending, setStatutPending] = useState<StatutConsultation | null>(null)
  const [causeReport, setCauseReport] = useState(enr.causeReport ?? '')
  const [dateProchainRdv, setDateProchainRdv] = useState(
    enr.dateProchainRdv
      ? new Date(enr.dateProchainRdv).toISOString().slice(0, 16)
      : '',
  )
  const [loadingStatut, setLoadingStatut] = useState(false)
  const [confirmTerminee, setConfirmTerminee] = useState(false)

  // ── Édition contenu (EN_COURS uniquement) ──────────────────────────────
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    antecedents:    enr.antecedents    ?? '',
    signes:         enr.signes         ?? '',
    examens:        enr.examens        ?? '',
    bilan:          enr.bilan          ?? '',
    traitConseils:  enr.traitConseils  ?? '',
    traitInjections:enr.traitInjections?? '',
    traitOrdonnance:enr.traitOrdonnance?? '',
    suivi:          enr.suivi          ?? '',
  })
  const [loadingEdit, setLoadingEdit] = useState(false)

  // ── Formulaires docs / ordonnances ─────────────────────────────────────
  const [docTitre,   setDocTitre]   = useState('')
  const [docNote,    setDocNote]    = useState('')
  const [docFile,    setDocFile]    = useState<File | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)

  const [ordTitre,   setOrdTitre]   = useState('')
  const [ordTexte,   setOrdTexte]   = useState('')
  const [ordFile,    setOrdFile]    = useState<File | null>(null)
  const [loadingOrd, setLoadingOrd] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const docFileRef = useRef<HTMLInputElement>(null)
  const ordFileRef = useRef<HTMLInputElement>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────

  function isPdf(fichier: string) {
    return fichier.toLowerCase().endsWith('.pdf')
  }

  function resetDocForm() {
    setDocTitre(''); setDocNote(''); setDocFile(null)
    if (docFileRef.current) docFileRef.current.value = ''
    setShowAddDoc(false)
  }

  function resetOrdForm() {
    setOrdTitre(''); setOrdTexte(''); setOrdFile(null)
    if (ordFileRef.current) ordFileRef.current.value = ''
    setShowAddOrd(false)
  }

  // ── Changement de statut ─────────────────────────────────────────────────

  function handleStatutClick(s: StatutConsultation) {
    if (s === statut) return
    if (s === 'REPORTEE') {
      setConfirmTerminee(false)
      setStatutPending('REPORTEE')
      setShowStatutForm(true)
    } else if (s === 'TERMINEE') {
      setShowStatutForm(false)
      setStatutPending(null)
      setConfirmTerminee(true)
    } else {
      setConfirmTerminee(false)
      applyStatut(s)
    }
  }

  async function applyStatut(s: StatutConsultation, cause?: string, date?: string) {
    setLoadingStatut(true)
    const res = await fetch(`/api/enregistrements/${enr.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statut: s,
        causeReport: s === 'REPORTEE' ? (cause ?? causeReport) || null : null,
        dateProchainRdv: s === 'REPORTEE' && (date ?? dateProchainRdv) ? (date ?? dateProchainRdv) : null,
      }),
    })
    setLoadingStatut(false)
    if (!res.ok) { toast({ description: 'Erreur lors du changement de statut.', variant: 'destructive' }); return }
    setStatutState(s)
    if (s !== 'REPORTEE') { setCauseReport(''); setDateProchainRdv('') }
    setShowStatutForm(false)
    setStatutPending(null)
    router.refresh()
  }

  async function handleStatutFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!causeReport.trim() && !dateProchainRdv) {
      toast({ description: 'Veuillez renseigner la cause ou la date du prochain rendez-vous.', variant: 'destructive' })
      return
    }
    await applyStatut('REPORTEE', causeReport, dateProchainRdv)
  }

  // ── Sauvegarde contenu ────────────────────────────────────────────────────

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoadingEdit(true)
    const res = await fetch(`/api/enregistrements/${enr.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setLoadingEdit(false)
    if (!res.ok) { toast({ description: "Erreur lors de la sauvegarde.", variant: 'destructive' }); return }
    toast({ description: 'Consultation mise à jour.' })
    setEditMode(false)
    router.refresh()
  }

  // ── Soumission document ───────────────────────────────────────────────────

  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!docTitre.trim()) { toast({ description: 'Le titre est requis.', variant: 'destructive' }); return }
    if (!docFile) { toast({ description: 'Veuillez sélectionner un fichier.', variant: 'destructive' }); return }

    setLoadingDoc(true)
    const fd = new FormData()
    fd.append('titre', docTitre.trim())
    if (docNote.trim()) fd.append('note', docNote.trim())
    fd.append('fichier', docFile)

    const res = await fetch(`/api/enregistrements/${enr.id}/documents`, { method: 'POST', body: fd })
    const data = await res.json()
    setLoadingDoc(false)

    if (!res.ok) { toast({ description: data.error || "Erreur lors de l'ajout.", variant: 'destructive' }); return }
    toast({ description: 'Document ajouté.' })
    resetDocForm()
    router.refresh()
  }

  // ── Soumission ordonnance ─────────────────────────────────────────────────

  async function handleAddOrd(e: React.FormEvent) {
    e.preventDefault()
    if (!ordTexte.trim() && !ordFile) {
      toast({ description: "L'ordonnance doit contenir au moins un médicament ou un fichier.", variant: 'destructive' })
      return
    }

    setLoadingOrd(true)
    const fd = new FormData()
    if (ordTitre.trim()) fd.append('titre', ordTitre.trim())
    if (ordTexte.trim()) fd.append('texte', ordTexte.trim())
    if (ordFile) fd.append('fichier', ordFile)

    const res = await fetch(`/api/enregistrements/${enr.id}/ordonnances`, { method: 'POST', body: fd })
    const data = await res.json()
    setLoadingOrd(false)

    if (!res.ok) { toast({ description: data.error || "Erreur lors de l'ajout.", variant: 'destructive' }); return }
    toast({ description: 'Ordonnance ajoutée.' })
    resetOrdForm()
    router.refresh()
  }

  // ── Suppressions ─────────────────────────────────────────────────────────

  async function handleDeleteDoc(docId: string) {
    setDeletingId(docId)
    const res = await fetch(`/api/enregistrements/${enr.id}/documents/${docId}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) { toast({ description: 'Impossible de supprimer.', variant: 'destructive' }); return }
    toast({ description: 'Document supprimé.' })
    router.refresh()
  }

  async function handleDeleteOrd(ordId: string) {
    setDeletingId(ordId)
    const res = await fetch(`/api/enregistrements/${enr.id}/ordonnances/${ordId}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) { toast({ description: 'Impossible de supprimer.', variant: 'destructive' }); return }
    toast({ description: 'Ordonnance supprimée.' })
    router.refresh()
  }

  // ── Tabs config ───────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'contenu',      label: 'Contenu' },
    { id: 'ordonnances',  label: 'Ordonnances', count: enr.ordonnances.length },
    { id: 'documents',    label: 'Documents',   count: enr.documents.length   },
  ]

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div>
    <Card className="overflow-hidden border-slate-200 dark:border-zinc-800 shadow-sm">

      {/* Header */}
      <ConsultationCardHeader
        jour={enr.jour}
        heure={enr.heure}
        genereParIA={enr.genereParIA}
        statut={statut}
        medecin={enr.medecin}
        centre={enr.centre}
      />

      {/* ── Bandeau REPORTEE ── */}
      {statut === 'REPORTEE' && (enr.causeReport || enr.dateProchainRdv) && !showStatutForm && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-800 dark:text-amber-300">
          {enr.causeReport && (
            <span><span className="font-semibold">Cause :</span> {enr.causeReport}</span>
          )}
          {enr.dateProchainRdv && (
            <span>
              <span className="font-semibold">Prochain RDV :</span>{' '}
              {new Date(enr.dateProchainRdv).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
            </span>
          )}
        </div>
      )}

      {/* ── Changement de statut ── */}
      {statut !== 'TERMINEE' && <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30">
        {showStatutForm && statutPending === 'REPORTEE' ? (
          <form onSubmit={handleStatutFormSubmit} className="space-y-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <CalendarX2 className="h-3.5 w-3.5" /> Reporter la consultation
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Input
                value={causeReport}
                onChange={(e) => setCauseReport(e.target.value)}
                placeholder="Cause du report…"
                className="h-10 text-xs rounded-lg"
              />
              <Input
                type="datetime-local"
                value={dateProchainRdv}
                onChange={(e) => setDateProchainRdv(e.target.value)}
                className="h-10 text-xs rounded-lg"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 text-xs"
                onClick={() => { setShowStatutForm(false); setStatutPending(null) }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loadingStatut}
                className="h-10 text-xs bg-amber-500 hover:bg-amber-600 text-white"
              >
                {loadingStatut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmer'}
              </Button>
            </div>
          </form>
        ) : confirmTerminee ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Marquer comme terminée
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Cette action est <span className="font-semibold text-slate-700 dark:text-zinc-200">irréversible</span> — la consultation sera verrouillée et son contenu ne pourra plus être modifié.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 text-xs"
                onClick={() => setConfirmTerminee(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={loadingStatut}
                className="h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setConfirmTerminee(false); applyStatut('TERMINEE') }}
              >
                {loadingStatut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Oui, terminer'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Statut :</span>
            {(Object.keys(STATUT_CONFIG) as StatutConsultation[]).map((s) => {
              const conf = STATUT_CONFIG[s]
              return (
                <button
                  key={s}
                  type="button"
                  disabled={loadingStatut}
                  onClick={() => handleStatutClick(s)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium transition-all',
                    (statut as StatutConsultation) === s ? conf.activeCls : conf.btnCls + ' bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900',
                  )}
                >
                  <conf.Icon className="h-3 w-3" />
                  {conf.label}
                </button>
              )
            })}
            {loadingStatut && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          </div>
        )}
      </div>}

      {/* ── Tabs navigation ── */}
      <div className="flex gap-0 border-b border-slate-100 dark:border-zinc-800 px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setEditMode(false) }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200',
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold',
                tab === t.id
                  ? 'bg-brand/10 text-brand'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400',
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab : Contenu ── */}
      {tab === 'contenu' && (
        editMode ? (
          /* ── Formulaire d'édition ── */
          <form onSubmit={handleSaveEdit} className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                { key: 'antecedents',    label: 'Antécédents',           placeholder: 'Maladies chroniques, allergies…' },
                { key: 'signes',         label: 'Signes & symptômes',    placeholder: 'Motif de consultation, plaintes…' },
                { key: 'examens',        label: 'Examens effectués',     placeholder: 'Examen clinique, auscultation…' },
                { key: 'bilan',          label: 'Résultats & analyses',  placeholder: 'Résultats biologiques, imagerie…' },
                { key: 'traitConseils',  label: 'Conseils',              placeholder: 'Hygiène de vie, régime…' },
                { key: 'traitInjections',label: 'Injections',            placeholder: 'Produit, posologie, voie…' },
                { key: 'suivi',          label: 'Suivi préconisé',       placeholder: 'Prochain RDV, examens…' },
              ] as { key: keyof typeof editForm; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">{label}</Label>
                  <Textarea
                    value={editForm[key]}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={2}
                    className="text-sm dark:bg-zinc-950 resize-none"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">Ordonnance médicale</Label>
                <OrdonnanceLigneChamp
                  value={editForm.traitOrdonnance}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, traitOrdonnance: v }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditMode(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={loadingEdit} className="h-8 text-xs bg-brand hover:bg-brand-dark text-white">
                {loadingEdit
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <><Save className="h-3.5 w-3.5 mr-1" />Sauvegarder</>
                }
              </Button>
            </div>
          </form>
        ) : (
          /* ── Vue lecture ── */
          <CardContent className="p-4 space-y-4">
            {statut === 'EN_COURS' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Éditer le contenu
                </button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {enr.antecedents && <Section icon={ClipboardList} color="blue" label="Antécédents" value={enr.antecedents} />}
              {enr.signes && <Section icon={ClipboardList} color="blue" label="Signes & Symptômes" value={enr.signes} />}
              {enr.examens && <Section icon={FlaskConical} color="violet" label="Examens" value={enr.examens} />}
              {enr.bilan && <Section icon={FlaskConical} color="violet" label="Bilan" value={enr.bilan} />}
              {enr.traitConseils && <Section icon={Pill} color="emerald" label="Conseils" value={enr.traitConseils} />}
              {enr.traitInjections && <Section icon={Pill} color="emerald" label="Injections" value={enr.traitInjections} />}
              {enr.traitOrdonnance && (
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400">
                      <Pill className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Ordonnance</span>
                  </div>
                  <OrdonnanceTexteDisplay texte={enr.traitOrdonnance} />
                </div>
              )}
              {enr.suivi && <Section icon={CalendarCheck} color="orange" label="Suivi" value={enr.suivi} className="sm:col-span-2" />}
              {!enr.antecedents && !enr.signes && !enr.examens && !enr.bilan &&
               !enr.traitConseils && !enr.traitInjections && !enr.traitOrdonnance && !enr.suivi && (
                <p className="sm:col-span-2 text-sm text-slate-400 dark:text-zinc-500 text-center py-4">
                  Aucun contenu saisi pour cette consultation.
                </p>
              )}
            </div>
          </CardContent>
        )
      )}

      {/* ── Tab : Ordonnances ── */}
      {tab === 'ordonnances' && (
        <div className="p-4 space-y-3">

          {enr.ordonnances.length === 0 && !showAddOrd && (
            <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-4">
              Aucune ordonnance pour cette consultation.
            </p>
          )}

          {enr.ordonnances.map((ord) => (
            <div
              key={ord.id}
              className="rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800"
            >
              <div className="flex items-start gap-2 p-2.5">
                <ScrollText className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {ord.titre && (
                    <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-tight">{ord.titre}</p>
                  )}
                  {ord.texte && <OrdonnanceTexteDisplay texte={ord.texte} />}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {ord.fichier && (
                    <a
                      href={ord.fichier}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-brand dark:text-zinc-500 dark:hover:text-brand transition-colors"
                      title="Ouvrir le fichier"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {statut !== 'TERMINEE' && (
                    <button
                      type="button"
                      disabled={deletingId === ord.id}
                      onClick={() => handleDeleteOrd(ord.id)}
                      className="h-6 w-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingId === ord.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {statut !== 'TERMINEE' && (showAddOrd ? (
            <form onSubmit={handleAddOrd} className="space-y-3 p-3 rounded-lg border border-emerald-300/50 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Nouvelle ordonnance</p>
                <button type="button" onClick={resetOrdForm} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">Titre (optionnel)</Label>
                <Input
                  value={ordTitre}
                  onChange={(e) => setOrdTitre(e.target.value)}
                  placeholder="Ex : Ordonnance du 24/03/2026"
                  className="h-9 text-sm rounded-lg"
                />
              </div>
              <OrdonnanceLigneChamp
                value={ordTexte}
                onChange={setOrdTexte}
                labelClassName="text-slate-600 dark:text-zinc-400"
              />
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">Fichier (image ou PDF) — optionnel si médicaments renseignés</Label>
                <input
                  ref={ordFileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setOrdFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-slate-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-zinc-800 file:text-slate-700 dark:file:text-zinc-300 hover:file:bg-slate-200 dark:hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={resetOrdForm}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={loadingOrd} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loadingOrd ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ajouter'}
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddOrd(true)}
              className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter une ordonnance
            </button>
          ))}
        </div>
      )}

      {/* ── Tab : Documents ── */}
      {tab === 'documents' && (
        <div className="p-4 space-y-3">

          {enr.documents.length === 0 && !showAddDoc && (
            <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-4">
              Aucun document pour cette consultation.
            </p>
          )}

          {enr.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800"
            >
              <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-tight">{doc.titre}</p>
                {doc.note && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{doc.note}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.fichier}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-brand dark:text-zinc-500 dark:hover:text-brand transition-colors"
                  title={isPdf(doc.fichier) ? 'Ouvrir le PDF' : "Voir l'image"}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {statut !== 'TERMINEE' && (
                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="h-6 w-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deletingId === doc.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}

          {statut !== 'TERMINEE' && (showAddDoc ? (
            <form onSubmit={handleAddDoc} className="space-y-2.5 p-3 rounded-lg border border-brand/30 dark:border-brand/20 bg-brand/5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-brand">Nouveau document</p>
                <button type="button" onClick={resetDocForm} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">Titre *</Label>
                <Input
                  value={docTitre}
                  onChange={(e) => setDocTitre(e.target.value)}
                  placeholder="Ex : Résultats d'analyse"
                  className="h-9 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">Note (optionnelle)</Label>
                <Input
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  placeholder="Remarque, contexte…"
                  className="h-9 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">Fichier (image ou PDF) *</Label>
                <input
                  ref={docFileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-slate-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-zinc-800 file:text-slate-700 dark:file:text-zinc-300 hover:file:bg-slate-200 dark:hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={resetDocForm}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={loadingDoc} className="h-8 text-xs bg-brand hover:bg-brand-dark text-white">
                  {loadingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ajouter'}
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddDoc(true)}
              className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter un document
            </button>
          ))}
        </div>
      )}

      {/* ── Footer : ajouter une sous-consultation ── */}
      {!enr.parentId && statut !== 'TERMINEE' && (
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30">
          <Link
            href={`/patients/${enr.patientId}/modules/${enr.specialiteId}/${enr.id}/sous-consultation`}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand font-medium transition-colors"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            Ajouter une sous-consultation
          </Link>
        </div>
      )}

    </Card>

    {/* ── Fil de sous-consultations ── */}
    {enr.sousConsultations.length > 0 && (
      <div className="ml-5 pl-4 border-l-2 border-slate-200 dark:border-zinc-700 space-y-3 mt-2">
        {enr.sousConsultations.map((sub) => (
          <ConsultationCard key={sub.id} enr={sub} />
        ))}
      </div>
    )}

    </div>
  )
}
