'use client'

import { signOut } from 'next-auth/react'

export function useLogout() {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    signOut({ callbackUrl: `${window.location.origin}/login` })
  }
  return logout
}
