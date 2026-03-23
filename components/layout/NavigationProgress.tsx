'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname   = usePathname()
  const barRef     = useRef<HTMLDivElement>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeRef  = useRef(false)
  const startedAt  = useRef(0)
  const curWidth   = useRef(0)
  const prevPath   = useRef(pathname)

  /* ── Helpers DOM directs (pas de React state = pas de batching) ── */
  function setWidth(w: number, transition = 'none') {
    const el = barRef.current
    if (!el) return
    curWidth.current = w
    el.style.transition = transition
    el.style.width = `${w}%`
  }

  function setOpacity(o: number, transition = 'none') {
    const el = barRef.current
    if (!el) return
    el.style.transition = transition
    el.style.opacity = String(o)
  }

  function start() {
    if (activeRef.current) return
    activeRef.current = true
    startedAt.current = Date.now()

    // Mise à jour DOM synchrone — visible immédiatement, avant le render Next.js
    setOpacity(1)
    setWidth(10)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const w = curWidth.current
      if (w < 85) setWidth(w + (85 - w) / 5, 'width 150ms ease-out')
    }, 150)
  }

  function done() {
    if (!activeRef.current) return
    activeRef.current = false
    if (timerRef.current) clearInterval(timerRef.current)

    // Garantit un minimum de 250ms d'affichage pour les navigations rapides
    const wait = Math.max(0, 250 - (Date.now() - startedAt.current))
    setTimeout(() => {
      setWidth(100, 'width 300ms ease-out')
      setTimeout(() => setOpacity(0, 'opacity 300ms ease'), 300)
      setTimeout(() => setWidth(0), 650)
    }, wait)
  }

  /* ── Intercepte les navigations ── */
  useEffect(() => {
    const origPush = history.pushState.bind(history)
    history.pushState = (...args) => { origPush(...args); start() }
    const onPop = () => start()
    addEventListener('popstate', onPop)
    return () => {
      history.pushState = origPush
      removeEventListener('popstate', onPop)
    }
  }, [])

  /* ── Fin de navigation détectée via usePathname ── */
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname
      done()
    }
  }, [pathname])

  return (
    <div
      ref={barRef}
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        width: '0%',
        opacity: 0,
        background: '#10b981',
        boxShadow: '0 0 10px #10b981, 0 0 5px #10b981',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  )
}
