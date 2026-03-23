import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const config = await prisma.configuration.upsert({
    where:  { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  return NextResponse.json(config)
}
