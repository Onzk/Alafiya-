'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
        <p className="text-gray-600">Paramètres manquants. Accédez via le scanner QR.</p>
        <Link href="/scanner" className="mt-4 inline-block text-green-600 hover:underline text-sm">
          Aller au scanner
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/scanner">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Mode Urgence
          </h1>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        <p className="font-semibold mb-1">Attention — Accès sans consentement</p>
        <p>
          Le mode urgence permet d'accéder à l'intégralité du dossier médical du patient sans
          validation préalable. Il est réservé aux situations où la vie du patient est en danger.
          La personne de contact sera notifiée par SMS. Toute activation est tracée.
        </p>
      </div>

      {erreur && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {erreur}
        </div>
      )}

      <form onSubmit={handleUrgence}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Justification obligatoire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="justification">
                Décrivez précisément la situation d'urgence *
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Patient inconscient suite à un traumatisme, suspicion d'allergie grave, état critique nécessitant une anamnèse immédiate..."
                rows={5}
                required
                minLength={20}
              />
              <p className="text-xs text-gray-400">Minimum 20 caractères</p>
            </div>

            <Button
              type="submit"
              variant="destructive"
              className="w-full text-base font-bold py-3"
              disabled={loading || justification.length < 20}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activation en cours...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  ACTIVER LE MODE URGENCE
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
