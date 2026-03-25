import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { verifierAccesDossier } from '@/lib/verifier-acces-dossier'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const autorise = await verifierAccesDossier(params.id, user.id!, user.niveauAcces)
  if (!autorise) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

  const formData = await req.formData()
  const titre = (formData.get('titre') as string)?.trim()
  const note = (formData.get('note') as string)?.trim() || null
  const fichier = formData.get('fichier') as File | null

  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
  if (!fichier || !fichier.size) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
  if (!fichier.type.startsWith('image/')) return NextResponse.json({ error: 'Image requise' }, { status: 400 })
  if (fichier.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Taille max : 10 Mo' }, { status: 400 })

  const ext = fichier.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${params.id}-doc-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'patients', 'documents')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(await fichier.arrayBuffer()))

  const doc = await prisma.documentPatient.create({
    data: {
      patientId: params.id,
      titre,
      note,
      fichier: `/uploads/patients/documents/${filename}`,
    },
  })

  return NextResponse.json(doc)
}
