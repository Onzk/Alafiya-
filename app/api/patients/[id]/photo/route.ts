import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = session.user as unknown as SessionUser

  // Vérification d'accès : SUPERADMIN, créateur du patient, ou accès dossier valide
  if (user.niveauAcces !== 'SUPERADMIN') {
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      select: { creeParId: true, dossier: { select: { id: true } } },
    })
    if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

    const estCreateur = patient.creeParId === user.id

    if (!estCreateur) {
      if (!patient.dossier) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
      const accesValide = await prisma.accesDossier.findFirst({
        where: { dossierId: patient.dossier.id, medecinId: user.id, finAcces: { gt: new Date() } },
      })
      if (!accesValide) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
  }

  const formData = await req.formData()
  const file = formData.get('photo') as File | null

  if (!file || !file.size) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Format invalide, image requise' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Taille maximale : 5 Mo' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${params.id}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'patients')

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const photoUrl = `/uploads/patients/${filename}`
  await prisma.patient.update({ where: { id: params.id }, data: { photo: photoUrl } })

  return NextResponse.json({ photo: photoUrl })
}
