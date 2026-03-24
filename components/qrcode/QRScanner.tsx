'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, RefreshCw, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

type CameraState = 'loading' | 'active' | 'denied' | 'unavailable'

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const elementId = 'qr-reader'
  const onScanRef   = useRef(onScan)
  const onErrorRef  = useRef(onError)
  const [cameraState, setCameraState] = useState<CameraState>('loading')

  useEffect(() => { onScanRef.current  = onScan  })
  useEffect(() => { onErrorRef.current = onError })

  useEffect(() => {
    let stopped = false
    let scannerInstance: import('html5-qrcode').Html5Qrcode | null = null

    async function start() {
      const { Html5Qrcode } = await import('html5-qrcode')
      if (stopped) return

      const scanner = new Html5Qrcode(elementId, { verbose: false })
      scannerInstance = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {
            fps: 15,
            qrbox: (w: number, h: number) => {
              const size = Math.floor(Math.min(w, h) * 0.72)
              return { width: size, height: size }
            },
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
            videoConstraints: {
              facingMode: 'environment',
              width:  { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [{ focusMode: 'continuous' }],
            },
          } as any,
          (decodedText: string) => { onScanRef.current(decodedText) },
          () => {}
        )
        if (!stopped) setCameraState('active')
      } catch (err: unknown) {
        if (stopped) return
        const msg = err instanceof Error ? err.message : String(err)
        if (
          msg.includes('Permission') ||
          msg.includes('permission') ||
          msg.includes('NotAllowed') ||
          msg.includes('denied')
        ) {
          setCameraState('denied')
        } else if (
          msg.includes('NotFound') ||
          msg.includes('no camera') ||
          msg.includes('unavailable')
        ) {
          setCameraState('unavailable')
        } else {
          setCameraState('denied')
        }
        onErrorRef.current?.(msg)
      }
    }

    start()

    return () => {
      stopped = true
      if (scannerInstance) {
        try {
          scannerInstance.stop().catch(() => {}).finally(() => { scannerInstance?.clear() })
        } catch {
          scannerInstance.clear()
        }
      }
    }
  }, [])

  const isSecure = typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">

      {/* Zone caméra — toujours montée pour que html5-qrcode ait le DOM */}
      <div
        id={elementId}
        className={[
          'rounded-xl overflow-hidden border-2 transition-colors min-h-[220px]',
          cameraState === 'active'
            ? 'border-brand'
            : 'border-slate-200 dark:border-zinc-700',
          cameraState === 'denied' || cameraState === 'unavailable' ? 'hidden' : '',
        ].join(' ')}
      />

      {/* État : chargement */}
      {cameraState === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Camera className="h-7 w-7 text-brand animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
            Démarrage de la caméra…
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Autorisez l&apos;accès à la caméra dans la fenêtre qui s&apos;affiche.
          </p>
        </div>
      )}

      {/* État : accès refusé */}
      {cameraState === 'denied' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-400/10 flex items-center justify-center">
              <CameraOff className="h-7 w-7 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Accès à la caméra refusé
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                L&apos;application n&apos;a pas pu accéder à votre caméra.
              </p>
            </div>
          </div>

          {!isSecure && (
            <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-300">
              <p className="font-bold mb-1">Connexion non sécurisée</p>
              <p>La caméra n&apos;est accessible qu&apos;en HTTPS. Vérifiez que vous utilisez bien <span className="font-mono">https://</span> dans l&apos;URL.</p>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5" /> Sur mobile
            </p>
            <ol className="text-xs text-slate-500 dark:text-zinc-400 space-y-1.5 list-decimal list-inside">
              <li>Ouvrez les <strong>Réglages</strong> de votre téléphone</li>
              <li>Allez dans <strong>Applications</strong> → votre navigateur</li>
              <li>Appuyez sur <strong>Autorisations</strong> → <strong>Caméra</strong></li>
              <li>Sélectionnez <strong>Autoriser</strong>, puis revenez ici</li>
            </ol>

            <div className="border-t border-slate-200 dark:border-zinc-700 pt-3">
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5" /> Sur ordinateur
              </p>
              <ol className="text-xs text-slate-500 dark:text-zinc-400 space-y-1.5 list-decimal list-inside mt-1.5">
                <li>Cliquez sur l&apos;icône <strong>cadenas</strong> ou <strong>caméra</strong> dans la barre d&apos;adresse</li>
                <li>Changez la permission <strong>Caméra</strong> sur <strong>Autoriser</strong></li>
                <li>Rechargez la page</li>
              </ol>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      )}

      {/* État : caméra introuvable */}
      {cameraState === 'unavailable' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
            <CameraOff className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Aucune caméra détectée</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-[240px] mx-auto">
              Aucune caméra n&apos;a été trouvée sur cet appareil. Utilisez un autre appareil pour scanner le QR code.
            </p>
          </div>
        </div>
      )}

      {/* Indication scanner actif */}
      {cameraState === 'active' && (
        <p className="text-center text-sm text-slate-500 dark:text-zinc-400">
          Pointez la caméra vers le QR code du patient
        </p>
      )}
    </div>
  )
}
