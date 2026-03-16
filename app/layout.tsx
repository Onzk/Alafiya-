import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Alafiya Plus — Dossiers médicaux nationaux',
  description:
    'Plateforme nationale de gestion sécurisée des dossiers médicaux patients au Togo.',
  manifest: '/manifest.json',
  icons: { apple: '/icons/icon-192x192.png' },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
