import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { SessionUser } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user as unknown as SessionUser

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar — desktop uniquement */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} />
        {/* pb-16 sur mobile pour laisser de la place à la nav bottom */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Nav bottom mobile */}
      <MobileNav user={user} />
    </div>
  )
}
