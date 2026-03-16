'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

    // La redirection est gérée côté serveur via le callback de session
    // On récupère le niveau d'accès depuis la session pour rediriger
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A+</span>
            </div>
            <span className="font-bold text-gray-900 text-2xl">Alafiya Plus</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Plateforme nationale de santé — Togo</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Connexion</h1>

          {erreur && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motDePasse">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="motDePasse"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
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

        <p className="text-center text-xs text-gray-400 mt-6">
          Accès réservé aux professionnels de santé autorisés.
          <br />
          En cas de problème, contactez votre administrateur.
        </p>
      </div>
    </div>
  )
}
