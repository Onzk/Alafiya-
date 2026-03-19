'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrCode, AlertTriangle, Loader2, ArrowLeft, PenLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QRScanner } from '@/components/qrcode/QRScanner'
import SignaturePad from 'signature_pad'

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

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    if (etape === 'acces' && patient && !patient.aTelephone && canvasRef.current) {
      // Redimensionner le canvas AVANT de construire SignaturePad
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      padRef.current = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)' })
    }
  }, [etape, patient])

  const handleScanError = useCallback((e: string) => {
    // N'afficher que les erreurs caméra réelles, pas les "QR not found" de chaque frame
    if (e.includes('caméra') || e.includes('camera') || e.includes('accéder')) {
      setErreur(e)
    }
  }, [])

  const handleScan = useCallback(async (qrText: string) => {
    setEtape('chargement')
    setErreur('')

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
      setErreur(data.error || "Erreur lors de l'envoi du code.")
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
      body: JSON.stringify({ patientId: patient.id, dossierId: patient.dossierId, code: otpCode }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErreur(data.error || 'Code invalide ou expiré.')
      return
    }

    router.push(`/patients/${patient.id}`)
  }

  async function validerSignature() {
    if (!patient || !padRef.current) return

    if (padRef.current.isEmpty()) {
      setErreur('La signature est requise. Le patient doit signer dans le cadre.')
      return
    }

    setLoading(true)
    setErreur('')

    const signatureBase64 = padRef.current.toDataURL('image/png')

    const res = await fetch('/api/signature/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patient.id,
        dossierId: patient.dossierId,
        signatureBase64,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErreur(data.error || "Erreur lors de la validation de la signature.")
      return
    }

    router.push(`/patients/${patient.id}`)
  }

  function activerUrgence() {
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
          <p className="text-gray-500 text-sm">Accéder au dossier d&apos;un patient</p>
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
            <QRScanner onScan={handleScan} onError={handleScanError} />
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

          {/* Validation accès — OTP */}
          {patient.aTelephone ? (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-green-600" />
                  <h2 className="font-semibold text-gray-900">Validation par SMS</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Un code à 6 chiffres sera envoyé par SMS au téléphone du patient.
                  Le patient vous communique oralement ce code.
                </p>

                {!otpEnvoye ? (
                  <Button onClick={envoyerOTP} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Envoyer le code OTP
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-green-600 font-medium">Code envoyé. Valable 10 minutes.</p>
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
            /* Validation par signature numérique */
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Signature du patient</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Ce patient n&apos;a pas de numéro de téléphone. Présentez cet écran au patient
                  pour qu&apos;il signe dans le cadre ci-dessous. Sa signature vaut consentement d&apos;accès.
                </p>

                <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full touch-none"
                    style={{ height: '200px', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => padRef.current?.clear()}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    title="Effacer la signature"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-300 pointer-events-none">
                    Signez ici
                  </p>
                </div>

                <Button
                  onClick={validerSignature}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Valider la signature et accéder au dossier
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mode urgence */}
          <Card className="border-red-200">
            <CardContent className="p-4">
              <Button variant="urgence" className="w-full" onClick={activerUrgence}>
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
