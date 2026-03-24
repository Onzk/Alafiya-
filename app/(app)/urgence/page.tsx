'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Loader2, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type Etape = 'recherche' | 'confirmation' | 'justification'

interface PatientResult {
  id: string
  nom: string
  prenoms: string
  genre: string
  dateNaissance: string
  dateNaissancePresumee: boolean
  dossierId: string | null
}

export default function UrgencePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [etape, setEtape] = useState<Etape>('recherche')
  const [loading, setLoading] = useState(false)

  // Recherche
  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [genre, setGenre] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [resultats, setResultats] = useState<PatientResult[]>([])

  // Patient sélectionné
  const [patient, setPatient] = useState<PatientResult | null>(null)

  // Justification
  const [justification, setJustification] = useState('')

  async function rechercherPatient(e: React.FormEvent) {
    e.preventDefault()
    if (nom.trim().length < 2) return
    setLoading(true)

    const params = new URLSearchParams({ nom: nom.trim() })
    if (prenoms.trim()) params.set('prenoms', prenoms.trim())
    if (genre) params.set('genre', genre)
    if (dateNaissance) params.set('dateNaissance', dateNaissance)

    const res = await fetch(`/api/urgence/recherche?${params}`)
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || 'Erreur lors de la recherche.', variant: 'destructive' })
      return
    }

    if (data.patients.length === 0) {
      toast({ description: 'Aucun patient trouvé avec ces informations.', variant: 'destructive' })
      return
    }

    setResultats(data.patients)
    setEtape('confirmation')
  }

  function selectionnerPatient(p: PatientResult) {
    if (!p.dossierId) {
      toast({ description: 'Ce patient n\'a pas de dossier médical.', variant: 'destructive' })
      return
    }
    setPatient(p)
    setEtape('justification')
  }

  async function activerUrgence(e: React.FormEvent) {
    e.preventDefault()
    if (!patient || !patient.dossierId) return
    setLoading(true)

    const res = await fetch('/api/urgence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id, dossierId: patient.dossierId, justification }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || "Erreur lors de l'activation du mode urgence.", variant: 'destructive' })
      return
    }

    router.push(`/patients/${patient.id}?urgence=true`)
  }

  function formatDate(iso: string, presumee: boolean) {
    const d = new Date(iso)
    const str = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    return presumee ? `~${str}` : str
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center gap-3">
        {/* {etape === 'recherche' ? (
          <Link href="/scanner">
            <Button variant="ghost" size="sm" className="rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            onClick={() => setEtape(etape === 'justification' ? 'confirmation' : 'recherche')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        )} */}
        <div>
          <h1 className="text-xl font-extrabold text-red-600 dark:text-red-400 leading-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Mode Urgence
          </h1>
        </div>
      </div>

      {/* Avertissement */}
      <div className="dash-in delay-75 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-sm text-red-700 dark:text-red-300">
        <p className="font-semibold mb-1">Attention — Accès sans consentement</p>
        <p className="leading-relaxed text-red-600 dark:text-red-400">
          Le mode urgence permet d&apos;accéder à l&apos;intégralité du dossier médical du patient sans
          validation préalable. Il est réservé aux situations où la vie du patient est en danger.
          La personne de contact sera notifiée par SMS. Toute activation est tracée.
        </p>
      </div>

      {/* Étape 1 : Recherche du patient */}
      {etape === 'recherche' && (
        <form onSubmit={rechercherPatient} className="dash-in delay-150">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
                <Search className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Identifier le patient</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nom" className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Nom *</Label>
                  <input
                    id="nom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="KONÉ"
                    required
                    minLength={2}
                    className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prenoms" className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Prénoms</Label>
                  <input
                    id="prenoms"
                    type="text"
                    value={prenoms}
                    onChange={(e) => setPrenoms(e.target.value)}
                    placeholder="Aminata"
                    className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="genre" className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Genre</Label>
                  <select
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Tous</option>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateNaissance" className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Date de naissance</Label>
                  <input
                    id="dateNaissance"
                    type="date"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    className="w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || nom.trim().length < 2}
                className="w-full bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Rechercher
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Étape 2 : Confirmation du patient */}
      {etape === 'confirmation' && (
        <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Sélectionner le patient</h2>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">{resultats.length} résultat{resultats.length > 1 ? 's' : ''} trouvé{resultats.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-zinc-800">
            {resultats.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectionnerPatient(p)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand font-bold text-sm">{p.nom[0]}{p.prenoms[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{p.nom.toUpperCase()} {p.prenoms}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    {p.genre === 'M' ? 'Homme' : 'Femme'} · {formatDate(p.dateNaissance, p.dateNaissancePresumee)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 3 : Justification */}
      {etape === 'justification' && patient && (
        <>
          {/* Patient sélectionné */}
          <div className="dash-in delay-75 bg-brand/5 dark:bg-brand/10 border border-brand/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0">
              <span className="text-brand font-bold text-sm">{patient.nom[0]}{patient.prenoms[0]}</span>
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{patient.nom.toUpperCase()} {patient.prenoms}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                {patient.genre === 'M' ? 'Homme' : 'Femme'} · {formatDate(patient.dateNaissance, patient.dateNaissancePresumee)}
              </p>
            </div>
          </div>

          <form onSubmit={activerUrgence} className="dash-in delay-150">
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Justification obligatoire</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">Minimum 20 caractères</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="justification" className="text-slate-700 dark:text-zinc-300 text-sm font-medium">
                    Décrivez précisément la situation d&apos;urgence *
                  </Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Ex: Patient inconscient suite à un traumatisme, suspicion d'allergie grave, état critique nécessitant une anamnèse immédiate..."
                    rows={5}
                    required
                    minLength={20}
                    className="border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-red-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full font-bold py-3 rounded-xl"
                  disabled={loading || justification.length < 20}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Activation en cours...</>
                  ) : (
                    <><AlertTriangle className="mr-2 h-5 w-5" />ACTIVER LE MODE URGENCE</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}

    </div>
  )
}
