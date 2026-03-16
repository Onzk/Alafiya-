import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { SessionUser } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user as unknown as SessionUser

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
