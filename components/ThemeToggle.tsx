'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`p-2 rounded-full transition-colors hover:bg-muted ${className ?? ''}`}
      aria-label="Basculer le mode nuit"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-brand" />
      ) : (
        <Moon className="h-5 w-5 text-slate-500" />
      )}
    </button>
  )
}
