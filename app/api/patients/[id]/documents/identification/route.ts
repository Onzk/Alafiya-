import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { verifierAccesDossier } from '@/lib/verifier-acces-dossier'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { TypeDocumentIdentification } from '@prisma/client'

const TYPES_VALIDES: TypeDocumentIdentification[] = ['CNI', 'PASSEPORT', 'CNSS', 'EID_ANID']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const autorise = await verifierAccesDossier(params.id, user.id!, user.niveauAcces)
  if (!autorise) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

  const formData = await req.formData()
  const type = formData.get('type') as string
  const numero = (formData.get('numero') as string)?.trim()
  const fichier = formData.get('fichier') as File | null

  if (!type || !TYPES_VALIDES.includes(type as TypeDocumentIdentification)) {
    return NextResponse.json({ error: 'Type de document invalide' }, { status: 400 })
  }
  if (!numero) return NextResponse.json({ error: 'Numéro requis' }, { status: 400 })
  if (!fichier || !fichier.size) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
  if (!fichier.type.startsWith('image/')) return NextResponse.json({ error: 'Image requise' }, { status: 400 })
  if (fichier.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Taille max : 10 Mo' }, { status: 400 })

  // Supprimer l'ancien fichier s'il existe
  const existant = await prisma.documentIdentification.findUnique({
    where: { patientId_type: { patientId: params.id, type: type as TypeDocumentIdentification } },
  })
  if (existant?.fichier) {
    const ancienChemin = path.join(process.cwd(), 'public', existant.fichier)
    await unlink(ancienChemin).catch(() => {})
  }

  const ext = fichier.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${params.id}-id-${type.toLowerCase()}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'patients', 'documents')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(await fichier.arrayBuffer()))

  const fichierUrl = `/uploads/patients/documents/${filename}`

  const doc = await prisma.documentIdentification.upsert({
    where: { patientId_type: { patientId: params.id, type: type as TypeDocumentIdentification } },
    create: { patientId: params.id, type: type as TypeDocumentIdentification, numero, fichier: fichierUrl },
    update: { numero, fichier: fichierUrl },
  })

  return NextResponse.json(doc)
}
