'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Loader2, Building2,
  HeartPulse, ShieldCheck, QrCode, Stethoscope,
  Brain, Activity, LogIn, ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useToast } from '@/hooks/use-toast'
import { LogoIcon } from '@/components/ui/logo'

interface CentreOption {
  id: string
  nom: string
  type: string
  region: string
}

export default function LoginPage() {
  const router = useRouter()
  const { update } = useSession()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const [centresDisponibles, setCentresDisponibles] = useState<CentreOption[]>([])
  const [centreModalOpen, setCentreModalOpen] = useState(false)
  const [redirectionApresSelection, setRedirectionApresSelection] = useState('')
  const [selectionLoading, setSelectionLoading] = useState(false)
  const [inscriptionModalOpen, setInscriptionModalOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password: motDePasse,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      toast({ description: 'Email ou mot de passe incorrect.', variant: 'destructive' })
      return
    }

    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const user = session?.user

    if (!user) {
      toast({ description: 'Erreur de session. Réessayez.', variant: 'destructive' })
      return
    }

    const niveau = user.niveauAcces
    const destination =
      niveau === 'SUPERADMIN' ? '/superadmin/dashboard' :
      niveau === 'ADMIN_CENTRE' ? '/admin/dashboard' :
      '/dashboard'

    if (niveau !== 'SUPERADMIN' && user.centres && user.centres.length > 1) {
      setRedirectionApresSelection(destination)
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
    await update()
    setCentreModalOpen(false)
    router.push(redirectionApresSelection)
  }

  return (
    <>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-in {
          animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(-3deg); }
        }
        .fa { animation: floatA 4s ease-in-out infinite; }
        .fb { animation: floatB 5s ease-in-out infinite 0.8s; }
        .fc { animation: floatA 3.5s ease-in-out infinite 1.5s; }
        .fd { animation: floatB 4.5s ease-in-out infinite 0.3s; }
      `}</style>

      {/* Page background */}
      <div className="min-h-screen bg-emerald-50 dark:bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">

        {/* Cercles décoratifs de fond */}
        <div className="absolute top-10 left-16 h-8 w-8 rounded-full bg-emerald-200/60 dark:bg-emerald-900/30 pointer-events-none" />
        <div className="absolute top-20 right-32 h-14 w-14 rounded-full bg-emerald-300/40 dark:bg-emerald-800/20 pointer-events-none" />
        <div className="absolute bottom-16 left-1/4 h-10 w-10 rounded-full bg-emerald-200/50 dark:bg-emerald-900/25 pointer-events-none" />
        <div className="absolute bottom-24 right-16 h-6 w-6 rounded-full bg-emerald-400/30 dark:bg-emerald-700/20 pointer-events-none" />
        <div className="absolute top-1/2 left-6 h-5 w-5 rounded-full bg-emerald-300/40 dark:bg-emerald-800/20 pointer-events-none" />
        <div className="absolute top-1/3 right-8 h-4 w-4 rounded-full bg-emerald-200/60 dark:bg-emerald-900/30 pointer-events-none" />

        {/* Blobs */}
        <div
          className="absolute -left-32 top-1/4 w-80 h-80 rounded-full pointer-events-none opacity-30 dark:opacity-10"
          style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }}
        />
        <div
          className="absolute -right-32 bottom-1/4 w-80 h-80 rounded-full pointer-events-none opacity-20 dark:opacity-10"
          style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }}
        />

        {/* ── Carte principale ── */}
        <div className="card-in relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/10 dark:shadow-black/40 dark:ring-1 dark:ring-zinc-800 flex">

          {/* ── Colonne gauche : formulaire ── */}
          <div className="w-full lg:w-[48%] bg-white dark:bg-zinc-950 px-10 py-12 flex flex-col justify-center transition-colors duration-300">

            {/* Logo + toggle thème */}
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                  <LogoIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                  Alafiya <span className="text-emerald-500">Plus</span>
                </span>
              </Link>
              <ThemeToggle />
            </div>

            {/* Titre */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-1.5">
                Bienvenue !
                <LogIn className="h-5 w-5 text-emerald-500" />
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                Nouvelle journée, nouveau défi. Connectez-vous<br />pour gérer vos patients.
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Entrez votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-slate-200 dark:border-zinc-700 rounded-lg text-sm placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="motDePasse" className="text-slate-700 dark:text-zinc-300 text-sm font-medium">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="motDePasse"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Entrez votre mot de passe"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10 border-slate-200 dark:border-zinc-700 rounded-lg text-sm placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium mt-1">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm shadow-md shadow-emerald-500/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-400 dark:text-zinc-500 mt-6">
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => setInscriptionModalOpen(true)}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                S&apos;inscrire
              </button>
            </p>
          </div>

          {/* ── Colonne droite : visuel ── */}
          <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center px-10 py-12 gap-8">

            {/* Gradient */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)' }} />
            <div className="absolute inset-0 pointer-events-none opacity-20"
              style={{ background: 'radial-gradient(ellipse at 30% 30%, #34d399 0%, transparent 60%)' }} />

            {/* Contenu */}
            <div className="relative z-10 w-full">

              {/* Texte principal */}
              <div className="mb-12 text-center">
                <h2 className="text-white text-2xl font-extrabold leading-snug mb-3">
                  De Bons Soins Vous<br />Attendent
                </h2>
                <p className="text-emerald-100 text-sm font-medium flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Connectez-vous maintenant
                </p>
              </div>

              {/* Illustration */}
              <div className="flex items-center justify-center mb-12">
                <div className="relative">
                  <div className="h-40 w-40 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
                    <div className="h-28 w-28 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                      <HeartPulse className="h-14 w-14 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="fa absolute -top-4 -right-4 h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div className="fb absolute -bottom-3 -left-4 h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <div className="fc absolute top-1/2 -translate-y-1/2 -right-10 h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="fd absolute top-1/2 -translate-y-1/2 -left-10 h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Badges stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: ShieldCheck, label: 'Données chiffrées', sub: 'AES-256' },
                  { icon: Activity,    label: 'Disponibilité',      sub: '99.9%' },
                  { icon: Building2,   label: 'Centres connectés',  sub: '150+' },
                  { icon: HeartPulse,  label: 'Patients actifs',    sub: '50 000+' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className=" rounded-xl p-3 border border-white/15 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold leading-none">{sub}</p>
                      <p className="text-white/70 text-[10px] mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modale inscription */}
      <Dialog open={inscriptionModalOpen} onOpenChange={setInscriptionModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader title="Accès sur invitation" description="Alafiya Plus est une plateforme réservée aux professionnels de santé autorisés. La création de compte se fait uniquement via votre centre de santé." icon={ShieldAlert} />
          <div className="px-5 md:px-7 pb-5 md:pb-6 space-y-4 pt-3">

            {/* Personnel de centre */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex items-start gap-3">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5 uppercase tracking-wide">Personnel de centre</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Rapprochez-vous de <span className="font-semibold">l&apos;administrateur de votre centre de santé</span> pour qu&apos;il vous crée un accès.
                </p>
              </div>
            </div>

            {/* Administrateur de centre */}
            <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-700/50 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-slate-500 dark:text-zinc-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-0.5 uppercase tracking-wide">Administrateur de centre</p>
                <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Contactez le <span className="font-semibold">support</span> pour la création de votre compte administrateur.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setInscriptionModalOpen(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            >
              Compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale sélection du centre actif */}
      <Dialog open={centreModalOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader title="Choisissez votre centre de travail" description="Vous êtes affecté(e) à plusieurs centres. Sélectionnez celui sur lequel vous travaillez aujourd'hui." icon={Building2} />
          <div className="space-y-2">
            {centresDisponibles.map((centre) => (
              <button
                key={centre.id}
                onClick={() => choisirCentre(centre.id)}
                disabled={selectionLoading}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all text-left disabled:opacity-50"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{centre.nom}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{centre.type} · {centre.region}</p>
                </div>
                {selectionLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-emerald-600" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
