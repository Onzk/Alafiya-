'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CreditCard, QrCode, ChevronRight } from 'lucide-react'
import { QRScanner } from '@/components/qrcode/QRScanner'
import { toast } from '@/hooks/use-toast'

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

    window.location.href = `/patients/${data.patient.id}`
  }, [])

  return (
    <div className="max-w-lg mx-auto space-y-4">

      {/* En-tête */}
      <div className="dash-in delay-0 flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center shrink-0">
          <QrCode className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">Scanner QR Code</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Accéder au dossier d&apos;un patient</p>
        </div>
      </div>

      {etape === 'scan' && (
        <>
          {/* Zone scanner */}
          <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Caméra</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                Prêt à scanner
              </span>
            </div>
            <div className="p-5">
              <QRScanner onScan={handleScan} onError={handleScanError} />
            </div>
          </div>

          {/* Actions alternatives */}
          <div className="dash-in delay-100 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
            <button
              type="button"
              onClick={() => router.push('/acces-document')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">Accès par document d&apos;identité</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">CNI, Passeport, CNSS, eID</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => router.push('/urgence')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/60 dark:hover:bg-red-950/20 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Mode urgence</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Accès immédiat sans consentement</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 shrink-0" />
            </button>
          </div>
        </>
      )}

      {etape === 'chargement' && (
        <div className="dash-in delay-75 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-14 flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-20 w-20 rounded-full border-2 border-brand/20 animate-ping" />
            <div className="absolute h-14 w-14 rounded-full border border-brand/30 animate-pulse" />
            <div className="h-14 w-14 rounded-2xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center z-10">
              <QrCode className="h-7 w-7 text-brand" />
            </div>
          </div>
          <div className="text-center mt-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">QR code détecté</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Recherche du dossier patient…</p>
          </div>
        </div>
      )}

    </div>
  )
}
