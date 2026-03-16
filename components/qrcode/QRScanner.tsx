'use client'

import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'qr-reader'

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText)
          scanner.stop().catch(() => {})
        },
        (errorMessage) => {
          onError?.(errorMessage)
        }
      )
      .catch((err) => {
        console.error('Erreur démarrage scanner:', err)
        onError?.('Impossible d\'accéder à la caméra.')
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [onScan, onError])

  return (
    <div className="w-full max-w-sm mx-auto">
      <div id={elementId} className="rounded-xl overflow-hidden border-2 border-green-300" />
      <p className="text-center text-sm text-gray-500 mt-3">
        Pointez la caméra vers le QR code du patient
      </p>
    </div>
  )
}
