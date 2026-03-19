import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import { SessionUser } from '@/types'
import { ParametresClient } from './ParametresClient'

export default async function ParametresPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = session.user as unknown as SessionUser

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { photo: true },
  })

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="dash-in delay-0">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
          Paramètres
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Gérez vos informations personnelles et votre sécurité
        </p>
      </div>

      <ParametresClient user={user} photo={dbUser?.photo ?? null} />
    </div>
  )
}
