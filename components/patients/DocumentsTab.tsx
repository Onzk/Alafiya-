'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, Upload, FileText, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

// ─── Types ───────────────────────────────────────────────────────────────────

type DocPatient = {
  id: string
  titre: string
  note: string | null
  fichier: string
  createdAt: string
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function DocumentsTab({
  patientId,
  accesValide,
}: {
  patientId: string
  accesValide: boolean
}) {
  const [documents, setDocuments] = useState<DocPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [modalDoc, setModalDoc] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  async function charger() {
    setLoading(true)
    const res = await fetch(`/api/patients/${patientId}/documents`)
    if (res.ok) {
      const data = await res.json()
      setDocuments(data.documents)
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!accesValide) {
    return (
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-xl p-5 text-sm text-orange-800 dark:text-orange-300 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">Accès non autorisé</p>
          <p>Scannez le QR code du patient pour accéder aux documents.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ── Documents patient ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-sm">Documents médicaux & autres</h3>
          </div>
          <Button size="sm" onClick={() => setModalDoc(true)} className="h-8 bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
              Aucun document enregistré.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <DocPatientCard
                key={doc.id}
                doc={doc}
                onDelete={async () => {
                  await fetch(`/api/patients/${patientId}/documents/patient/${doc.id}`, { method: 'DELETE' })
                  charger()
                }}
                onPreview={(url) => setLightbox(url)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Dialog ajout document patient ── */}
      <Dialog open={modalDoc} onOpenChange={setModalDoc}>
        <DialogContent>
          <DialogHeader title="Ajouter un document" description='Lettres ou autres pièces globales du patient.' icon={FileText} />
          <ModalDocPatientForm
            patientId={patientId}
            onClose={() => setModalDoc(false)}
            onSuccess={() => { setModalDoc(false); charger() }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Lightbox ── */}
      <Dialog open={!!lightbox} onOpenChange={(open) => { if (!open) setLightbox(null) }}>
        <DialogContent className="max-w-3xl w-[calc(100%-2rem)] p-2 bg-zinc-950 border-zinc-800">
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox}
              alt="Document"
              className="max-h-[85vh] w-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Card document patient ────────────────────────────────────────────────────

function DocPatientCard({
  doc, onDelete, onPreview,
}: {
  doc: DocPatient
  onDelete: () => void
  onPreview: (url: string) => void
}) {
  const [confirmer, setConfirmer] = useState(false)

  return (
    <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <button
        className="block w-full h-36 bg-slate-50 dark:bg-zinc-900 overflow-hidden hover:opacity-90 transition-opacity"
        onClick={() => onPreview(doc.fichier)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={doc.fichier} alt={doc.titre} className="h-full w-full object-cover" />
      </button>

      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">{doc.titre}</p>
            {doc.note && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 line-clamp-2">{doc.note}</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {confirmer ? (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="destructive" onClick={onDelete} className="h-7 px-2 text-xs rounded-lg">
                  Oui
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmer(false)} className="h-7 px-2 text-xs rounded-lg">
                  Non
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setConfirmer(true)} className="h-7 px-2 rounded-lg border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Formulaire ajout document patient ───────────────────────────────────────

function ModalDocPatientForm({
  patientId, onClose, onSuccess,
}: {
  patientId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [titre, setTitre]     = useState('')
  const [note, setNote]       = useState('')
  const [fichier, setFichier] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFichier(file: File) {
    setFichier(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fichier) { setError('Veuillez sélectionner une image.'); return }
    setLoading(true)
    setError('')

    const fd = new FormData()
    fd.append('titre', titre)
    fd.append('note', note)
    fd.append('fichier', fichier)

    const res = await fetch(`/api/patients/${patientId}/documents/patient`, { method: 'POST', body: fd })
    if (res.ok) {
      onSuccess()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur lors de l\'enregistrement.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogBody>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <Input
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Ex : Résultats d'analyse, Radiographie..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Note (optionnelle)
          </label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Contexte, date de l'examen, médecin prescripteur..."
            rows={2}
            className="dark:bg-zinc-950"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Image du document <span className="text-red-500">*</span>
          </label>
          <ZoneUpload preview={preview} inputRef={inputRef} onChange={handleFichier} />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </DialogBody>

      <DialogFooter className='dark:bg-transparent border-none'>
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="rounded-xl w-full bg-brand hover:bg-brand-dark text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Zone d'upload image ──────────────────────────────────────────────────────

function ZoneUpload({
  preview, inputRef, onChange,
}: {
  preview: string | null
  inputRef: React.RefObject<HTMLInputElement>
  onChange: (f: File) => void
}) {
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onChange(file)
  }

  return (
    <div
      className={cn(
        'relative rounded-md border-2 border-dashed transition-colors cursor-pointer overflow-hidden',
        preview ? 'border-brand/30' : 'border-slate-200 dark:border-zinc-700 hover:border-brand dark:hover:border-emerald-600',
      )}
      style={{ minHeight: '120px' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f) }}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Aperçu" className="w-full h-40 object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 h-28 text-slate-400 dark:text-zinc-500">
          <Upload className="h-6 w-6" />
          <p className="text-xs text-center px-4">
            Cliquez ou déposez une image ici<br />
            <span className="text-[11px]">JPG, PNG, WEBP — max 10 Mo</span>
          </p>
        </div>
      )}
    </div>
  )
}
