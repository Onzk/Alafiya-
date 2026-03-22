import { VitrineNavbar } from '@/components/vitrine/Navbar'
import { VitrineFooter } from '@/components/vitrine/Footer'
import { CookieBanner } from '@/components/vitrine/CookieBanner'

export default function VitrineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col">
      <VitrineNavbar />
      <main className="flex-1">{children}</main>
      <VitrineFooter />
      <CookieBanner />
    </div>
  )
}
