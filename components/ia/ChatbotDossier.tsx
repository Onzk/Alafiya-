'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Loader2, Bot, Trash2, X } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

interface Props {
  patientId: string
  patientNom: string
  specialiteId?: string
  specialiteNom?: string
}

export function ChatbotDossier({ patientId, patientNom, specialiteId, specialiteNom }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [enChargement, setEnChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [enTranscription, setEnTranscription] = useState(false)
  const [panelOuvert, setPanelOuvert] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const titre = specialiteNom ?? patientNom
  const occupé = enChargement || enregistrement || enTranscription

  const suggestions = [
    'Résume les dernières consultations',
    specialiteNom
      ? `Quels traitements ont été prescrits en ${specialiteNom} ?`
      : 'Quels modules ont des consultations ?',
  ]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, enChargement])

  useEffect(() => {
    if (panelOuvert) setTimeout(() => inputRef.current?.focus(), 300)
  }, [panelOuvert])

  // Bloquer le scroll du body quand le panel est ouvert
  useEffect(() => {
    document.body.style.overflow = panelOuvert ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [panelOuvert])

  async function envoyerMessage(texte: string) {
    const t = texte.trim()
    if (!t || occupé) return
    const userMsg: Message = { role: 'user', content: t }
    const nouvelHistorique = [...messages, userMsg]
    setMessages(nouvelHistorique)
    setInput('')
    setEnChargement(true)
    setErreur('')
    try {
      const res = await fetch('/api/ia/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: t, patientId, specialiteId, historique: messages }),
      })
      if (!res.ok) {
        let msg = `Erreur ${res.status}`
        try { const d = await res.json(); msg = d.error || msg } catch {}
        setErreur(msg)
        return
      }
      let data: { reponse?: string }
      try {
        data = await res.json()
      } catch {
        setErreur(`Réponse invalide du serveur (HTTP ${res.status}). Vérifiez les logs serveur.`)
        return
      }
      setMessages([...nouvelHistorique, { role: 'assistant', content: data.reponse ?? '' }])
    } catch (err) {
      setErreur(`Erreur réseau : ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setEnChargement(false)
    }
  }

  async function demarrerVoix() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setEnregistrement(false)
        setEnTranscription(true)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob, 'vocal.webm')
        try {
          const res = await fetch('/api/ia/transcription', { method: 'POST', body: formData })
          if (res.ok) {
            const { texte } = await res.json()
            if (texte?.trim()) await envoyerMessage(texte)
          } else {
            setErreur('Erreur de transcription vocale.')
          }
        } catch {
          setErreur("Impossible de transcrire l'audio.")
        } finally {
          setEnTranscription(false)
        }
      }
      mediaRecorder.start(1000)
      setEnregistrement(true)
      setErreur('')
    } catch {
      setErreur("Impossible d'accéder au microphone.")
    }
  }

  function arreterVoix() { mediaRecorderRef.current?.stop() }
  function effacer() { setMessages([]); setErreur('') }

  // ─── Sous-composants ──────────────────────────────────────────────────────

  const renderEtatVide = () => (
    <div className="text-center py-10 space-y-4 px-2">
      <div className="h-12 w-12 rounded-2xl bg-brand/15 border border-brand/20 flex items-center justify-center mx-auto">
        <Bot className="h-6 w-6 text-brand" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Assistant médical</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">Posez une question sur le dossier</p>
      </div>
      <div className="space-y-1.5 text-left">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => envoyerMessage(s)}
            className="block w-full text-left text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg px-3 py-2.5 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
      {messages.length === 0 && renderEtatVide()}
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              msg.role === 'user'
                ? 'bg-brand text-white rounded-br-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-bl-sm border border-zinc-200/60 dark:border-zinc-800/60'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {enChargement && (
        <div className="flex justify-start">
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
      {erreur && (
        <p className="text-xs text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
          {erreur}
        </p>
      )}
      <div ref={endRef} />
    </div>
  )

  const renderInput = () => (
    <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex-shrink-0">
      {enregistrement && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-red-500 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          Enregistrement en cours...
        </div>
      )}
      {enTranscription && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-zinc-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Transcription en cours...
        </div>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); envoyerMessage(input) }}
        className="flex gap-1.5"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={occupé ? '' : 'Votre question...'}
          disabled={occupé}
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 disabled:opacity-40 transition-colors"
        />
        <button
          type="button"
          onClick={enregistrement ? arreterVoix : demarrerVoix}
          disabled={enChargement || enTranscription}
          title={enregistrement ? "Arrêter l'enregistrement" : 'Dicter une question'}
          className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            enregistrement
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-40'
          }`}
        >
          {enTranscription
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : enregistrement ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          type="submit"
          disabled={!input.trim() || occupé}
          className="h-9 w-9 rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand/90 disabled:opacity-30 transition-colors flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )

  const renderHeader = () => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex-shrink-0">
      <div className="h-8 w-8 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">Assistant IA</p>
        <p className="text-xs text-zinc-500 truncate">{titre}</p>
      </div>
      {messages.length > 0 && (
        <button
          onClick={effacer}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title="Effacer la conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={() => setPanelOuvert(false)}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )

  // ─── Rendu ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* FAB — visible sur toutes les tailles */}
      <button
        onClick={() => setPanelOuvert(true)}
        aria-label="Ouvrir l'assistant IA"
        className={`fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 h-14 w-14 rounded-full bg-brand text-white shadow-lg shadow-brand/30 flex items-center justify-center hover:bg-brand/90 active:scale-95 transition-all ${panelOuvert ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}`}
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${panelOuvert ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setPanelOuvert(false)}
      />

      {/* Panel latéral — slide depuis la droite */}
      <aside
        className={`fixed top-0 bottom-16 sm:bottom-0 right-0 z-50 flex flex-col w-full sm:w-[480px] lg:w-[520px] bg-white dark:bg-zinc-950 border-l border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl shadow-zinc-400/20 dark:shadow-black/60 transition-transform duration-300 ease-in-out ${panelOuvert ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {renderHeader()}
        {renderMessages()}
        {renderInput()}
      </aside>
    </>
  )
}
