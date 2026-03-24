import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Providers } from '@/components/Providers'
import { Toaster } from '@/components/ui/toaster'
import NextTopLoader from 'nextjs-toploader'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Alafiya Plus — Dossiers médicaux nationaux',
  description:
    'Plateforme nationale de gestion sécurisée des dossiers médicaux patients au Togo.',
  manifest: '/manifest.json',
  icons: { apple: '/logo.png', icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#21c488',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={jakarta.className}>
        <NextTopLoader
          color="#10b981"
          shadow="0 0 10px #10b981, 0 0 5px #10b981"
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
