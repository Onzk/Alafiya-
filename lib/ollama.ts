import { StructureIA } from '@/types'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export async function transcrireAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('model', 'whisper')
  formData.append('file', audioBlob, 'audio.webm')

  const response = await fetch(`${OLLAMA_BASE_URL}/api/audio/transcriptions`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Erreur Whisper: ${response.statusText}`)
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
      model: 'phi3:mini',
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
