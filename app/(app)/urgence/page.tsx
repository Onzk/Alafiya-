'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ArrowRight, Search, Phone, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SignaturePad } from '@/components/ui/SignaturePad'

export default function UrgencePage() {
  const router = useRouter()

  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [genre, setGenre] = useState('')
  const [telephoneContact, setTelephoneContact] = useState('')
  const [justification, setJustification] = useState('')
  const [signatureMedecin, setSignatureMedecin] = useState<string | null>(null)
  const [signatureContact, setSignatureContact] = useState<string | null>(null)
  const [erreur, setErreur] = useState('')

  const contactRequiert = telephoneContact.trim().length > 0
  const valide =
    genre !== '' &&
    justification.trim().length >= 10 &&
    signatureMedecin !== null &&
    (!contactRequiert || signatureContact !== null)

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    if (!valide) {
      setErreur(
        !genre ? 'Le genre est obligatoire.' :
        justification.trim().length < 10 ? 'Le motif doit faire au moins 10 caractères.' :
        !signatureMedecin ? 'La signature du personnel est obligatoire.' :
        'La signature de la personne à prévenir est obligatoire.'
      )
      return
    }
    setErreur('')
    sessionStorage.setItem('urgence_form', JSON.stringify({
      nom, prenoms, genre, telephoneContact,
      justification,
      signatureMedecin,
      signatureContact: contactRequiert ? signatureContact : null,
    }))
    router.push('/urgence/resultats')
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center gap-3">
        <Link href="/scanner">
          <Button variant="ghost" size="sm" className="rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <h1 className="text-xl font-extrabold text-red-600 dark:text-red-400 leading-tight flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Mode Urgence
        </h1>
      </div>

      {/* Avertissement */}
      <div className="dash-in delay-75 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-sm text-red-700 dark:text-red-300">
        <p className="font-semibold mb-1">Attention — Accès sans consentement</p>
        <p className="leading-relaxed text-red-600 dark:text-red-400">
          Le mode urgence permet d&apos;accéder à l&apos;intégralité du dossier médical sans validation préalable.
          Il est réservé aux situations où la vie du patient est en danger.
          Les personnes à prévenir seront notifiées par SMS. Toute activation est tracée.
        </p>
      </div>

      <form onSubmit={soumettre} className="space-y-4 dash-in delay-150">

        {/* Identification */}
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
                <Label className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Nom</Label>
                <Input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="KONÉ"
                  className="rounded-xl focus-visible:ring-red-500 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Prénoms</Label>
                <Input
                  value={prenoms}
                  onChange={(e) => setPrenoms(e.target.value)}
                  placeholder="Aminata"
                  className="rounded-xl focus-visible:ring-red-500 h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-zinc-300 text-sm font-medium">
                Genre <span className="text-red-500">*</span>
              </Label>
              <Select value={genre} onValueChange={setGenre} required>
                <SelectTrigger className="rounded-xl focus:ring-red-500 h-10">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Homme</SelectItem>
                  <SelectItem value="F">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-zinc-300 text-sm font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Tél. d&apos;une personne à prévenir
              </Label>
              <Input
                type="tel"
                value={telephoneContact}
                onChange={(e) => { setTelephoneContact(e.target.value); setSignatureContact(null) }}
                placeholder="+228 90 00 00 00"
                className="rounded-xl focus-visible:ring-red-500 h-10"
              />
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Si renseigné, la signature de cette personne est requise.
              </p>
            </div>
          </div>
        </div>

        {/* Motif */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              Motif de l&apos;accès urgence <span className="text-red-500">*</span>
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">Minimum 10 caractères</p>
          </div>
          <div className="p-5">
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex : Patient inconscient, traumatisme crânien, allergie grave connue..."
              rows={3}
              required
              minLength={10}
              className="border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-red-500 resize-none"
            />
          </div>
        </div>

        {/* Signature du personnel */}
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
              <PenLine className="h-3.5 w-3.5 text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                Signature du personnel <span className="text-red-500">*</span>
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">J&apos;atteste être en situation d&apos;urgence médicale</p>
            </div>
          </div>
          <div className="p-5">
            <SignaturePad onChange={setSignatureMedecin} value={signatureMedecin} required />
          </div>
        </div>

        {/* Signature de la personne à prévenir */}
        {contactRequiert && (
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <PenLine className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Signature de la personne à prévenir <span className="text-red-500">*</span>
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">{telephoneContact}</p>
              </div>
            </div>
            <div className="p-5">
              <SignaturePad onChange={setSignatureContact} value={signatureContact} required />
            </div>
          </div>
        )}

        {erreur && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 px-3 py-2 rounded-lg">
            {erreur}
          </p>
        )}

        <Button
          type="submit"
          variant="destructive"
          className="w-full font-bold py-3 rounded-xl"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Rechercher un patient
        </Button>

      </form>
    </div>
  )
}
