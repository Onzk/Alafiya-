'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2, Wand2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter,
} from '@/components/ui/dialog'
import { StructureIA } from '@/types'

interface DicteeVocaleProps {
  onStructure: (structure: StructureIA, texteOriginal: string) => void
}

type Etat = 'idle' | 'enregistrement' | 'transcription' | 'structuration' | 'termine'

export function DicteeVocale({ onStructure }: DicteeVocaleProps) {
  const [ouvert, setOuvert] = useState(false)
  const [etat, setEtat] = useState<Etat>('idle')
  const [erreur, setErreur] = useState('')
  const [duree, setDuree] = useState(0)
  const [texteTranscrit, setTexteTranscrit] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function reinitialiser() {
    setEtat('idle')
    setErreur('')
    setDuree(0)
    setTexteTranscrit('')
  }

  function fermer() {
    if (etat === 'enregistrement') arreterEnregistrement()
    reinitialiser()
    setOuvert(false)
  }

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
      setErreur("Impossible d'accéder au microphone.")
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

    setEtat('transcription')
    const transRes = await fetch('/api/ia/transcription', { method: 'POST', body: formData })
    if (!transRes.ok) {
      setErreur('Erreur lors de la transcription. Vérifiez Ollama.')
      setEtat('idle')
      return
    }
    const { texte } = await transRes.json()
    setTexteTranscrit(texte)

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
    setEtat('termine')
  }

  const formatDuree = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const enTraitement = etat === 'transcription' || etat === 'structuration'

  return (
    <>
      {/* FAB dictée — fixe, en dessous du FAB chatbot */}
      <button
        type="button"
        onClick={() => { reinitialiser(); setOuvert(true) }}
        aria-label="Démarrer la dictée vocale"
        className={`fixed bottom-36 right-4 lg:bottom-24 lg:right-8 z-50 h-14 w-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all ${ouvert ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}`}
      >
        <Mic className="h-6 w-6" />
      </button>

      <Dialog open={ouvert} onOpenChange={(v) => { if (!v) fermer() }}>
        <DialogContent className="md:max-w-lg">
          <DialogHeader
            icon={Wand2}
            title="Dictée vocale IA"
            description="Dictez vos observations à voix haute. L'IA transcrit puis structure automatiquement les données dans le formulaire."
          />

          <DialogBody className="space-y-5">

            {/* ── Guide ── */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Conseils pour une bonne dictée</p>
                <ul className="space-y-1 text-emerald-700 dark:text-emerald-400">
                  <li>• Parlez dans un environnement calme, à voix claire et posée</li>
                  <li>• Nommez la catégorie avant chaque information</li>
                  <li>• Énoncez les dosages en toutes lettres : <span className="italic">« deux cents milligrammes »</span></li>
                  <li>• Épellez les médicaments peu courants si nécessaire</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Catégories reconnues</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-emerald-700 dark:text-emerald-400">
                  <span>• Antécédents</span>
                  <span>• Signes / symptômes</span>
                  <span>• Examens cliniques</span>
                  <span>• Bilan paraclinique</span>
                  <span>• Conseils / conduite</span>
                  <span>• Injections</span>
                  <span>• Ordonnance</span>
                  <span>• Suivi</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Exemple</p>
                <p className="italic text-emerald-700 dark:text-emerald-400 leading-relaxed border-l-2 border-emerald-300 dark:border-emerald-700 pl-2">
                  « Antécédents : HTA sous traitement depuis trois ans.
                  Signes : céphalées frontales depuis deux jours, tension à seize sur dix.
                  Ordonnance : Amlodipine cinq milligrammes, un comprimé par jour.
                  Suivi : contrôle tensionnel dans une semaine. »
                </p>
              </div>
            </div>

            {/* ── Zone d'enregistrement ── */}
            <div className="flex flex-col items-center gap-4 py-2">
              {etat === 'idle' && (
                <button
                  type="button"
                  onClick={demarrerEnregistrement}
                  className="h-20 w-20 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <Mic className="h-8 w-8" />
                </button>
              )}

              {etat === 'enregistrement' && (
                <>
                  <button
                    type="button"
                    onClick={arreterEnregistrement}
                    className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all animate-pulse"
                  >
                    <MicOff className="h-8 w-8" />
                  </button>
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Enregistrement — {formatDuree(duree)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">Appuyez pour arrêter</p>
                </>
              )}

              {enTraitement && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                    {etat === 'transcription' ? 'Transcription en cours…' : 'Structuration par IA…'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    {etat === 'transcription'
                      ? 'Whisper analyse votre audio'
                      : 'Le modèle remplit les champs du formulaire'}
                  </p>
                </div>
              )}

              {etat === 'termine' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Formulaire rempli avec succès</p>
                </div>
              )}
            </div>

            {/* ── Aperçu transcription ── */}
            {texteTranscrit && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">Texte transcrit</p>
                <p className="text-sm text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 leading-relaxed italic">
                  {texteTranscrit}
                </p>
              </div>
            )}

            {erreur && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 px-3 py-2 rounded-lg">
                {erreur}
              </p>
            )}
          </DialogBody>

          {/* <DialogFooter>
            {etat === 'termine' ? (
              <Button type="button" onClick={fermer} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Fermer et appliquer
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={fermer}
                disabled={enTraitement}
              >
                Annuler
              </Button>
            )}
            {(etat === 'idle' || etat === 'enregistrement') && (
              <Button
                type="button"
                onClick={etat === 'idle' ? demarrerEnregistrement : arreterEnregistrement}
                className={etat === 'enregistrement' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
              >
                {etat === 'idle'
                  ? <><Mic className="mr-2 h-4 w-4" />Démarrer</>
                  : <><MicOff className="mr-2 h-4 w-4" />Arrêter ({formatDuree(duree)})</>}
              </Button>
            )}
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </>
  )
}
