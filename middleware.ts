import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(function middleware(req) {
  const { nextUrl, auth: session } = req as NextRequest & { auth: { user?: { niveauAcces?: string } } | null }
  const pathname = nextUrl.pathname

  // Routes publiques autorisées
  const publicRoutes = ['/', '/login', '/fonctionnalites', '/apropos', '/contact']
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith('/api/auth'))
  if (isPublic) return NextResponse.next()

  // Routes API publiques
  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  // Pas de session → rediriger vers login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const niveau = session.user.niveauAcces

  // Protection des routes Superadmin
  if (pathname.startsWith('/superadmin') && niveau !== 'SUPERADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Protection des routes Admin Centre
  if (pathname.startsWith('/admin') && !['SUPERADMIN', 'ADMIN_CENTRE'].includes(niveau || '')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
