'use client'

import { useRef, useState } from 'react'
import { Camera, ImageIcon, X, User } from 'lucide-react'

export function PhotoPicker({
  initialUrl,
  onChange,
}: {
  initialUrl?: string | null
  onChange: (file: File | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    onChange(file)
  }

  function handleRemove() {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    onChange(null)
    if (fileRef.current)   fileRef.current.value   = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">

      {/* Avatar */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 flex items-center justify-center ring-2 ring-slate-200 dark:ring-zinc-700">
          {preview ? (
            <img src={preview} alt="Photo patient" className="h-full w-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-slate-300 dark:text-zinc-600" />
          )}
        </div>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
            aria-label="Supprimer la photo"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Boutons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Camera className="h-3.5 w-3.5" />
          Caméra
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Galerie
        </button>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-zinc-500">Photo optionnelle · max 5 Mo</p>

      {/* Inputs cachés */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
