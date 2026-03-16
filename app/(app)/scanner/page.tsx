'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrCode, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QRScanner } from '@/components/qrcode/QRScanner'

type Etape = 'scan' | 'chargement' | 'acces'

interface PatientInfo {
  id: string
  nom: string
  prenoms: string
  genre: string
  aTelephone: boolean
  dossierId: string
}

export default function ScannerPage() {
  const router = useRouter()
  const [etape, setEtape] = useState<Etape>('scan')
  const [patient, setPatient] = useState<PatientInfo | null>(null)
  const [erreur, setErreur] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpEnvoye, setOtpEnvoye] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleScan = useCallback(async (qrText: string) => {
    setEtape('chargement')
    setErreur('')

    // Extraire le token depuis l'URL ou utiliser le texte directement
    let token = qrText
    try {
      const url = new URL(qrText)
      token = url.searchParams.get('token') || qrText
    } catch {}

    const res = await fetch(`/api/qrcode/scan?token=${token}`)
    const data = await res.json()

    if (!res.ok) {
      setErreur(data.error || 'Patient introuvable.')
      setEtape('scan')
      return
    }

    setPatient(data.patient)
    setEtape('acces')
  }, [])

  async function envoyerOTP() {
    if (!patient) return
    setLoading(true)
    setErreur('')

    const res = await fetch('/api/otp/envoyer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErreur(data.error || 'Erreur lors de l\'envoi du code.')
      return
    }

    setOtpEnvoye(true)
  }

  async function validerOTP() {
    if (!patient || !otpCode) return
    setLoading(true)
    setErreur('')

    const res = await fetch('/api/otp/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patient.id,
        dossierId: patient.dossierId,
        code: otpCode,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErreur(data.error || 'Code invalide ou expiré.')
      return
    }

    router.push(`/patients/${patient.id}`)
  }

  async function activerUrgence() {
    router.push(`/urgence?patientId=${patient?.id}&dossierId=${patient?.dossierId}`)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scanner QR Code</h1>
          <p className="text-gray-500 text-sm">Accéder au dossier d'un patient</p>
        </div>
      </div>

      {erreur && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {erreur}
        </div>
      )}

      {etape === 'scan' && (
        <Card>
          <CardContent className="p-6">
            <QRScanner onScan={handleScan} onError={(e) => setErreur(e)} />
          </CardContent>
        </Card>
      )}

      {etape === 'chargement' && (
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-gray-500 text-sm">Recherche du patient...</p>
          </CardContent>
        </Card>
      )}

      {etape === 'acces' && patient && (
        <div className="space-y-4">
          {/* Infos patient */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                  <span className="text-green-800 font-bold">
                    {patient.nom[0]}{patient.prenoms[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-green-900">
                    {patient.nom.toUpperCase()} {patient.prenoms}
                  </p>
                  <p className="text-sm text-green-700">
                    {patient.genre === 'M' ? 'Homme' : 'Femme'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation accès */}
          {patient.aTelephone ? (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Validation par SMS</h2>
                <p className="text-sm text-gray-600">
                  Un code à 6 chiffres sera envoyé par SMS au téléphone enregistré du patient.
                  Le patient vous communique oralement ce code.
                </p>

                {!otpEnvoye ? (
                  <Button onClick={envoyerOTP} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Envoyer le code OTP
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-green-600 font-medium">
                      Code envoyé. Valable 10 minutes.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center text-2xl tracking-widest font-mono border border-gray-300 rounded-lg py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <Button onClick={validerOTP} disabled={loading || otpCode.length !== 6} className="w-full">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Valider le code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-600 mb-3">
                  Ce patient n'a pas de numéro de téléphone enregistré. Une signature numérique
                  est requise pour valider l'accès.
                </p>
                <Button
                  onClick={() => router.push(`/patients/${patient.id}`)}
                  className="w-full"
                >
                  Procéder à la signature
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mode urgence */}
          <Card className="border-red-200">
            <CardContent className="p-4">
              <Button
                variant="urgence"
                className="w-full"
                onClick={activerUrgence}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                MODE URGENCE
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Accès immédiat sans consentement. Réservé aux urgences médicales.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
