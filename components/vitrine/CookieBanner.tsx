'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'alafiya_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50
      vitrine-card border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl shadow-black/10
      px-5 py-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
            <Cookie className="h-4 w-4 text-brand" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Cookies</p>
        </div>
        <button
          onClick={decline}
          aria-label="Fermer"
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
        Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement de la
        plateforme (session, authentification).{' '}
        <Link href="/legals/cookies" className="text-brand hover:underline font-medium">
          En savoir plus
        </Link>
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={accept}
          className="flex-1 h-9 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition-colors"
        >
          Accepter
        </button>
        <button
          onClick={decline}
          className="flex-1 h-9 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Refuser
        </button>
      </div>
    </div>
  )
}
