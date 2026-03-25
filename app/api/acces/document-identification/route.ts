import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { logger, getRequestInfo } from '@/lib/logger'
import { TypeDocumentIdentification } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const TYPES_VALIDES: TypeDocumentIdentification[] = ['CNI', 'PASSEPORT', 'CNSS', 'EID_ANID']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser
  const centreId = user.centreActif
  if (!centreId) return NextResponse.json({ error: 'Centre non défini' }, { status: 400 })

  const formData = await req.formData()
  const typeDocument = formData.get('typeDocument') as string
  const numeroDocument = (formData.get('numeroDocument') as string)?.trim()
  const justificatif = formData.get('justificatif') as File | null

  if (!typeDocument || !TYPES_VALIDES.includes(typeDocument as TypeDocumentIdentification)) {
    return NextResponse.json({ error: 'Type de document invalide' }, { status: 400 })
  }
  if (!numeroDocument) {
    return NextResponse.json({ error: 'Numéro de document requis' }, { status: 400 })
  }
  if (!justificatif || !justificatif.size) {
    return NextResponse.json({ error: 'Photo justificative requise' }, { status: 400 })
  }
  if (!justificatif.type.startsWith('image/')) {
    return NextResponse.json({ error: 'La photo doit être une image' }, { status: 400 })
  }

  // Rechercher le document par type + numéro (insensible à la casse)
  const docTrouve = await prisma.documentIdentification.findFirst({
    where: {
      type: typeDocument as TypeDocumentIdentification,
      numero: { equals: numeroDocument, mode: 'insensitive' },
    },
    select: {
      id: true,
      patient: {
        select: {
          id: true,
          nom: true,
          prenoms: true,
          dossier: { select: { id: true } },
        },
      },
    },
  })

  if (!docTrouve) {
    return NextResponse.json(
      { error: 'Aucun patient trouvé avec ce numéro de document.' },
      { status: 404 }
    )
  }

  const { patient } = docTrouve

  // Sauvegarder la photo justificative
  const ext = (justificatif.name.split('.').pop()?.toLowerCase()) ?? 'jpg'
  const filename = `acces-${patient.id}-${typeDocument.toLowerCase()}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'acces', 'justificatifs')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(await justificatif.arrayBuffer()))
  const justificatifPhoto = `/uploads/acces/justificatifs/${filename}`

  const { ip, userAgent } = getRequestInfo(req)

  // Créer l'AccesDossier (1h) si le patient a un dossier
  if (patient.dossier?.id) {
    const debutAcces = new Date()
    const finAcces = new Date(debutAcces.getTime() + 60 * 60 * 1000)

    await prisma.accesDossier.create({
      data: {
        dossierId: patient.dossier.id,
        medecinId: user.id!,
        centreId,
        debutAcces,
        finAcces,
        modeUrgence: false,
        modeAccesDoc: true,
        justificatifPhoto,
      },
    })

    await logger({
      userId: user.id,
      action: 'ACCES_PAR_DOCUMENT',
      cible: 'DossierMedical',
      cibleId: patient.dossier.id,
      centreId,
      details: { typeDocument, finAcces },
      ip,
      userAgent,
    })
  }

  return NextResponse.json({
    patient: {
      id: patient.id,
      nom: patient.nom,
      prenoms: patient.prenoms,
    },
  })
}
