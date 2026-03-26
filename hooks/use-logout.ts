'use client'

import { signOut } from 'next-auth/react'

export function useLogout() {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    signOut({ callbackUrl: 'https://srv1486271.hstgr.cloud/login' })
  }
  return logout
}
