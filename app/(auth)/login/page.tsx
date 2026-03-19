'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErreur('')

    const result = await signIn('credentials', {
      email,
      password: motDePasse,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setErreur('Email ou mot de passe incorrect.')
      return
    }

    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const niveau = session?.user?.niveauAcces

    if (niveau === 'MINISTERE') {
      router.push('/ministere/dashboard')
    } else if (niveau === 'ADMIN_CENTRE') {
      router.push('/admin/dashboard')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4 relative">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-14 w-14 bg-white rounded-2xl shadow-md border border-slate-100 dark:border-zinc-700 flex items-center justify-center">
              <Image src="/logo.png" alt="Alafiya Plus" width={44} height={44} className="rounded-xl" priority />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-2xl">Alafiya Plus</span>
          </Link>
          <p className="text-slate-500 dark:text-zinc-400 mt-3 text-sm">Plateforme nationale de santé — Togo</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg p-8">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Connexion</h1>

          {erreur && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-custom text-sm text-red-700 dark:text-red-400">
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 dark:text-zinc-300">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motDePasse" className="text-slate-700 dark:text-zinc-300">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="motDePasse"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold rounded-custom"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-zinc-500 mt-6">
          Accès réservé aux professionnels de santé autorisés.
          <br />
          En cas de problème, contactez votre administrateur.
        </p>
      </div>
    </div>
  )
}
