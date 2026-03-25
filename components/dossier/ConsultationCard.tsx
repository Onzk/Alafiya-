'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, FlaskConical, Pill, CalendarCheck,
  FileText, ScrollText, Plus, Trash2, ExternalLink,
  Loader2, X, ChevronDown, Paperclip,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export type ConsultationData = {
  id: string
  jour: string
  heure: string
  genereParIA: boolean
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

// ─── Composant principal ──────────────────────────────────────────────────────

export function ConsultationCard({ enr }: { enr: ConsultationData }) {
  const router = useRouter()
  const { toast } = useToast()

  const [expanded, setExpanded] = useState(
    enr.documents.length > 0 || enr.ordonnances.length > 0,
  )
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [showAddOrd, setShowAddOrd] = useState(false)

  // États formulaire document
  const [docTitre,  setDocTitre]  = useState('')
  const [docNote,   setDocNote]   = useState('')
  const [docFile,   setDocFile]   = useState<File | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)

  // États formulaire ordonnance
  const [ordTitre,   setOrdTitre]   = useState('')
  const [ordTexte,   setOrdTexte]   = useState('')
  const [ordFile,    setOrdFile]    = useState<File | null>(null)
  const [loadingOrd, setLoadingOrd] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const docFileRef = useRef<HTMLInputElement>(null)
  const ordFileRef = useRef<HTMLInputElement>(null)

  const totalPieceJointes = enr.documents.length + enr.ordonnances.length

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

    if (!res.ok) {
      toast({ description: data.error || 'Erreur lors de l\'ajout.', variant: 'destructive' })
      return
    }
    toast({ description: 'Document ajouté.' })
    resetDocForm()
    router.refresh()
  }

  // ── Soumission ordonnance ─────────────────────────────────────────────────

  async function handleAddOrd(e: React.FormEvent) {
    e.preventDefault()
    if (!ordTexte.trim() && !ordFile) {
      toast({ description: "L'ordonnance doit contenir un texte ou un fichier.", variant: 'destructive' })
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

    if (!res.ok) {
      toast({ description: data.error || 'Erreur lors de l\'ajout.', variant: 'destructive' })
      return
    }
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

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-zinc-800 shadow-sm">

      {/* Header */}
      <ConsultationCardHeader
        jour={enr.jour}
        heure={enr.heure}
        genereParIA={enr.genereParIA}
        medecin={enr.medecin}
        centre={enr.centre}
      />

      {/* Corps médical */}
      <CardContent className="p-4 grid gap-4 sm:grid-cols-2">
        {enr.antecedents && <Section icon={ClipboardList} color="blue" label="Antécédents" value={enr.antecedents} />}
        {enr.signes && <Section icon={ClipboardList} color="blue" label="Signes & Symptômes" value={enr.signes} />}
        {enr.examens && <Section icon={FlaskConical} color="violet" label="Examens" value={enr.examens} />}
        {enr.bilan && <Section icon={FlaskConical} color="violet" label="Bilan" value={enr.bilan} />}
        {enr.traitConseils && <Section icon={Pill} color="emerald" label="Conseils" value={enr.traitConseils} />}
        {enr.traitInjections && <Section icon={Pill} color="emerald" label="Injections" value={enr.traitInjections} />}
        {enr.traitOrdonnance && (
          <Section icon={Pill} color="emerald" label="Ordonnance" value={enr.traitOrdonnance} className="sm:col-span-2" />
        )}
        {enr.suivi && <Section icon={CalendarCheck} color="orange" label="Suivi" value={enr.suivi} className="sm:col-span-2" />}
      </CardContent>

      {/* ── Pièces jointes (documents + ordonnances) ── */}
      <div className="border-t border-slate-100 dark:border-zinc-800">

        {/* Toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Pièces jointes
            {totalPieceJointes > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-[10px] font-bold">
                {totalPieceJointes}
              </span>
            )}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', expanded && 'rotate-180')} />
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-4">

            {/* ── Documents ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Documents ({enr.documents.length})
                </p>
                {!showAddDoc && (
                  <button
                    type="button"
                    onClick={() => { setShowAddDoc(true); setShowAddOrd(false) }}
                    className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter
                  </button>
                )}
              </div>

              {/* Liste documents */}
              {enr.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 group"
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
                  </div>
                </div>
              ))}

              {/* Formulaire ajout document */}
              {showAddDoc && (
                <form onSubmit={handleAddDoc} className="space-y-2.5 p-3 rounded-lg border border-brand/30 dark:border-brand/20 bg-brand/5 dark:bg-brand/5">
                  <div className="flex items-center justify-between mb-1">
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
              )}
            </div>

            {/* ── Ordonnances ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <ScrollText className="h-3.5 w-3.5" />
                  Ordonnances ({enr.ordonnances.length})
                </p>
                {!showAddOrd && (
                  <button
                    type="button"
                    onClick={() => { setShowAddOrd(true); setShowAddDoc(false) }}
                    className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter
                  </button>
                )}
              </div>

              {/* Liste ordonnances */}
              {enr.ordonnances.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800"
                >
                  <ScrollText className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {ord.titre && (
                      <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-tight">{ord.titre}</p>
                    )}
                    {ord.texte && (
                      <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed whitespace-pre-wrap">{ord.texte}</p>
                    )}
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
                  </div>
                </div>
              ))}

              {/* Formulaire ajout ordonnance */}
              {showAddOrd && (
                <form onSubmit={handleAddOrd} className="space-y-2.5 p-3 rounded-lg border border-emerald-300/50 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/10">
                  <div className="flex items-center justify-between mb-1">
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
                      placeholder="Ex : Ordonnance Amoxicilline"
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-zinc-400">Texte de l&apos;ordonnance</Label>
                    <textarea
                      value={ordTexte}
                      onChange={(e) => setOrdTexte(e.target.value)}
                      placeholder="Médicaments prescrits, posologie, durée…"
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-zinc-400">Fichier (image ou PDF) — optionnel si texte renseigné</Label>
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
              )}
            </div>

          </div>
        )}
      </div>

    </Card>
  )
}
