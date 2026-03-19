'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

/* ═══════════════════════════════════════════
   Logo — fond blanc pour visibilité garantie
═══════════════════════════════════════════ */
function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex-shrink-0 bg-white rounded-xl border border-slate-100 dark:border-zinc-700 flex items-center justify-center shadow-sm"
      style={{ width: size + 8, height: size + 8 }}
    >
      <Image src="/logo.png" alt="Alafiya" width={size} height={size} className="rounded-lg" priority />
    </div>
  )
}

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
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <Logo size={28} />
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Alafia <span className="text-brand">Plus</span>
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
        <section id="accueil" className="bg-slate-50 dark:bg-zinc-950 pt-16 pb-20 overflow-hidden sm:min-h-[90vh] flex justify-center items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Texte gauche */}
              <div>
                <div className="anim-fade inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Plateforme nationale de santé
                </div>

                <h1 className="anim-up text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-6" style={{ animationDelay: '100ms' }}>
                  Le futur du dossier{' '}
                  <span className="text-brand">médical</span>{' '}
                  au Togo
                </h1>

                <p className="anim-up text-lg text-slate-600 dark:text-zinc-400 leading-relaxed mb-10 max-w-lg" style={{ animationDelay: '200ms' }}>
                  Une plateforme centralisée et sécurisée pour les patients et les professionnels de santé.
                  Accédez à vos soins, partout et à tout moment.
                </p>

                <div className="anim-up flex flex-col sm:flex-row gap-4" style={{ animationDelay: '300ms' }}>
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-brand/25 hover:scale-105 transition-all">
                    Commencer maintenant
                  </Link>
                  <button className="inline-flex items-center justify-center gap-2 text-slate-700 dark:text-zinc-300 px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                    <span className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <Play className="h-3.5 w-3.5 text-brand fill-brand" />
                    </span>
                    Voir la démo
                  </button>
                </div>
              </div>

              {/* Mockup droite */}
              <div className="anim-right relative flex justify-center" style={{ animationDelay: '200ms' }}>
                {/* Glow */}
                <div className="absolute inset-8 bg-brand/10 rounded-3xl blur-2xl pointer-events-none" />

                {/* Card principale — simule l'interface */}
                <div className="relative w-full max-w-sm">
                  {/* Badge flottant haut droite */}
                  <div className="absolute -top-6 -right-4 z-20 flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-full px-3 py-1.5 shadow-lg border border-slate-100 dark:border-zinc-700">
                    <span className="h-5 w-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-brand" />
                    </span>
                    <div className="leading-none">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-white">Dossier Validé</p>
                      <p className="text-[9px] text-slate-500 dark:text-zinc-400">Parcours Patient</p>
                    </div>
                  </div>

                  {/* Carte principale */}
                  <div className="bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 p-5 overflow-hidden">
                    {/* Photo patient placeholder */}
                    <div className="relative h-52 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 rounded-2xl mb-4 overflow-hidden">
                      <Image
                        src="/patient-card.png"
                        alt="Patient"
                        fill
                        className="object-cover opacity-80"
                      />
                      {/* Status badge sur la photo */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-brand text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Actif
                      </div>
                    </div>

                    {/* Infos patient */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 dark:text-zinc-500">Dossier n°</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">ALF-2024-00847</p>
                        </div>
                        <div className="h-8 w-8 bg-brand/10 rounded-lg flex items-center justify-center">
                          <ShieldCheck className="h-4 w-4 text-brand" />
                        </div>
                      </div>

                      {/* Barres de santé */}
                      <div className="space-y-1.5">
                        {[
                          { label: 'Cardiologie', pct: '75' },
                          { label: 'Général', pct: '90' },
                        ].map((bar) => (
                          <div key={bar.label}>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">
                              <span>{bar.label}</span><span>{bar.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-brand rounded-full" style={{ width: `${bar.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Badge flottant bas — QR */}
                  <div className="absolute -bottom-6 left-6 z-20 flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-full px-4 py-2 shadow-lg border border-slate-100 dark:border-zinc-700">
                    <QrCode className="h-4 w-4 text-brand" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Scan QR Code</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ STATS ══════════════════════════ */}
        <section className="py-14 bg-emerald-950 dark:bg-emerald-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '150+',    label: 'Centres de Santé' },
                { value: '50 000+', label: 'Patients Actifs' },
                { value: '200+',    label: 'Spécialistes' },
                { value: '99.9%',   label: 'Disponibilité' },
              ].map((s, i) => (
                <div key={s.label} className="anim-up" {...d(i * 80)}>
                  <p className="text-4xl font-extrabold text-brand mb-1">{s.value}</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════ FONCTIONNALITÉS ══════════════════════════ */}
        <section id="fonctionnalites" className="py-24 bg-slate-50 dark:bg-zinc-950">
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
                  <div key={feat.title} className="anim-up bg-white dark:bg-zinc-950 rounded-2xl p-7 border border-slate-100 dark:border-zinc-800 hover:shadow-lg hover:-translate-y-0.5 transition-all" {...d(feat.d)}>
                    <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-5">
                      <Icon className="h-5 w-5 text-slate-500 dark:text-zinc-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════ COMMENT ÇA MARCHE ══════════════════════════ */}
        <section id="comment" className="py-24 bg-white dark:bg-zinc-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 anim-up">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Comment ça marche ?</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-base">Un processus simple pour une prise en charge optimale.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Ligne de connexion */}
              <div className="hidden md:block absolute top-9 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-0.5 bg-slate-200 dark:bg-zinc-700" />

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
        <section id="impact" className="py-24 bg-white dark:bg-zinc-950">
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
        <footer className="bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid md:grid-cols-4 gap-10">

              {/* Col 1 — Brand */}
              <div>
                <Link href="/" className="flex items-center gap-2.5 mb-4">
                  <Logo size={24} />
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Alafia <span className="text-brand">Plus</span>
                  </span>
                </Link>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                  La solution de santé numérique de référence au Togo pour un système de santé moderne, efficace et accessible à tous.
                </p>
                <div className="flex items-center gap-3">
                  <a href="#" className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-brand hover:text-white transition-colors">
                    <Facebook className="h-4 w-4" />
                  </a>
                  <a href="#" className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-brand hover:text-white transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Col 2 — Navigation */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Navigation</h4>
                <ul className="space-y-2.5">
                  {['Accueil', 'Services', 'Partenaires', 'Blog'].map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-slate-600 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3 — Support */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Support</h4>
                <ul className="space-y-2.5">
                  {['Aide en ligne', 'Sécurité & Confidentialité', "Conditions d'utilisation", 'Nous contacter'].map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-slate-600 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 4 — Contact */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Contact</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-zinc-400">
                    <MapPin className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                    Lomé, Togo, Boulevard du 13 Janvier
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-zinc-400">
                    <Phone className="h-4 w-4 text-brand flex-shrink-0" />
                    +228 00 00 00 00
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-zinc-400">
                    <Mail className="h-4 w-4 text-brand flex-shrink-0" />
                    contact@alafiya.tg
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Barre basse */}
          <div className="border-t border-slate-200 dark:border-zinc-800 py-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400 dark:text-zinc-500">© 2024 Alafia Plus. Tous droits réservés.</p>
              <div className="flex items-center gap-6">
                {['Politique de confidentialité', 'Mentions légales', 'Cookies'].map((l) => (
                  <a key={l} href="#" className="text-xs text-slate-400 dark:text-zinc-500 hover:text-brand transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
