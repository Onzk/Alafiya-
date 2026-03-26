'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  AlertTriangle, Search, ChevronLeft, ChevronRight,
  Loader2, User, ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { calculerAge } from '@/lib/utils'

interface PatientResult {
  id: string
  nom: string
  prenoms: string
  genre: string
  dateNaissance: string
  dateNaissancePresumee: boolean
  photo: string | null
  dossierId: string | null
}

interface FormData {
  nom: string
  prenoms: string
  genre: string
  telephoneContact: string
  justification: string
  signatureMedecin: string
  signatureContact: string | null
}

export default function UrgenceResultatsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData | null>(null)
  const [patients, setPatients] = useState<PatientResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)

  // Critères modifiables
  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [genre, setGenre] = useState('all')
  const [telephoneContact, setTelephoneContact] = useState('')

  // Confirmation
  const [patientChoisi, setPatientChoisi] = useState<PatientResult | null>(null)

  const fetchPatients = useCallback(async (criteres: {
    nom: string; prenoms: string; genre: string; telephoneContact: string
  }, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (criteres.nom.trim()) params.set('nom', criteres.nom.trim())
    if (criteres.prenoms.trim()) params.set('prenoms', criteres.prenoms.trim())
    if (criteres.genre && criteres.genre !== 'all') params.set('genre', criteres.genre)
    if (criteres.telephoneContact.trim()) params.set('telephone', criteres.telephoneContact.trim())

    const res = await fetch(`/api/urgence/recherche?${params}`)
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || 'Erreur lors de la recherche.', variant: 'destructive' })
      return
    }
    setPatients(data.patients)
    setTotal(data.total)
    setPage(data.page)
  }, [toast])

  useEffect(() => {
    const raw = sessionStorage.getItem('urgence_form')
    if (!raw) { router.replace('/urgence'); return }
    const form: FormData = JSON.parse(raw)
    setFormData(form)
    setNom(form.nom)
    setPrenoms(form.prenoms)
    setGenre(form.genre || 'all')
    setTelephoneContact(form.telephoneContact)
    fetchPatients(form, 1)
  }, [router, fetchPatients])

  function rechercherAvecCriteres(e: React.FormEvent) {
    e.preventDefault()
    fetchPatients({ nom, prenoms, genre, telephoneContact }, 1)
  }

  function changerPage(nouvelleP: number) {
    fetchPatients({ nom, prenoms, genre, telephoneContact }, nouvelleP)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function activerUrgence() {
    if (!patientChoisi || !patientChoisi.dossierId || !formData) return
    setActivating(true)

    const res = await fetch('/api/urgence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patientChoisi.id,
        dossierId: patientChoisi.dossierId,
        justification: formData.justification,
        signatureMedecin: formData.signatureMedecin,
        justifieParTel: formData.telephoneContact || null,
        justifieParSignature: formData.signatureContact || null,
        justifieParType: formData.telephoneContact ? 'PERSONNE_URGENCE' : null,
      }),
    })

    const data = await res.json()
    setActivating(false)

    if (!res.ok) {
      toast({ description: data.error || "Erreur lors de l'activation.", variant: 'destructive' })
      return
    }

    sessionStorage.removeItem('urgence_form')
    router.push(`/patients/${patientChoisi.id}?urgence=true`)
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <h1 className="text-xl font-extrabold text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Mode Urgence — Sélection du patient
        </h1>
      </div>

      {/* Critères modifiables */}
      <form
        onSubmit={rechercherAvecCriteres}
        className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Affiner la recherche</span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500 dark:text-zinc-400">Nom</Label>
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="KONÉ"
              className="h-8 text-xs rounded-lg focus-visible:ring-red-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500 dark:text-zinc-400">Prénoms</Label>
            <Input
              value={prenoms}
              onChange={(e) => setPrenoms(e.target.value)}
              placeholder="Aminata"
              className="h-8 text-xs rounded-lg focus-visible:ring-red-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500 dark:text-zinc-400">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="h-8 text-xs rounded-lg focus:ring-red-500">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="M">Homme</SelectItem>
                <SelectItem value="F">Femme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500 dark:text-zinc-400">Tél. contact</Label>
            <Input
              type="tel"
              value={telephoneContact}
              onChange={(e) => setTelephoneContact(e.target.value)}
              placeholder="+228..."
              className="h-8 text-xs rounded-lg focus-visible:ring-red-500"
            />
          </div>
        </div>
        <div className="px-4 pb-4">
          <Button type="submit" size="sm" variant="destructive" disabled={loading} className="rounded-lg">
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1.5 h-3.5 w-3.5" />}
            Actualiser
          </Button>
        </div>
      </form>

      {/* Résultats */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-zinc-600">
          <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun patient trouvé avec ces critères</p>
        </div>
      ) : (
        <>
          <div className="dash-in delay-150">
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">
              {total} patient{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''} — page {page} sur {totalPages}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
              {patients.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  onClick={() => p.dossierId ? setPatientChoisi(p) : undefined}
                />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => changerPage(page - 1)}
                className="rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => changerPage(page + 1)}
                className="rounded-lg"
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={!!patientChoisi} onOpenChange={(v) => { if (!v) setPatientChoisi(null) }}>
        <DialogContent className="md:max-w-md">
          <DialogHeader
            icon={ShieldAlert}
            title="Confirmer l'accès urgence"
            description="Cet accès sera tracé et les personnes à prévenir notifiées par SMS."
          />
          {patientChoisi && (
            <>
              <DialogBody className="space-y-4">
                <div className="flex items-center gap-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                    {patientChoisi.photo ? (
                      <Image
                        src={patientChoisi.photo}
                        alt={patientChoisi.nom}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-slate-400 dark:text-zinc-500">
                        {patientChoisi.nom[0]}{patientChoisi.prenoms[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {patientChoisi.nom.toUpperCase()} {patientChoisi.prenoms}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {patientChoisi.genre === 'M' ? 'Homme' : 'Femme'} ·{' '}
                      {calculerAge(new Date(patientChoisi.dateNaissance))} ans
                      {patientChoisi.dateNaissancePresumee && ' (présumé)'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2 leading-relaxed">
                  En confirmant, vous accédez à l&apos;intégralité du dossier médical pendant <strong>1 heure</strong>.
                  Cette action est irréversible et sera enregistrée.
                </p>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPatientChoisi(null)}
                  disabled={activating}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={activerUrgence}
                  disabled={activating}
                  className="font-bold"
                >
                  {activating
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Activation...</>
                    : <><AlertTriangle className="mr-2 h-4 w-4" />CONFIRMER L&apos;ACCÈS</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}

function PatientCard({ patient, onClick }: { patient: PatientResult; onClick: () => void }) {
  const age = calculerAge(new Date(patient.dateNaissance))
  const sansDossier = !patient.dossierId

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={sansDossier}
      className={`group flex flex-col rounded-2xl overflow-hidden border text-left transition-all ${
        sansDossier
          ? 'border-slate-100 dark:border-zinc-800 opacity-50 cursor-not-allowed'
          : 'border-slate-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md hover:shadow-red-500/10 active:scale-95 cursor-pointer'
      } bg-white dark:bg-zinc-950`}
    >
      {/* Photo */}
      <div className="w-full aspect-square bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
        {patient.photo ? (
          <Image
            src={patient.photo}
            alt={patient.nom}
            width={200}
            height={200}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-slate-300 dark:text-zinc-600">
            {patient.nom[0]}{patient.prenoms[0]}
          </span>
        )}
      </div>
      {/* Infos */}
      <div className="p-2.5 space-y-0.5">
        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
          {patient.nom.toUpperCase()}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{patient.prenoms}</p>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
          {patient.genre === 'M' ? 'H' : 'F'} · {age} ans
        </p>
        {sansDossier && (
          <p className="text-[10px] text-red-400 font-medium">Sans dossier</p>
        )}
      </div>
    </button>
  )
}
