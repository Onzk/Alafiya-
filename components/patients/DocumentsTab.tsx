'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Plus, Trash2, X, Upload, FileText, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type TypeDocId = 'CNI' | 'PASSEPORT' | 'CNSS' | 'EID_ANID'

const TYPE_LABELS: Record<TypeDocId, string> = {
  CNI:       'Carte Nationale d\'Identité',
  PASSEPORT: 'Passeport',
  CNSS:      'Carte CNSS',
  EID_ANID:  'E-ID (ANID)',
}

type DocIdentification = {
  id: string
  type: TypeDocId
  numero: string
  fichier: string
  createdAt: string
}

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
  const [identification, setIdentification] = useState<DocIdentification[]>([])
  const [documents, setDocuments] = useState<DocPatient[]>([])
  const [loading, setLoading] = useState(true)

  // Modales
  const [modalId, setModalId]       = useState<{ type: TypeDocId } | null>(null)
  const [modalDoc, setModalDoc]     = useState(false)
  const [lightbox, setLightbox]     = useState<string | null>(null)

  async function charger() {
    setLoading(true)
    const res = await fetch(`/api/patients/${patientId}/documents`)
    if (res.ok) {
      const data = await res.json()
      setIdentification(data.identification)
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

  const allTypes: TypeDocId[] = ['CNI', 'PASSEPORT', 'CNSS', 'EID_ANID']

  return (
    <div className="space-y-8">

      {/* ── Documents d'identification ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand" />
            <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-sm">Documents d'identification</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {allTypes.map((type) => {
              const doc = identification.find(d => d.type === type)
              return (
                <DocIdCard
                  key={type}
                  type={type}
                  doc={doc}
                  onAdd={() => setModalId({ type })}
                  onDelete={async (id) => {
                    await fetch(`/api/patients/${patientId}/documents/identification/${id}`, { method: 'DELETE' })
                    charger()
                  }}
                  onPreview={(url) => setLightbox(url)}
                />
              )
            })}
          </div>
        )}
      </section>

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

      {/* ── Modale ajout document d'identification ── */}
      {modalId && (
        <ModalDocId
          patientId={patientId}
          type={modalId.type}
          onClose={() => setModalId(null)}
          onSuccess={() => { setModalId(null); charger() }}
        />
      )}

      {/* ── Modale ajout document patient ── */}
      {modalDoc && (
        <ModalDocPatient
          patientId={patientId}
          onClose={() => setModalDoc(false)}
          onSuccess={() => { setModalDoc(false); charger() }}
        />
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Document"
            className="max-h-[90vh] max-w-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ─── Card document d'identification ──────────────────────────────────────────

function DocIdCard({
  type, doc, onAdd, onDelete, onPreview,
}: {
  type: TypeDocId
  doc?: DocIdentification
  onAdd: () => void
  onDelete: (id: string) => void
  onPreview: (url: string) => void
}) {
  const [confirmer, setConfirmer] = useState(false)

  if (!doc) {
    return (
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 hover:border-brand hover:text-brand dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span className="text-xs font-medium">{TYPE_LABELS[type]}</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Image */}
      <button
        className="block w-full h-32 bg-slate-50 dark:bg-zinc-900 overflow-hidden hover:opacity-90 transition-opacity"
        onClick={() => onPreview(doc.fichier)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={doc.fichier} alt={TYPE_LABELS[type]} className="h-full w-full object-cover" />
      </button>

      {/* Infos */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand truncate">{TYPE_LABELS[type]}</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">{doc.numero}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={onAdd} className="h-7 px-2 text-xs rounded-lg">
            Modifier
          </Button>
          {confirmer ? (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="destructive" onClick={() => onDelete(doc.id)} className="h-7 px-2 text-xs rounded-lg">
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

// ─── Modale ajout document d'identification ───────────────────────────────────

function ModalDocId({
  patientId, type, onClose, onSuccess,
}: {
  patientId: string
  type: TypeDocId
  onClose: () => void
  onSuccess: () => void
}) {
  const [numero, setNumero]   = useState('')
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
    fd.append('type', type)
    fd.append('numero', numero)
    fd.append('fichier', fichier)

    const res = await fetch(`/api/patients/${patientId}/documents/identification`, { method: 'POST', body: fd })
    if (res.ok) {
      onSuccess()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur lors de l\'enregistrement.')
    }
    setLoading(false)
  }

  return (
    <Modale titre={`${TYPE_LABELS[type]}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Numéro / Identifiant <span className="text-red-500">*</span>
          </label>
          <input
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder={`Ex : ${type === 'CNI' ? 'GN-123456789' : type === 'PASSEPORT' ? 'A1234567' : '00-000-000'}`}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Photo du document <span className="text-red-500">*</span>
          </label>
          <ZoneUpload
            preview={preview}
            inputRef={inputRef}
            onChange={handleFichier}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button type="submit" disabled={loading} className="rounded-xl bg-brand hover:bg-brand-dark text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modale>
  )
}

// ─── Modale ajout document patient ───────────────────────────────────────────

function ModalDocPatient({
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
    <Modale titre="Ajouter un document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Ex : Résultats d'analyse, Radiographie..."
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Note (optionnelle)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Contexte, date de l'examen, médecin prescripteur..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
            Image du document <span className="text-red-500">*</span>
          </label>
          <ZoneUpload
            preview={preview}
            inputRef={inputRef}
            onChange={handleFichier}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button type="submit" disabled={loading} className="rounded-xl bg-brand hover:bg-brand-dark text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modale>
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
        'relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden',
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
          <p className="text-xs text-center px-4">Cliquez ou déposez une image ici<br /><span className="text-[11px]">JPG, PNG, WEBP — max 10 Mo</span></p>
        </div>
      )}
    </div>
  )
}

// ─── Wrapper modale ───────────────────────────────────────────────────────────

function Modale({ titre, onClose, children }: { titre: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h2 className="font-bold text-slate-900 dark:text-white">{titre}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
