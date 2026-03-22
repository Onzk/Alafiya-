import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { SessionUser } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as unknown as SessionUser

  return (
    <div className="flex h-screen overflow-hidden
      bg-white dark:bg-zinc-950
      lg:bg-emerald-50
      dark:bg-gradient-to-bl dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-950
      lg:p-3 lg:gap-3">

      {/* ── Sidebar verte — desktop uniquement ── */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* ── Panneau principal ── */}
      <div className="flex flex-col flex-1 overflow-hidden
        bg-white dark:bg-zinc-950 shadow-white shadow-lg
        lg:rounded-2xl lg:shadow-sm lg:ring-1 lg:ring-slate-900/5 dark:lg:ring-zinc-800/60">

        {/* Navbar — toujours visible */}
        <Header user={user} />

        {/* Contenu de la page avec dégradé vert */}
        <main className="flex-1 overflow-y-auto relative
          dark:bg-zinc-950
          p-4 sm:p-6 lg:p-8
          pb-20 lg:pb-8">

          {/* Cercles décoratifs de fond — light mode */}
          {/* <div className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
            <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" />
            <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
            <div className="absolute -bottom-8 left-1/3 h-48 w-48 rounded-full bg-emerald-50/80 blur-2xl" />
          </div> */}

          {/* Contenu au-dessus des décorations */}
          <div className="relative z-10">
            {children}
          </div>

          {/* ── Footer ── */}
          <footer className="mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-zinc-500">
            <span className="font-medium">© {new Date().getFullYear()} Alafiya</span>
            <div className="flex items-center gap-4">
              <a href="/legal/conditions" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Conditions d'utilisation</a>
              <a href="/legal/confidentialite" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Confidentialité</a>
              <a href="/support" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Support</a>
            </div>
          </footer>

        </main>
      </div>

      {/* ── Navigation bottom — mobile uniquement ── */}
      <MobileNav user={user} />
    </div>
  )
}
