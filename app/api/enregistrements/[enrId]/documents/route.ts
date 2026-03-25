import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const MAX_SIZE = 10 * 1024 * 1024 // 10 Mo

async function verifierAcces(dossierId: string, user: SessionUser): Promise<boolean> {
  if (user.niveauAcces === 'SUPERADMIN' || user.niveauAcces === 'ADMIN_CENTRE') return true
  const acces = await prisma.accesDossier.findFirst({
    where: { dossierId, medecinId: user.id, finAcces: { gt: new Date() } },
  })
  return !!acces
}

export async function POST(req: NextRequest, { params }: { params: { enrId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser

  const enr = await prisma.enregistrementMedical.findUnique({
    where: { id: params.enrId },
    select: { dossierId: true },
  })
  if (!enr) return NextResponse.json({ error: 'Consultation introuvable' }, { status: 404 })

  if (!(await verifierAcces(enr.dossierId, user))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const fd = await req.formData()
  const titre = (fd.get('titre') as string)?.trim()
  const note = (fd.get('note') as string)?.trim() || null
  const fichier = fd.get('fichier') as File | null

  if (!titre) return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
  if (!fichier || !fichier.size) return NextResponse.json({ error: 'Le fichier est requis' }, { status: 400 })
  if (!fichier.type.startsWith('image/') && fichier.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Le fichier doit être une image ou un PDF' }, { status: 400 })
  }
  if (fichier.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
  }

  const ext = fichier.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const filename = `enr-${params.enrId}-doc-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'consultations', 'documents')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(await fichier.arrayBuffer()))

  const doc = await prisma.documentConsultation.create({
    data: {
      titre,
      note,
      fichier: `/uploads/consultations/documents/${filename}`,
      enregistrementId: params.enrId,
    },
  })

  return NextResponse.json({ document: doc })
}
