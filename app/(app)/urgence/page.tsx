'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function UrgencePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')
  const dossierId = searchParams.get('dossierId')

  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleUrgence(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !dossierId) return
    setLoading(true)
    setErreur('')

    const res = await fetch('/api/urgence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, dossierId, justification }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErreur(data.error || 'Erreur lors de l\'activation du mode urgence.')
      return
    }

    router.push(`/patients/${patientId}?urgence=true`)
  }

  if (!patientId || !dossierId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="dash-in delay-0 h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-400/15 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="h-7 w-7 text-orange-500 dark:text-orange-400" />
        </div>
        <p className="dash-in delay-75 text-sm font-semibold text-slate-600 dark:text-zinc-300 mb-1">Paramètres manquants</p>
        <p className="dash-in delay-150 text-sm text-slate-400 dark:text-zinc-500 mb-4">Accédez au mode urgence via le scanner QR.</p>
        <div className="dash-in delay-225">
          <Link href="/scanner">
            <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl">Aller au scanner</Button>
          </Link>
        </div>
      </div>
    )
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

      {erreur && (
        <div className="dash-in delay-0 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}

      <form onSubmit={handleUrgence} className="dash-in delay-150">
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
                className="border-slate-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 resize-none"
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
    </div>
  )
}
