'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/qrcode/QRScanner'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'

type Etape = 'scan' | 'chargement'

export default function ScannerPage() {
  const router = useRouter()
  const [etape, setEtape] = useState<Etape>('scan')
  const scanning = useRef(false)

  const handleScanError = useCallback((e: string) => {
    if (e.includes('caméra') || e.includes('camera') || e.includes('accéder')) {
      toast({ description: e, variant: 'destructive' })
    }
  }, [])

  const handleScan = useCallback(async (qrText: string) => {
    if (scanning.current) return
    scanning.current = true

    let token: string | null = null
    try {
      const url = new URL(qrText)
      token = url.searchParams.get('token')
    } catch {}

    // Un token Alafiya est un hash SHA-256 : 64 caractères hexadécimaux
    const isValidToken = token && /^[0-9a-f]{64}$/i.test(token)
    if (!isValidToken) {
      toast({ description: 'Ce QR code ne correspond pas à un patient Alafiya.', variant: 'destructive' })
      scanning.current = false
      return
    }

    setEtape('chargement')
    const res = await fetch(`/api/qrcode/scan?token=${token}`)
    const data = await res.json()

    if (!res.ok) {
      toast({ description: data.error || 'Patient introuvable.', variant: 'destructive' })
      setEtape('scan')
      scanning.current = false
      return
    }

    router.push(`/patients/${data.patient.id}`)
  }, [router])

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* En-tête */}
      <div className="dash-in delay-0">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">Scanner QR Code</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">Accéder au dossier d&apos;un patient</p>
      </div>

      {etape === 'scan' && (
        <>
          <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden p-6">
            <QRScanner onScan={handleScan} onError={handleScanError} />
          </div>

          {/* Mode urgence */}
          <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-red-200 dark:border-red-900/40 p-4">
            <Button variant="urgence" className="w-full" onClick={() => router.push('/urgence')}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              MODE URGENCE
            </Button>
            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center mt-2">
              Accès immédiat sans consentement. Réservé aux urgences médicales.
            </p>
          </div>
        </>
      )}

      {etape === 'chargement' && (
        <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-10 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Recherche du patient...</p>
        </div>
      )}

    </div>
  )
}
