import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

/* ── GET : infos du centre actif ── */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser

  if (user.niveauAcces !== 'ADMIN_CENTRE') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  if (!user.centreActif) {
    return NextResponse.json({ error: 'Aucun centre actif' }, { status: 404 })
  }

  const centre = await prisma.centre.findUnique({
    where: { id: user.centreActif },
    select: {
      id: true,
      nom: true,
      adresse: true,
      telephone: true,
      email: true,
      region: true,
      prefecture: true,
      type: true,
      logo: true,
      banniere: true,
    },
  })

  if (!centre) return NextResponse.json({ error: 'Centre introuvable' }, { status: 404 })

  return NextResponse.json(centre)
}

/* ── POST : upload logo ou bannière ── */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser

  if (user.niveauAcces !== 'ADMIN_CENTRE') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  if (!user.centreActif) {
    return NextResponse.json({ error: 'Aucun centre actif' }, { status: 404 })
  }

  const formData = await req.formData()
  const type = formData.get('type') as string | null  // 'logo' | 'banniere'
  const file = formData.get('fichier') as File | null

  if (!type || !['logo', 'banniere'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide (logo ou banniere)' }, { status: 400 })
  }

  if (!file || !file.size) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Format invalide, image requise' }, { status: 400 })
  }

  const maxSize = type === 'banniere' ? 5 * 1024 * 1024 : 2 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Taille maximale : ${type === 'banniere' ? '5' : '2'} Mo` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${user.centreActif}-${type}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'centres')

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const url = `/uploads/centres/${filename}`
  await prisma.centre.update({
    where: { id: user.centreActif },
    data: { [type]: url },
  })

  return NextResponse.json({ [type]: url })
}
