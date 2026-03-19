import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { SessionUser } from '@/types'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const pwdSchema = z.object({
  ancienMotDePasse: z.string().min(1),
  nouveauMotDePasse: z.string().min(8, 'Minimum 8 caractères'),
})

/* ── PATCH : changer le mot de passe ── */
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser

  const body = await req.json()
  const validation = pwdSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const { ancienMotDePasse, nouveauMotDePasse } = validation.data

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const ok = await bcrypt.compare(ancienMotDePasse, dbUser.motDePasse)
  if (!ok) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })

  const hash = await bcrypt.hash(nouveauMotDePasse, 12)
  await prisma.user.update({ where: { id: user.id }, data: { motDePasse: hash } })

  return NextResponse.json({ message: 'Mot de passe mis à jour' })
}

/* ── POST : changer la photo ── */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const user = session.user as unknown as SessionUser

  const formData = await req.formData()
  const file = formData.get('photo') as File | null

  if (!file || !file.size) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Format invalide, image requise' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Taille maximale : 2 Mo' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${user.id}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const photoUrl = `/uploads/profiles/${filename}`
  await prisma.user.update({ where: { id: user.id }, data: { photo: photoUrl } })

  return NextResponse.json({ photo: photoUrl })
}
