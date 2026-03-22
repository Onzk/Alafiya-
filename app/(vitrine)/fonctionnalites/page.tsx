'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  QrCode, Brain, Shield, Users, Smartphone, AlertCircle,
  CheckCircle, ArrowRight, Lock, Activity,
} from 'lucide-react'

/* ─────────────────────────────────────────
   Hook scroll-reveal
───────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.anim-up, .anim-left, .anim-right, .anim-fade')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('anim-visible')),
      { threshold: 0.1 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function d(ms: number) { return { style: { transitionDelay: `${ms}ms` } } }

/* ─────────────────────────────────────────
   Données
───────────────────────────────────────── */
const FEATURES = [
  {
    icon: QrCode,
    title: 'Identité QR Code',
    desc: 'Un QR code unique par patient, valable à vie dans tous les centres partenaires du Togo. Identification instantanée à chaque consultation.',
    color: 'text-brand bg-brand/10',
  },
  {
    icon: Brain,
    title: 'Dictée vocale IA',
    desc: 'Assistance à la saisie par dictée vocale intelligente pour réduire le temps de documentation des médecins et limiter les erreurs.',
    color: 'text-violet-500 bg-violet-500/10',
  },
  {
    icon: Shield,
    title: 'Sécurité maximale',
    desc: 'Chiffrement SSL/TLS sur toutes les communications. Chaque accès à un dossier est tracé, horodaté et réservé à la spécialité concernée.',
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    icon: Users,
    title: 'Multi-spécialités',
    desc: 'De la cardiologie à la pédiatrie, la plateforme gère finement les accès par spécialité. Un seul dossier couvre l\'ensemble du parcours médical.',
    color: 'text-teal-500 bg-teal-500/10',
  },
  {
    icon: AlertCircle,
    title: 'Mode Urgence',
    desc: 'En cas de situation critique, la personne de confiance désignée est notifiée automatiquement par SMS. Les informations vitales restent accessibles.',
    color: 'text-rose-500 bg-rose-500/10',
  },
  {
    icon: Smartphone,
    title: 'Application mobile',
    desc: 'Consultez vos résultats, ordonnances et comptes-rendus depuis votre téléphone. Votre santé dans votre poche, à tout moment.',
    color: 'text-emerald-500 bg-emerald-500/10',
  },
]

const STEPS = [
  { step: '1', title: 'Inscription',    desc: 'Créez votre profil patient en quelques minutes auprès d\'un centre partenaire.' },
  { step: '2', title: 'Identification', desc: 'Présentez votre QR Code à chaque arrivée en centre de santé.' },
  { step: '3', title: 'Consultation',   desc: 'Le médecin accède à votre historique complet et met à jour votre dossier.' },
  { step: '4', title: 'Suivi Digital',  desc: 'Retrouvez prescriptions et comptes-rendus sur votre espace en ligne.' },
]

const PATIENT_BENEFITS = [
  'Un seul QR code pour toute la vie',
  'Dossier accessible dans tous les centres partenaires',
  'Personne de confiance notifiée en urgence par SMS',
  'Données hébergées au Togo — jamais à l\'étranger',
  'Carnet à renouveler chaque année',
]

const DOCTOR_BENEFITS = [
  'Accès instantané à l\'historique complet du patient',
  'Dictée vocale pour réduire le temps de saisie',
  'Gestion fine des droits par spécialité médicale',
  'Tableau de bord administrateur pour votre équipe',
  'Traçabilité complète de toutes les actions',
]

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function FonctionnalitesPage() {
  useScrollReveal()

  return (
    <>
      <style>{`
        .anim-up    { opacity:0; transform:translateY(28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-left  { opacity:0; transform:translateX(-28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-right { opacity:0; transform:translateX(28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-fade  { opacity:0; transition:opacity .7s ease; }
        .anim-visible { opacity:1 !important; transform:none !important; }
      `}</style>

      {/* ══════════════ HERO PAGE ══════════════ */}
      <section className="relative bg-white dark:bg-zinc-950 overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.1) 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="anim-fade inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Plateforme de santé numérique
          </div>
          <h1 className="anim-up text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
            Toutes les fonctionnalités<br />
            <span className="text-brand">pensées pour la santé</span>
          </h1>
          <p className="anim-up text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto" {...d(80)}>
            Alafiya réunit dans une seule plateforme tous les outils nécessaires aux patients,
            médecins et centres de santé pour une prise en charge optimale.
          </p>
        </div>
      </section>

      {/* ══════════════ GRILLE FEATURES ══════════════ */}
      <section className="py-20 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className="anim-up group vitrine-card rounded-2xl p-7 border border-slate-100/50 dark:border-zinc-800/40 hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300"
                  {...d(i * 60)}
                >
                  <div className={`h-12 w-12 rounded-2xl ${feat.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand transition-colors duration-300">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ COMMENT ÇA MARCHE ══════════════ */}
      <section className="py-24 bg-white dark:bg-zinc-950 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-12 left-[5%] animate-float opacity-50" style={{ animationDelay: '0.5s', animationDuration: '5.5s' }}>
            <div className="bg-brand/10 rounded-2xl px-4 py-3 border border-brand/20 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-brand flex-shrink-0" />
              <span className="text-xs font-semibold text-brand">Scan QR</span>
            </div>
          </div>
          <div className="absolute top-16 right-[6%] animate-float opacity-45" style={{ animationDelay: '1.5s', animationDuration: '6.5s' }}>
            <div className="vitrine-card rounded-2xl p-3 shadow-md border border-slate-100 dark:border-zinc-800">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <div className="absolute bottom-16 left-[6%] animate-float opacity-35" style={{ animationDelay: '2.1s', animationDuration: '7s' }}>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 border border-blue-100 dark:border-blue-900/40">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="absolute bottom-20 right-[5%] animate-float opacity-40" style={{ animationDelay: '0.9s', animationDuration: '4.8s' }}>
            <div className="vitrine-card rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-none">Suivi actif</p>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">Mise à jour</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Processus</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 text-base">
              Un processus simple pour une prise en charge optimale.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-9 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-0.5 bg-slate-200 dark:bg-zinc-800" />
            {STEPS.map((item, i) => (
              <div key={item.step} className="anim-up flex flex-col items-center text-center relative z-10" {...d(i * 100)}>
                <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-brand flex items-center justify-center text-white text-xl font-extrabold border-4 border-white dark:border-zinc-950 shadow-lg shadow-brand/20 mb-5 flex-shrink-0">
                  {item.step}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ AVANTAGES PATIENTS / MÉDECINS ══════════════ */}
      <section className="py-20 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Pour tout le monde</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Conçu pour chaque acteur de la santé
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Patients */}
            <div className="anim-left vitrine-card rounded-2xl p-8 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pour les patients</h3>
              </div>
              <ul className="space-y-3.5">
                {PATIENT_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-zinc-300">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Médecins */}
            <div className="anim-right vitrine-card rounded-2xl p-8 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-violet-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pour les professionnels</h3>
              </div>
              <ul className="space-y-3.5">
                {DOCTOR_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-zinc-300">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="py-20 bg-emerald-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center anim-up">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Prêt à rejoindre Alafiya ?
          </h2>
          <p className="text-emerald-200/70 mb-8">
            Rejoignez les milliers de patients et professionnels qui font déjà confiance à notre plateforme.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand/25 hover:scale-105 transition-all"
            >
              Commencer maintenant <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/partenaires"
              className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Devenir partenaire
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
