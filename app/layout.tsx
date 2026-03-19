import type { Metadata, Viewport } from 'next'
import { Lato } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Providers } from '@/components/Providers'

const lato = Lato({ subsets: ['latin'], weight: ['400', '700', '900'] })

export const metadata: Metadata = {
  title: 'Alafiya Plus — Dossiers médicaux nationaux',
  description:
    'Plateforme nationale de gestion sécurisée des dossiers médicaux patients au Togo.',
  manifest: '/manifest.json',
  icons: { apple: '/icons/icon-192x192.png', icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#21c488',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={lato.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
