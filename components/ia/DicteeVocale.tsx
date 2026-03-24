'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StructureIA } from '@/types'

interface DicteeVocaleProps {
  onStructure: (structure: StructureIA, texteOriginal: string) => void
}

type Etat = 'idle' | 'enregistrement' | 'transcription' | 'structuration'

export function DicteeVocale({ onStructure }: DicteeVocaleProps) {
  const [etat, setEtat] = useState<Etat>('idle')
  const [erreur, setErreur] = useState('')
  const [duree, setDuree] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  async function demarrerEnregistrement() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        await traiterAudio()
      }

      mediaRecorder.start(1000)
      setEtat('enregistrement')
      setErreur('')
      setDuree(0)
      timerRef.current = setInterval(() => setDuree((d) => d + 1), 1000)
    } catch {
      setErreur('Impossible d\'accéder au microphone.')
    }
  }

  function arreterEnregistrement() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setEtat('transcription')
  }

  async function traiterAudio() {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', blob, 'dictee.webm')

    // Étape 1 : Transcription Whisper
    setEtat('transcription')
    const transRes = await fetch('/api/ia/transcription', {
      method: 'POST',
      body: formData,
    })

    if (!transRes.ok) {
      setErreur('Erreur lors de la transcription. Vérifiez Ollama.')
      setEtat('idle')
      return
    }

    const { texte } = await transRes.json()

    // Étape 2 : Structuration Phi-3
    setEtat('structuration')
    const structRes = await fetch('/api/ia/structuration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texte }),
    })

    if (!structRes.ok) {
      setErreur('Erreur lors de la structuration IA.')
      setEtat('idle')
      return
    }

    const { structure, texteOriginal } = await structRes.json()
    onStructure(structure, texteOriginal)
    setEtat('idle')
  }

  const formatDuree = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="border border-dashed border-green-300 dark:border-emerald-700/50 rounded-lg p-4 bg-green-50 dark:bg-emerald-950/20 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-emerald-300">Dictée vocale IA</p>
          <p className="text-xs text-green-600 dark:text-emerald-400">
            Dictez vos observations, l&apos;IA structure automatiquement les données
          </p>
        </div>
        <Wand2 className="h-5 w-5 text-green-600 dark:text-emerald-400" />
      </div>

      {erreur && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">{erreur}</p>
      )}

      <div className="flex items-center gap-3">
        {etat === 'idle' && (
          <Button
            type="button"
            variant="outline"
            onClick={demarrerEnregistrement}
            className="border-green-400 dark:border-emerald-600 text-green-700 dark:text-emerald-400 hover:bg-green-100 dark:hover:bg-emerald-950/40"
          >
            <Mic className="mr-2 h-4 w-4" />
            Démarrer la dictée
          </Button>
        )}

        {etat === 'enregistrement' && (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={arreterEnregistrement}
            >
              <MicOff className="mr-2 h-4 w-4" />
              Arrêter ({formatDuree(duree)})
            </Button>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Enregistrement en cours</span>
            </div>
          </>
        )}

        {(etat === 'transcription' || etat === 'structuration') && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            {etat === 'transcription' ? 'Transcription Whisper...' : 'Structuration par IA...'}
          </div>
        )}
      </div>
    </div>
  )
}
