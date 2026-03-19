import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const permissions = await prisma.permission.findMany({ orderBy: { code: 'asc' } })
  return NextResponse.json({ permissions })
}
