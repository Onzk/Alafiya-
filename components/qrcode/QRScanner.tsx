'use client'

import { useEffect, useRef } from 'react'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const elementId = 'qr-reader'
  // Refs pour toujours avoir les callbacks les plus récents sans les mettre en deps
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
  })

  useEffect(() => {
    let stopped = false
    let scannerInstance: import('html5-qrcode').Html5Qrcode | null = null

    async function start() {
      const { Html5Qrcode } = await import('html5-qrcode')

      // StrictMode : si le cleanup a déjà tourné avant que l'import finisse, on abandonne
      if (stopped) return

      const scanner = new Html5Qrcode(elementId)
      scannerInstance = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScanRef.current(decodedText)
          },
          () => {
            // Erreurs de frame (QR non détecté sur la frame) — ignorées volontairement
          }
        )
      } catch {
        if (!stopped) {
          onErrorRef.current?.("Impossible d'accéder à la caméra.")
        }
      }
    }

    start()

    return () => {
      stopped = true
      if (scannerInstance) {
        // stop() puis clear() pour nettoyer l'état interne de html5-qrcode
        try {
          scannerInstance
            .stop()
            .catch(() => {})
            .finally(() => {
              scannerInstance?.clear()
            })
        } catch {
          scannerInstance.clear()
        }
      }
    }
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto">
      <div id={elementId} className="rounded-xl overflow-hidden border-2 border-green-300" />
      <p className="text-center text-sm text-gray-500 mt-3">
        Pointez la caméra vers le QR code du patient
      </p>
    </div>
  )
}
