import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { structurerTexteIA } from '@/lib/ollama'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { texte } = await req.json()
    if (!texte?.trim()) {
      return NextResponse.json({ error: 'Texte manquant' }, { status: 400 })
    }

    const structureIA = await structurerTexteIA(texte)
    return NextResponse.json({ structure: structureIA, texteOriginal: texte })
  } catch (err) {
    console.error('[Structuration IA]', err)
    return NextResponse.json(
      { error: 'Erreur lors de la structuration IA. Vérifiez que Ollama est démarré avec le modèle Phi-3 Mini.' },
      { status: 500 }
    )
  }
}
