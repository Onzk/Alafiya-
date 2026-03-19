import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string, estActif: true },
          include: {
            permissions: { include: { permission: { select: { code: true } } } },
            specialites: { select: { specialiteId: true } },
            centres: { select: { centreId: true } },
          },
        })

        if (!user) return null

        const motDePasseOk = await bcrypt.compare(
          credentials.password as string,
          user.motDePasse
        )
        if (!motDePasseOk) return null

        return {
          id: user.id,
          nom: user.nom,
          prenoms: user.prenoms,
          email: user.email,
          niveauAcces: user.niveauAcces,
          centreActif: user.centreActifId ?? undefined,
          centres: user.centres.map((c) => c.centreId),
          specialites: user.specialites.map((s) => s.specialiteId),
          permissions: user.permissions.map((p) => p.permission.code),
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as unknown as SessionUser & { id: string }
        token.id = u.id
        token.nom = u.nom
        token.prenoms = u.prenoms
        token.niveauAcces = u.niveauAcces
        token.centreActif = u.centreActif
        token.centres = u.centres
        token.specialites = u.specialites
        token.permissions = u.permissions
      }
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { centreActifId: true },
        })
        if (dbUser) token.centreActif = dbUser.centreActifId ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        nom: token.nom as string,
        prenoms: token.prenoms as string,
        niveauAcces: token.niveauAcces as SessionUser['niveauAcces'],
        centreActif: token.centreActif as string | undefined,
        centres: token.centres as string[],
        specialites: token.specialites as string[],
        permissions: token.permissions as string[],
      } as unknown as typeof session.user
      return session
    },
  },
})
