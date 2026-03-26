import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { transcrireAudio } from '@/lib/ollama'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as Blob | null

    if (!audioFile) {
      return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 })
    }

    const texte = await transcrireAudio(audioFile)
    return NextResponse.json({ texte })
  } catch (err) {
    console.error('[Transcription IA]', err)
    return NextResponse.json(
      { error: 'Erreur lors de la transcription. Vérifiez que faster-whisper-server est démarré.' },
      { status: 500 }
    )
  }
}
