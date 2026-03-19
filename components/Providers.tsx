'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'
import NextTopLoader from 'nextjs-toploader'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextTopLoader
        color="#10b981"
        shadow="0 0 10px #10b981, 0 0 5px #10b981"
        height={3}
        showSpinner={false}
        easing="ease"
        speed={200}
      />
      {children}
      <Toaster />
    </SessionProvider>
  )
}
