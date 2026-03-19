'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogoIcon } from '@/components/ui/logo'
import {
  Shield,
  QrCode,
  Brain,
  Users,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Lock,
  Activity,
  Menu,
  X,
  Mail,
  MapPin,
  Phone,
  Facebook,
  Twitter,
  Play,
  ShieldCheck,
  Heart,
  AlertCircle,
  Building2,
  Stethoscope,
  Server,
  Key,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'


/* ═══════════════════════════════════════════
   Scroll reveal
═══════════════════════════════════════════ */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.anim-up, .anim-left, .anim-right, .anim-fade')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('anim-visible')),
      { threshold: 0.1 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* ═══════════════════════════════════════════
   Scrollspy
═══════════════════════════════════════════ */
const SECTIONS = ['accueil', 'fonctionnalites', 'comment', 'securite', 'impact'] as const
type Section = typeof SECTIONS[number]

function useScrollSpy(): Section {
  const [active, setActive] = useState<Section>('accueil')
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id as Section) }),
      { threshold: 0.25, rootMargin: '-10% 0px -55% 0px' }
    )
    SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  return active
}

function d(n: number) { return { style: { transitionDelay: `${n}ms` } } }

/* ═══════════════════════════════════════════
   Page
═══════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useScrollSpy()
  useScrollReveal()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navItems: { href: string; label: string; id: Section }[] = [
    { href: '#accueil', label: 'Accueil',   id: 'accueil' },
    { href: '#fonctionnalites', label: 'Fonctionnalités',   id: 'fonctionnalites' },
    { href: '#comment',         label: 'Comment ça marche', id: 'comment' },
    { href: '#securite',        label: 'Sécurité',          id: 'securite' },
    { href: '#impact',          label: 'Impact',            id: 'impact' },
  ]

  return (
    <>
      {/* ─── Styles animations ─── */}
      <style>{`
        .anim-up    { opacity:0; transform:translateY(28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-left  { opacity:0; transform:translateX(-28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-right { opacity:0; transform:translateX(28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-fade  { opacity:0; transition:opacity .7s ease; }
        .anim-visible { opacity:1 !important; transform:none !important; }
      `}</style>

      <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">

        {/* ══════════════════════════ NAVBAR ══════════════════════════ */}
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 dark:bg-zinc-950 backdrop-blur-xl shadow-sm' : 'bg-transparent dark:bg-zinc-950'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 flex-shrink-0">
              <LogoIcon className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Alafiya <span className="text-brand">+</span>
              </span>
            </Link>

            {/* Nav desktop */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navItems.map(({ href, label, id }) => (
                <a
                  key={href}
                  href={href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active === id
                      ? 'text-brand'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                  {active === id && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand rounded-full" />
                  )}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              <Link href="/login" className="hidden md:inline-flex px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                Connexion
              </Link>
              <Link href="/login" className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20">
                Commencer <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1">
              {navItems.map(({ href, label, id }) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active === id ? 'bg-brand/10 text-brand' : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >{label}</a>
              ))}
              <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 dark:border-zinc-800">
                <Link href="/login" className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">Connexion</Link>
                <Link href="/login" className="block text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand text-white">Commencer</Link>
              </div>
            </div>
          )}
        </nav>

        {/* ══════════════════════════ HERO ══════════════════════════ */}
        <section id="accueil" className="relative bg-white dark:bg-zinc-950 overflow-hidden pt-24 pb-0">

          {/* Glows de fond */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.12) 0%, transparent 70%)' }} />
            <div className="absolute top-32 left-0 w-72 h-72 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.06) 0%, transparent 70%)' }} />
            <div className="absolute top-32 right-0 w-72 h-72 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(20,184,166,0.06) 0%, transparent 70%)' }} />
          </div>

          {/* ── Items flottants ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">

            {/* QR Code — haut gauche */}
            <div className="absolute top-16 left-[6%] animate-float opacity-70" style={{ animationDelay: '0s', animationDuration: '4s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-3 shadow-lg border border-slate-100 dark:border-zinc-800">
                <QrCode className="h-7 w-7 text-brand" />
              </div>
            </div>

            {/* Croix médicale — haut droite */}
            <div className="absolute top-20 right-[7%] animate-float opacity-60" style={{ animationDelay: '0.8s', animationDuration: '5s' }}>
              <div className="bg-brand/10 rounded-2xl p-3 shadow-sm border border-brand/20">
                <svg className="h-7 w-7 text-brand" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 8h-4V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z"/>
                </svg>
              </div>
            </div>

            {/* Shield — milieu gauche */}
            <div className="absolute top-[38%] left-[3%] animate-float opacity-50" style={{ animationDelay: '1.4s', animationDuration: '6s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-3 shadow-md border border-slate-100 dark:border-zinc-800">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>
            </div>

            {/* Cœur — milieu droite */}
            <div className="absolute top-[35%] right-[4%] animate-float opacity-65" style={{ animationDelay: '0.4s', animationDuration: '4.5s' }}>
              <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-3 shadow-sm border border-rose-100 dark:border-rose-900/40">
                <Heart className="h-6 w-6 text-rose-400 fill-rose-400" />
              </div>
            </div>

            {/* Activité ECG — bas gauche */}
            <div className="absolute top-[58%] left-[8%] animate-float opacity-55" style={{ animationDelay: '2s', animationDuration: '5.5s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-none">ECG Normal</p>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">72 bpm</p>
                </div>
              </div>
            </div>

            {/* Badge "Validé" — bas droite */}
            <div className="absolute top-[60%] right-[6%] animate-float opacity-70" style={{ animationDelay: '1s', animationDuration: '4.8s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-brand flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-none">Dossier validé</p>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">ALF-2024-00847</p>
                </div>
              </div>
            </div>

            {/* Brain IA — haut centre-gauche */}
            <div className="absolute top-12 left-[28%] animate-float opacity-40" style={{ animationDelay: '1.8s', animationDuration: '6.5s' }}>
              <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-2.5 shadow-sm border border-violet-100 dark:border-violet-900/40">
                <Brain className="h-5 w-5 text-violet-400" />
              </div>
            </div>

            {/* Lock — haut centre-droite */}
            <div className="absolute top-14 right-[27%] animate-float opacity-40" style={{ animationDelay: '2.5s', animationDuration: '5.8s' }}>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 shadow-sm border border-blue-100 dark:border-blue-900/40">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
            </div>

          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

            {/* Badge */}
            <div className="anim-fade inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              Plateforme nationale de santé numérique — Togo
            </div>

            {/* Titre */}
            <h1 className="anim-up text-5xl md:text-6xl lg:text-[72px] font-extrabold text-slate-900 dark:text-white leading-[1.06] tracking-tight mb-6">
              Votre dossier médical,<br />
              <span className="text-brand">partout, en un scan.</span>
            </h1>

            {/* Sous-titre */}
            <p className="anim-up text-lg md:text-xl text-slate-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-10" {...d(100)}>
              Alafiya centralise et sécurise les dossiers médicaux. Patients et professionnels de santé connectés sur une seule plateforme, accessible depuis n&apos;importe quel centre.
            </p>

            {/* CTAs */}
            <div className="anim-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-10" {...d(180)}>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:shadow-brand/30 hover:-translate-y-0.5 transition-all"
              >
                Commencer gratuitement <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2.5 text-slate-600 dark:text-zinc-300 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                <span className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <Play className="h-3.5 w-3.5 text-brand fill-brand" />
                </span>
                Voir la démo
              </button>
            </div>

            {/* Preuve sociale */}
            <div className="anim-fade flex items-center justify-center gap-3 mb-16" {...d(260)}>
              <div className="flex -space-x-2.5">
                {['bg-emerald-400','bg-teal-500','bg-green-400','bg-emerald-600','bg-cyan-500'].map((c, i) => (
                  <div key={i} className={`h-8 w-8 rounded-full ${c} border-2 border-white dark:border-zinc-950 flex items-center justify-center`}>
                    <span className="text-[10px] font-bold text-white">{String.fromCharCode(65 + i)}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                <span className="font-semibold text-slate-700 dark:text-zinc-200">+50 000</span> patients font confiance à Alafiya
              </p>
            </div>
          </div>

          {/* Aperçu dashboard */}
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Glow sous le dashboard */}
            <div className="absolute -inset-x-10 top-6 h-32 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.18) 0%, transparent 70%)' }} />

            <div className="anim-up relative rounded-t-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-[0_20px_80px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_80px_-10px_rgba(0,0,0,0.5)] overflow-hidden" {...d(300)}>
              {/* Barre navigateur */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200/60 dark:border-zinc-800/60">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
                <div className="ml-3 flex-1 max-w-xs bg-slate-200 dark:bg-zinc-950 rounded-md h-5 flex items-center px-3">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">app.alafiya.tg/dashboard</span>
                </div>
              </div>

              {/* Contenu dashboard simulé */}
              <div className="bg-slate-50 dark:bg-zinc-950 p-5">
                {/* Ligne stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Patients actifs',   value: '12 847', icon: Users,       color: 'text-brand bg-brand/10' },
                    { label: 'Consultations',      value: '3 204',  icon: Activity,    color: 'text-blue-500 bg-blue-500/10' },
                    { label: 'Dossiers validés',   value: '98.4%',  icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10' },
                    { label: 'Centres connectés',  value: '150+',   icon: Building2,   color: 'text-violet-500 bg-violet-500/10' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white dark:bg-zinc-950 rounded-xl p-3.5 border border-slate-100 dark:border-zinc-800">
                      <div className={`h-7 w-7 rounded-lg ${color} flex items-center justify-center mb-2.5`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-base font-bold text-slate-900 dark:text-white leading-none mb-1">{value}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Ligne inférieure */}
                <div className="grid md:grid-cols-3 gap-3">
                  {/* Activité récente */}
                  <div className="md:col-span-2 bg-white dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-3">Activité récente</p>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Kofi A.',  action: 'Dossier consulté',   time: 'Il y a 2 min',  dot: 'bg-brand' },
                        { name: 'Ama S.',   action: 'QR Code scanné',     time: 'Il y a 8 min',  dot: 'bg-blue-400' },
                        { name: 'Kwame D.', action: 'Ordonnance ajoutée', time: 'Il y a 15 min', dot: 'bg-violet-400' },
                      ].map(({ name, action, time, dot }) => (
                        <div key={name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${dot} flex-shrink-0`} />
                            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">{name}</span>
                            <span className="text-xs text-slate-400 dark:text-zinc-500">{action}</span>
                          </div>
                          <span className="text-[10px] text-slate-300 dark:text-zinc-600">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* QR Code card */}
                  <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-brand" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 text-center">Identité QR</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">Scan pour accès instantané</p>
                    <div className="mt-1 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> Actif
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fondu bas pour découpe propre */}
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none dark:hidden"
              style={{ background: 'linear-gradient(to top, #f1f5f9, transparent)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none hidden dark:block"
              style={{ background: 'linear-gradient(to top, #09090b, transparent)' }} />
          </div>
        </section>

        {/* ══════════════════════════ STATS ══════════════════════════ */}
        <section className="py-14 bg-emerald-950 dark:bg-emerald-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '150+',    label: 'Centres de Santé',  Icon: Building2    },
                { value: '50 000+', label: 'Patients Actifs',   Icon: Users        },
                { value: '200+',    label: 'Spécialistes',      Icon: Stethoscope  },
                { value: '99.9%',   label: 'Disponibilité',     Icon: Server       },
              ].map((s, i) => (
                <div key={s.label} className="anim-up flex flex-col items-center gap-3" {...d(i * 80)}>
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <s.Icon className="h-6 w-6 text-brand" />
                  </div>
                  <p className="text-4xl font-extrabold text-brand">{s.value}</p>
                  <p className="text-sm text-white/80 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════ FONCTIONNALITÉS ══════════════════════════ */}
        <section id="fonctionnalites" className="relative py-24 bg-slate-50 dark:bg-zinc-950 overflow-hidden">
          {/* Flottants */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-10 right-[5%] animate-float opacity-50" style={{ animationDelay: '0.3s', animationDuration: '5s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-3 shadow-md border border-slate-100 dark:border-zinc-800">
                <Brain className="h-6 w-6 text-violet-400" />
              </div>
            </div>
            <div className="absolute bottom-16 left-[4%] animate-float opacity-45" style={{ animationDelay: '1.2s', animationDuration: '6s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-3 shadow-md border border-slate-100 dark:border-zinc-800">
                <Smartphone className="h-6 w-6 text-brand" />
              </div>
            </div>
            <div className="absolute top-1/2 left-[2%] animate-float opacity-35" style={{ animationDelay: '2.2s', animationDuration: '7s' }}>
              <div className="bg-brand/10 rounded-xl p-2.5 border border-brand/20">
                <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 8h-4V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z"/>
                </svg>
              </div>
            </div>
            <div className="absolute bottom-24 right-[3%] animate-float opacity-40" style={{ animationDelay: '0.7s', animationDuration: '5.5s' }}>
              <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-2.5 border border-rose-100 dark:border-rose-900/40">
                <AlertCircle className="h-5 w-5 text-rose-400" />
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 anim-up">
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Innovation Santé</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
                Tout ce dont vous avez besoin
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 max-w-lg mx-auto text-base">
                Conçu pour simplifier la gestion médicale tout en garantissant une expérience utilisateur fluide pour tous.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: QrCode,
                  title: 'Identité QR Code',
                  desc: 'Identifiez-vous instantanément dans n\'importe quel centre de santé partenaire grâce à votre code QR unique.',
                  d: 0,
                },
                {
                  icon: Brain,
                  title: 'Intelligence Artificielle',
                  desc: 'Assistance au diagnostic et analyse de données pour aider les praticiens à prendre des décisions éclairées.',
                  d: 80,
                },
                {
                  icon: Shield,
                  title: 'Sécurité Maximale',
                  desc: 'Chiffrement de bout en bout et hébergement sécurisé conforme aux standards internationaux de protection.',
                  d: 160,
                },
                {
                  icon: Users,
                  title: 'Multi-spécialités',
                  desc: 'De la cardiologie à la pédiatrie, un dossier unique qui suit votre parcours médical complet.',
                  d: 0,
                },
                {
                  icon: AlertCircle,
                  title: 'Mode Urgence',
                  desc: 'Accès vital aux informations critiques (groupe sanguin, allergies) en cas d\'urgence absolue.',
                  d: 80,
                },
                {
                  icon: Smartphone,
                  title: 'App Mobile Native',
                  desc: 'Votre santé dans votre poche. Consultez vos résultats et gérez vos rendez-vous en quelques clics.',
                  d: 160,
                },
              ].map((feat) => {
                const Icon = feat.icon
                return (
                  <div
                    key={feat.title}
                    className="anim-up group bg-white dark:bg-zinc-950 rounded-2xl p-7 border border-slate-100/50 dark:border-zinc-800/40 hover:border-brand/20 dark:hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300"
                    {...d(feat.d)}
                  >
                    <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-5 group-hover:bg-brand/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="h-6 w-6 text-brand transition-transform duration-300 group-hover:rotate-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand transition-colors duration-300">{feat.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════ COMMENT ÇA MARCHE ══════════════════════════ */}
        <section id="comment" className="relative py-24 bg-white dark:bg-zinc-950 overflow-hidden">
          {/* Flottants */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-12 left-[5%] animate-float opacity-50" style={{ animationDelay: '0.5s', animationDuration: '5.5s' }}>
              <div className="bg-brand/10 rounded-2xl px-4 py-3 border border-brand/20 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-brand flex-shrink-0" />
                <span className="text-xs font-semibold text-brand">Scan QR</span>
              </div>
            </div>
            <div className="absolute top-16 right-[6%] animate-float opacity-45" style={{ animationDelay: '1.5s', animationDuration: '6.5s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl p-3 shadow-md border border-slate-100 dark:border-zinc-800">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="absolute bottom-20 right-[5%] animate-float opacity-40" style={{ animationDelay: '0.9s', animationDuration: '4.8s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-none">Suivi actif</p>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">Mise à jour</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-16 left-[6%] animate-float opacity-35" style={{ animationDelay: '2.1s', animationDuration: '7s' }}>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 border border-blue-100 dark:border-blue-900/40">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 anim-up">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Comment ça marche ?</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-base">Un processus simple pour une prise en charge optimale.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Ligne de connexion */}
              <div className="hidden md:block absolute top-9 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-0.5 bg-slate-200 dark:bg-zinc-950" />

              {[
                { step: '1', title: 'Inscription',    desc: 'Créez votre profil en quelques minutes avec vos informations de base.', d: 0 },
                { step: '2', title: 'Identification', desc: 'Présentez votre QR Code lors de votre arrivée au centre de santé.', d: 100 },
                { step: '3', title: 'Consultation',   desc: 'Le médecin accède à votre historique et met à jour votre dossier.', d: 200 },
                { step: '4', title: 'Suivi Digital',  desc: 'Retrouvez vos prescriptions et comptes-rendus sur votre espace.', d: 300 },
              ].map((item) => (
                <div key={item.step} className="anim-up flex flex-col items-center text-center relative z-10" {...d(item.d)}>
                  <div className="w-18 h-18 w-[4.5rem] h-[4.5rem] rounded-full bg-brand flex items-center justify-center text-white text-xl font-extrabold border-4 border-white dark:border-zinc-900 shadow-lg shadow-brand/20 mb-5 flex-shrink-0">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════ SÉCURITÉ ══════════════════════════ */}
        <section id="securite" className="py-24 bg-emerald-950 dark:bg-emerald-950 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(33,196,136,0.15),transparent_60%)]" />
          {/* Flottants */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-10 left-[5%] animate-float opacity-40" style={{ animationDelay: '0.4s', animationDuration: '5s' }}>
              <div className="bg-brand/20 rounded-2xl p-3 border border-brand/30">
                <Lock className="h-6 w-6 text-brand" />
              </div>
            </div>
            <div className="absolute bottom-14 left-[8%] animate-float opacity-35" style={{ animationDelay: '1.6s', animationDuration: '6s' }}>
              <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 flex items-center gap-2 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 text-brand flex-shrink-0" />
                <span className="text-xs font-semibold text-white/80">AES-256</span>
              </div>
            </div>
            <div className="absolute top-1/3 right-[2%] animate-float opacity-30" style={{ animationDelay: '2.4s', animationDuration: '7.5s' }}>
              <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 backdrop-blur-sm">
                <Key className="h-5 w-5 text-brand" />
              </div>
            </div>
            <div className="absolute bottom-10 right-[10%] animate-float opacity-35" style={{ animationDelay: '0.8s', animationDuration: '5.8s' }}>
              <div className="bg-brand/20 rounded-xl p-2.5 border border-brand/30">
                <CheckCircle className="h-5 w-5 text-brand" />
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Texte */}
              <div className="anim-left">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-10 leading-tight">
                  Votre confiance est notre priorité absolue
                </h2>
                <ul className="space-y-7">
                  {[
                    {
                      icon: Lock,
                      title: 'Données Chiffrées',
                      desc: 'Toutes les informations médicales sont cryptées avec les protocoles les plus robustes (AES-256).',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Conformité RGPD & Locale',
                      desc: 'Nous respectons scrupuleusement les lois togolaises et internationales sur la protection de la vie privée.',
                    },
                    {
                      icon: CheckCircle,
                      title: 'Contrôle Total',
                      desc: 'Vous restez le seul maître de vos données. Vous décidez qui peut accéder à votre dossier et quand.',
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.title} className="flex items-start gap-4">
                        <div className="h-9 w-9 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem] text-brand" />
                        </div>
                        <div>
                          <h5 className="font-bold text-white mb-1">{item.title}</h5>
                          <p className="text-sm text-emerald-200/70 leading-relaxed">{item.desc}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Icône bouclier */}
              <div className="anim-right flex items-center justify-center">
                <div className="relative">
                  {/* Cercles décoratifs */}
                  <div className="w-72 h-72 rounded-full border border-brand/15 flex items-center justify-center">
                    <div className="w-52 h-52 rounded-full border border-brand/20 flex items-center justify-center">
                      <div className="w-36 h-36 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
                        <ShieldCheck className="h-16 w-16 text-brand" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                  {/* Points lumineux */}
                  <div className="absolute top-6 right-8 h-2.5 w-2.5 rounded-full bg-brand animate-pulse" />
                  <div className="absolute bottom-10 left-4 h-2 w-2 rounded-full bg-brand/60 animate-pulse" style={{ animationDelay: '500ms' }} />
                  <div className="absolute top-1/2 -right-2 h-1.5 w-1.5 rounded-full bg-brand/80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ IMPACT / CTA ══════════════════════════ */}
        <section id="impact" className="relative py-24 bg-white dark:bg-zinc-950 overflow-hidden">
          {/* Flottants */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-14 left-[4%] animate-float opacity-50" style={{ animationDelay: '0.6s', animationDuration: '5.2s' }}>
              <div className="bg-brand/10 rounded-2xl p-3 border border-brand/20">
                <Heart className="h-6 w-6 text-rose-400 fill-rose-300" />
              </div>
            </div>
            <div className="absolute top-10 right-[5%] animate-float opacity-45" style={{ animationDelay: '1.3s', animationDuration: '6.2s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-none">50 000+</p>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">Patients actifs</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-20 left-[7%] animate-float opacity-40" style={{ animationDelay: '2s', animationDuration: '7s' }}>
              <div className="bg-white dark:bg-zinc-950 rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">97% satisfaction</span>
              </div>
            </div>
            <div className="absolute bottom-16 right-[6%] animate-float opacity-40" style={{ animationDelay: '0.2s', animationDuration: '5.7s' }}>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-3 border border-emerald-100 dark:border-emerald-900/40">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="anim-up">
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Impact</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
                Rejoignez la révolution de la santé numérique
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-base max-w-2xl mx-auto mb-10">
                Alafiya Plus transforme l&apos;accès aux soins pour des milliers de patients et professionnels de santé à travers le Togo.
              </p>

              {/* Mini stats impact */}
              <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-12">
                {[
                  { value: '97%', label: 'de satisfaction' },
                  { value: '3×',  label: 'plus rapide' },
                  { value: '0',   label: 'perte de dossier' },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800">
                    <p className="text-2xl font-extrabold text-brand mb-1">{s.value}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand/25 hover:scale-105 transition-all">
                  Commencer maintenant <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:contact@alafiya.tg" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                  <Mail className="h-4 w-4" /> Nous contacter
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ FOOTER ══════════════════════════ */}
        <footer className="bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-4 gap-12">

              {/* Brand */}
              <div className="space-y-5">
                <Link href="/" className="flex items-center gap-2.5">
                  <LogoIcon className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Alafiya <span className="text-brand">Plus</span>
                  </span>
                </Link>
                <p className="text-sm text-slate-400 dark:text-zinc-500 leading-relaxed">
                  La solution de santé numérique de référence au Togo.
                </p>
                <div className="flex gap-2">
                  <a href="#" className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-zinc-950 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-brand hover:text-white transition-all">
                    <Facebook className="h-4 w-4" />
                  </a>
                  <a href="#" className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-zinc-950 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-brand hover:text-white transition-all">
                    <Twitter className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Navigation</p>
                <ul className="space-y-3.5">
                  {[
                    { href: '#accueil',         label: 'Accueil' },
                    { href: '#fonctionnalites', label: 'Fonctionnalités' },
                    { href: '#comment',         label: 'Comment ça marche' },
                    { href: '#securite',        label: 'Sécurité' },
                    { href: '#impact',          label: 'Impact' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <a href={href} className="text-sm text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Support</p>
                <ul className="space-y-3.5">
                  {["Aide en ligne", "Sécurité & Confidentialité", "Conditions d'utilisation", "Nous contacter"].map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Contact</p>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3 text-sm text-slate-500 dark:text-zinc-400">
                    <MapPin className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                    Lomé, Togo — Boulevard du 13 Janvier
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
                    <Phone className="h-4 w-4 text-brand flex-shrink-0" />
                    +228 00 00 00 00
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
                    <Mail className="h-4 w-4 text-brand flex-shrink-0" />
                    contact@alafiya.tg
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Barre basse */}
          <div className="border-t border-slate-100 dark:border-zinc-800/50 py-5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400 dark:text-zinc-600">© 2024 Alafiya Plus. Tous droits réservés.</p>
              <div className="flex items-center gap-6">
                {['Confidentialité', 'Mentions légales', 'Cookies'].map((l) => (
                  <a key={l} href="#" className="text-xs text-slate-400 dark:text-zinc-600 hover:text-brand transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
