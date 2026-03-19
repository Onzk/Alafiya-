'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CentreOption {
  id: string
  nom: string
  type: string
  region: string
}

export default function LoginPage() {
  const router = useRouter()
  const { update } = useSession()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  // Modale sélection centre
  const [centresDisponibles, setCentresDisponibles] = useState<CentreOption[]>([])
  const [centreModalOpen, setCentreModalOpen] = useState(false)
  const [redirectionApresSelection, setRedirectionApresSelection] = useState('')
  const [selectionLoading, setSelectionLoading] = useState(false)

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
    const user = session?.user

    if (!user) {
      setErreur('Erreur de session. Réessayez.')
      return
    }

    const niveau = user.niveauAcces
    const destination =
      niveau === 'MINISTERE' ? '/ministere/dashboard' :
      niveau === 'ADMIN_CENTRE' ? '/admin/dashboard' :
      '/dashboard'

    // Si l'utilisateur a plusieurs centres, afficher la modale de sélection
    if (niveau !== 'MINISTERE' && user.centres && user.centres.length > 1) {
      setRedirectionApresSelection(destination)

      // Récupérer les détails des centres de l'utilisateur
      const centresRes = await fetch('/api/centres')
      const centresData = await centresRes.json()
      const mesCentres = (centresData.centres || []).filter(
        (c: CentreOption & { id: string }) => user.centres.includes(c.id)
      )
      setCentresDisponibles(mesCentres)
      setCentreModalOpen(true)
      return
    }

    router.push(destination)
  }

  async function choisirCentre(centreId: string) {
    setSelectionLoading(true)

    await fetch('/api/session/centre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ centreId }),
    })

    // Rafraîchir le JWT avec le nouveau centre actif
    await update()

    setCentreModalOpen(false)
    router.push(redirectionApresSelection)
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

      {/* Modale sélection du centre actif */}
      <Dialog open={centreModalOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Choisissez votre centre de travail</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-2">
            Vous êtes affecté(e) à plusieurs centres. Sélectionnez celui sur lequel vous travaillez aujourd&apos;hui.
          </p>
          <div className="space-y-2">
            {centresDisponibles.map((centre) => (
              <button
                key={centre.id}
                onClick={() => choisirCentre(centre.id)}
                disabled={selectionLoading}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-left disabled:opacity-50"
              >
                <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{centre.nom}</p>
                  <p className="text-xs text-gray-400">{centre.type} • {centre.region}</p>
                </div>
                {selectionLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-green-600" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
