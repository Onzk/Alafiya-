import { StructureIA } from '@/types'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export type MessageChat = { role: 'system' | 'user' | 'assistant'; content: string }

// Conversation multi-tours via Ollama local (phi3:mini par défaut)
export async function chatIA(messages: MessageChat[]): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_CHAT_MODEL || 'phi3:mini',
      messages,
      stream: false,
    }),
    signal: AbortSignal.timeout(110_000),
  })

  if (!response.ok) {
    throw new Error(`Erreur chat IA: ${response.statusText}`)
  }

  const data = await response.json()
  return data.message?.content || ''
}

export async function transcrireAudio(audioBlob: Blob): Promise<string> {
  const whisperUrl = process.env.WHISPER_BASE_URL || 'http://localhost:8000'
  const whisperModel = process.env.WHISPER_MODEL || 'Systran/faster-whisper-small'

  const formData = new FormData()
  formData.append('model', whisperModel)
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('language', 'fr')
  formData.append('response_format', 'json')

  const response = await fetch(`${whisperUrl}/v1/audio/transcriptions`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    throw new Error(`Erreur faster-whisper: ${response.statusText}`)
  }

  const data = await response.json()
  return data.text || ''
}

export async function structurerTexteIA(texte: string): Promise<StructureIA> {
  const prompt = `Tu es un assistant médical. Analyse ce texte dicté par un médecin et structure-le en JSON avec les champs : antecedents, signes, examens, bilan, traitements (conseils, injections, ordonnance), suivi. Réponds uniquement en JSON valide, sans texte autour.\n\nTexte : ${texte}`

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_CHAT_MODEL || 'tinyllama',
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Erreur Phi-3: ${response.statusText}`)
  }

  const data = await response.json()
  const responseText: string = data.response || ''

  // Extraire le JSON de la réponse
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Réponse IA non valide : aucun JSON trouvé')
  }

  return JSON.parse(jsonMatch[0]) as StructureIA
}
