'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrCode, AlertTriangle, Loader2, ArrowLeft, PenLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/qrcode/QRScanner'
import SignaturePad from 'signature_pad'
import { toast } from '@/hooks/use-toast'

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
  const [otpCode, setOtpCode] = useState('')
  const [otpEnvoye, setOtpEnvoye] = useState(false)
  const [loading, setLoading] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    if (etape === 'acces' && patient && !patient.aTelephone && canvasRef.current) {
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      padRef.current = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)' })
    }
  }, [etape, patient])

  const handleScanError = useCallback((e: string) => {
    if (e.includes('caméra') || e.includes('camera') || e.includes('accéder')) {
      toast({ description: e, variant: 'destructive' })
    }
  }, [])

  const handleScan = useCallback(async (qrText: string) => {
    setEtape('chargement')

    let token = qrText
    try {
      const url = new URL(qrText)
      token = url.searchParams.get('token') || qrText
    } catch {}

    const res = await fetch(`/api/qrcode/scan?token=${token}`)
    const data = await res.json()

    if (!res.ok) {
      toast({ description: data.error || 'Patient introuvable.', variant: 'destructive' })
      setEtape('scan')
      return
    }

    setPatient(data.patient)
    setEtape('acces')
  }, [])

  async function envoyerOTP() {
    if (!patient) return
    setLoading(true)

    const res = await fetch('/api/otp/envoyer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || "Erreur lors de l'envoi du code.", variant: 'destructive' })
      return
    }

    setOtpEnvoye(true)
  }

  async function validerOTP() {
    if (!patient || !otpCode) return
    setLoading(true)

    const res = await fetch('/api/otp/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id, dossierId: patient.dossierId, code: otpCode }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || 'Code invalide ou expiré.', variant: 'destructive' })
      return
    }

    router.push(`/patients/${patient.id}`)
  }

  async function validerSignature() {
    if (!patient || !padRef.current) return

    if (padRef.current.isEmpty()) {
      toast({ description: 'La signature est requise. Le patient doit signer dans le cadre.', variant: 'destructive' })
      return
    }

    setLoading(true)

    const signatureBase64 = padRef.current.toDataURL('image/png')

    const res = await fetch('/api/signature/valider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id, dossierId: patient.dossierId, signatureBase64 }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast({ description: data.error || "Erreur lors de la validation de la signature.", variant: 'destructive' })
      return
    }

    router.push(`/patients/${patient.id}`)
  }

  function activerUrgence() {
    router.push(`/urgence?patientId=${patient?.id}&dossierId=${patient?.dossierId}`)
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">Scanner QR Code</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Accéder au dossier d&apos;un patient</p>
        </div>
      </div>

      {etape === 'scan' && (
        <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden p-6">
          <QRScanner onScan={handleScan} onError={handleScanError} />
        </div>
      )}

      {etape === 'chargement' && (
        <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-10 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Recherche du patient...</p>
        </div>
      )}

      {etape === 'acces' && patient && (
        <div className="space-y-4">
          {/* Infos patient */}
          <div className="dash-in delay-75 bg-brand/5 dark:bg-brand/10 border border-brand/20 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0">
                <span className="text-brand font-bold text-lg">{patient.nom[0]}{patient.prenoms[0]}</span>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white">{patient.nom.toUpperCase()} {patient.prenoms}</p>
                <p className="text-sm text-slate-500 dark:text-zinc-400">{patient.genre === 'M' ? 'Homme' : 'Femme'}</p>
              </div>
            </div>
          </div>

          {/* Validation accès — OTP */}
          {patient.aTelephone ? (
            <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
                  <QrCode className="h-3.5 w-3.5 text-brand" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Validation par SMS</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Un code à 6 chiffres sera envoyé par SMS au téléphone du patient.
                Le patient vous communique oralement ce code.
              </p>

              {!otpEnvoye ? (
                <Button onClick={envoyerOTP} disabled={loading} className="w-full bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Envoyer le code OTP
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-brand font-semibold">Code envoyé. Valable 10 minutes.</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-widest font-mono border border-slate-200 dark:border-zinc-700 rounded-xl py-3 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button onClick={validerOTP} disabled={loading || otpCode.length !== 6} className="w-full bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Valider le code
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-400/15 flex items-center justify-center">
                  <PenLine className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Signature du patient</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Ce patient n&apos;a pas de numéro de téléphone. Présentez cet écran au patient
                pour qu&apos;il signe dans le cadre ci-dessous.
              </p>

              <div className="relative border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full touch-none"
                  style={{ height: '200px', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => padRef.current?.clear()}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition-colors"
                  title="Effacer la signature"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-slate-300 dark:text-zinc-600 pointer-events-none">
                  Signez ici
                </p>
              </div>

              <Button onClick={validerSignature} disabled={loading} className="w-full bg-brand hover:bg-brand-dark text-white rounded-xl shadow-sm shadow-brand/20">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Valider la signature et accéder au dossier
              </Button>
            </div>
          )}

          {/* Mode urgence */}
          <div className="dash-in delay-225 bg-white dark:bg-zinc-950 rounded-2xl border border-red-200 dark:border-red-900/40 p-4">
            <Button variant="urgence" className="w-full" onClick={activerUrgence}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              MODE URGENCE
            </Button>
            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center mt-2">
              Accès immédiat sans consentement. Réservé aux urgences médicales.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
