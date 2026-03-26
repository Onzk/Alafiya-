'use client'

import { useRef, useEffect, useState } from 'react'
import { Eraser } from 'lucide-react'

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
  value?: string | null
  required?: boolean
}

export function SignaturePad({ onChange, value, required }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [isEmpty, setIsEmpty] = useState(!value)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.putImageData(imageData, 0, 0)
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    if (value) {
      const img = new Image()
      img.onload = () => ctx?.drawImage(img, 0, 0)
      img.src = value
      setIsEmpty(false)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  function getPos(e: React.PointerEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    isDrawing.current = true
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function onPointerUp() {
    if (!isDrawing.current) return
    isDrawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    setIsEmpty(false)
    onChange(canvas.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange(null)
  }

  const borderClass = required && isEmpty
    ? 'border-red-300 dark:border-red-700'
    : 'border-slate-200 dark:border-zinc-700'

  return (
    <div className="space-y-1.5">
      <div className={`relative rounded-xl border-2 border-dashed ${borderClass} bg-white dark:bg-zinc-950 overflow-hidden`}>
        <canvas
          ref={canvasRef}
          className="w-full h-28 touch-none cursor-crosshair block"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {isEmpty && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 dark:text-zinc-600 pointer-events-none select-none">
            Signez ici
          </p>
        )}
      </div>
      {!isEmpty && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
        >
          <Eraser className="h-3 w-3" />
          Effacer la signature
        </button>
      )}
    </div>
  )
}
