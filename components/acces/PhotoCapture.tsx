'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoCaptureProps {
  onCapture: (blob: Blob) => void
  onClear: () => void
  captured: boolean
}

type CamState = 'loading' | 'active' | 'denied' | 'unavailable'

export function PhotoCapture({ onCapture, onClear, captured }: PhotoCaptureProps) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [camState, setCamState] = useState<CamState>('loading')
  const [preview,  setPreview]  = useState<string | null>(null)

  useEffect(() => {
    let stopped = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCamState('active')
      } catch (err) {
        if (stopped) return
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('NotFound') || msg.includes('no camera') || msg.includes('DevicesNotFound')) {
          setCamState('unavailable')
        } else {
          setCamState('denied')
        }
      }
    }

    start()

    return () => {
      stopped = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function capture() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        setPreview(URL.createObjectURL(blob))
        onCapture(blob)
      },
      'image/jpeg',
      0.88,
    )
  }

  function retake() {
    setPreview(null)
    onClear()
  }

  const isSecure =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')

  if (preview) {
    return (
      <div className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Photo capturée" className="w-full rounded-xl object-cover max-h-52 border border-slate-100 dark:border-zinc-800" />
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl gap-2 text-sm h-9"
          onClick={retake}
        >
          <RotateCcw className="h-4 w-4" />
          Reprendre la photo
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />

      {/* Flux vidéo */}
      {camState !== 'denied' && camState !== 'unavailable' && (
        <video
          ref={videoRef}
          muted
          playsInline
          className={[
            'w-full rounded-xl object-cover max-h-52 bg-zinc-900 border border-slate-100 dark:border-zinc-800',
            camState === 'loading' ? 'hidden' : '',
          ].join(' ')}
        />
      )}

      {/* État : chargement */}
      {camState === 'loading' && (
        <div className="flex flex-col items-center gap-2 py-10 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
          <Camera className="h-7 w-7 text-brand animate-pulse" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">Démarrage de la caméra…</p>
        </div>
      )}

      {/* État : accès refusé */}
      {camState === 'denied' && (
        <div className="flex flex-col items-center gap-3 py-8 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 text-center px-4">
          <CameraOff className="h-7 w-7 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Accès à la caméra refusé</p>
            {!isSecure && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">La caméra requiert une connexion HTTPS.</p>
            )}
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
              Autorisez la caméra dans les réglages de votre navigateur, puis réessayez.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Réessayer
          </Button>
        </div>
      )}

      {/* État : caméra introuvable */}
      {camState === 'unavailable' && (
        <div className="flex flex-col items-center gap-2 py-8 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 text-center px-4">
          <CameraOff className="h-7 w-7 text-slate-400" />
          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Aucune caméra détectée</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
            Aucune caméra disponible sur cet appareil.
          </p>
        </div>
      )}

      {/* Bouton capture */}
      {camState === 'active' && (
        <Button
          type="button"
          className="w-full rounded-xl gap-2 bg-brand hover:bg-brand-dark text-white h-10"
          onClick={capture}
        >
          <Camera className="h-4 w-4" />
          Prendre la photo
        </Button>
      )}
    </div>
  )
}
