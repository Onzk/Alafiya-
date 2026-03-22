'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogoIcon } from '@/components/ui/logo'
import {
  QrCode, Brain, Shield, Users, Smartphone, CheckCircle,
  ArrowRight, Lock, Activity, Play,
  ShieldCheck, Heart, AlertCircle, Building2, Stethoscope,
  Server, Key, Star, Globe, Zap,
} from 'lucide-react'

/* ─────────────────────────────────────────
   Hook : scroll-reveal
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

/* délai inline */
function d(ms: number) { return { style: { transitionDelay: `${ms}ms` } } }

/* ─────────────────────────────────────────
   Données statiques
───────────────────────────────────────── */
const STATS = [
  { value: '150+',    label: 'Centres de Santé', Icon: Building2   },
  { value: '50 000+', label: 'Patients Actifs',  Icon: Users       },
  { value: '200+',    label: 'Spécialistes',      Icon: Stethoscope },
  { value: '99.9%',   label: 'Disponibilité',     Icon: Server      },
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
  'Renouvellement simple chaque année',
]

const DOCTOR_BENEFITS = [
  'Accès instantané à l\'historique complet du patient',
  'Dictée vocale pour réduire le temps de saisie',
  'Gestion fine des droits par spécialité médicale',
  'Tableau de bord administrateur pour votre équipe',
  'Traçabilité complète de toutes les actions',
]

const PARTNER_BENEFITS = [
  { icon: Zap,        title: 'Intégration rapide',      desc: 'Mise en place en quelques jours sans interruption de service.' },
  { icon: Globe,      title: 'Réseau national',          desc: 'Rejoignez +150 centres déjà connectés à travers le Togo.' },
  { icon: ShieldCheck, title: 'Sécurité certifiée',      desc: 'Infrastructure sécurisée, données hébergées localement.' },
  { icon: Star,       title: 'Support dédié',            desc: 'Formation complète et accompagnement continu de vos équipes.' },
]

const FEATURE_TEASERS = [
  { icon: QrCode,    title: 'Identité QR Code',       href: '/fonctionnalites' },
  { icon: Brain,     title: 'Dictée vocale IA',         href: '/fonctionnalites' },
  { icon: Shield,    title: 'Sécurité maximale',        href: '/fonctionnalites' },
  { icon: AlertCircle, title: 'Mode Urgence',           href: '/fonctionnalites' },
  { icon: Users,     title: 'Multi-spécialités',        href: '/fonctionnalites' },
  { icon: Smartphone, title: 'Application mobile',     href: '/fonctionnalites' },
]

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function AccueilPage() {
  useScrollReveal()

  return (
    <>
      {/* Styles animations */}
      <style>{`
        .anim-up    { opacity:0; transform:translateY(28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-left  { opacity:0; transform:translateX(-28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-right { opacity:0; transform:translateX(28px); transition:opacity .6s ease,transform .6s ease; }
        .anim-fade  { opacity:0; transition:opacity .7s ease; }
        .anim-visible { opacity:1 !important; transform:none !important; }
      `}</style>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative bg-white dark:bg-zinc-950 overflow-hidden pt-24 pb-0">

        {/* Glows de fond */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.12) 0%, transparent 70%)' }} />
          <div className="absolute top-32 left-0 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.06) 0%, transparent 70%)' }} />
          <div className="absolute top-32 right-0 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(20,184,166,0.06) 0%, transparent 70%)' }} />
        </div>

        {/* Icônes flottantes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-16 left-[6%] animate-float opacity-70" style={{ animationDelay: '0s', animationDuration: '4s' }}>
            <div className="vitrine-card rounded-2xl p-3 shadow-lg border border-slate-100 dark:border-zinc-800">
              <QrCode className="h-7 w-7 text-brand" />
            </div>
          </div>
          <div className="absolute top-20 right-[7%] animate-float opacity-60" style={{ animationDelay: '0.8s', animationDuration: '5s' }}>
            <div className="bg-brand/10 rounded-2xl p-3 shadow-sm border border-brand/20">
              <svg className="h-7 w-7 text-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 8h-4V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z" />
              </svg>
            </div>
          </div>
          <div className="absolute top-[38%] left-[3%] animate-float opacity-50" style={{ animationDelay: '1.4s', animationDuration: '6s' }}>
            <div className="vitrine-card rounded-2xl p-3 shadow-md border border-slate-100 dark:border-zinc-800">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <div className="absolute top-[35%] right-[4%] animate-float opacity-65" style={{ animationDelay: '0.4s', animationDuration: '4.5s' }}>
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-3 shadow-sm border border-rose-100 dark:border-rose-900/40">
              <Heart className="h-6 w-6 text-rose-400 fill-rose-400" />
            </div>
          </div>
          <div className="absolute top-[58%] left-[8%] animate-float opacity-55" style={{ animationDelay: '2s', animationDuration: '5.5s' }}>
            <div className="vitrine-card rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-none">ECG Normal</p>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">72 bpm</p>
              </div>
            </div>
          </div>
          <div className="absolute top-[60%] right-[6%] animate-float opacity-70" style={{ animationDelay: '1s', animationDuration: '4.8s' }}>
            <div className="vitrine-card rounded-2xl px-4 py-3 shadow-md border border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-brand flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-none">Dossier validé</p>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">ALF-2025-00847</p>
              </div>
            </div>
          </div>
          <div className="absolute top-12 left-[28%] animate-float opacity-40" style={{ animationDelay: '1.8s', animationDuration: '6.5s' }}>
            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-2.5 shadow-sm border border-violet-100 dark:border-violet-900/40">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
          </div>
          <div className="absolute top-14 right-[27%] animate-float opacity-40" style={{ animationDelay: '2.5s', animationDuration: '5.8s' }}>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 shadow-sm border border-blue-100 dark:border-blue-900/40">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Contenu Hero */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <div className="anim-fade inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Plateforme nationale de santé numérique — Togo
          </div>

          <h1 className="anim-up text-5xl md:text-6xl lg:text-[72px] font-extrabold text-slate-900 dark:text-white leading-[1.06] tracking-tight mb-6">
            Votre dossier médical,<br />
            <span className="text-brand">partout, en un scan.</span>
          </h1>

          <p className="anim-up text-lg md:text-xl text-slate-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-10" {...d(100)}>
            Alafiya centralise et sécurise les dossiers médicaux. Patients et professionnels de santé
            connectés sur une seule plateforme, accessible depuis n&apos;importe quel centre partenaire.
          </p>

          <div className="anim-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-10" {...d(180)}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:shadow-brand/30 hover:-translate-y-0.5 transition-all"
            >
              Commencer gratuitement <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2.5 text-slate-600 dark:text-zinc-300 px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
              <span className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Play className="h-3.5 w-3.5 text-brand fill-brand" />
              </span>
              Voir les fonctionnalités
            </Link>
          </div>

          {/* Preuve sociale */}
          <div className="anim-fade flex items-center justify-center gap-3 mb-16" {...d(260)}>
            <div className="flex -space-x-2.5">
              {['bg-emerald-400', 'bg-teal-500', 'bg-green-400', 'bg-emerald-600', 'bg-cyan-500'].map((c, i) => (
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
          <div className="absolute -inset-x-10 top-6 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.18) 0%, transparent 70%)' }} />

          <div className="anim-up relative rounded-t-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-[0_20px_80px_-10px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_80px_-10px_rgba(0,0,0,0.5)] overflow-hidden" {...d(300)}>
            {/* Barre navigateur */}
            <div className="flex items-center gap-2 px-4 py-3 vitrine-card-muted border-b border-slate-200/60 dark:border-zinc-800/60">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
              <span className="h-3 w-3 rounded-full bg-green-400/80" />
              <div className="ml-3 flex-1 max-w-xs bg-slate-200 dark:bg-zinc-800 rounded-md h-5 flex items-center px-3">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">app.alafiya.tg/dashboard</span>
              </div>
            </div>

            {/* Dashboard simulé */}
            <div className="vitrine-card-muted p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Patients actifs',  value: '12 847', Icon: Users,       color: 'text-brand bg-brand/10' },
                  { label: 'Consultations',     value: '3 204',  Icon: Activity,    color: 'text-blue-500 bg-blue-500/10' },
                  { label: 'Dossiers validés',  value: '98.4%',  Icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10' },
                  { label: 'Centres connectés', value: '150+',   Icon: Building2,   color: 'text-violet-500 bg-violet-500/10' },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="bg-white dark:bg-zinc-950 rounded-xl p-3.5 border border-slate-100 dark:border-zinc-800">
                    <div className={`h-7 w-7 rounded-lg ${color} flex items-center justify-center mb-2.5`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white leading-none mb-1">{value}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>

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

                {/* QR Card */}
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

          {/* Fondu bas */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none dark:hidden"
            style={{ background: 'linear-gradient(to top, #f1f5f9, transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none hidden dark:block"
            style={{ background: 'linear-gradient(to top, #09090b, transparent)' }} />
        </div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section className="py-14 bg-emerald-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label, Icon }, i) => (
              <div key={label} className="anim-up flex flex-col items-center gap-3" {...d(i * 80)}>
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-brand" />
                </div>
                <p className="text-4xl font-extrabold text-brand">{value}</p>
                <p className="text-sm text-white/80 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TEASERS PAGES ══════════════ */}
      <section className="py-24 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Découvrir</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Une plateforme complète
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
              Tout ce dont patients, médecins et centres de santé ont besoin, réuni en un seul endroit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {FEATURE_TEASERS.map(({ icon: Icon, title, href }, i) => (
              <Link
                key={title}
                href={href}
                className="anim-up group vitrine-card rounded-2xl p-6 border border-slate-100/50 dark:border-zinc-800/40 hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4"
                {...d(i * 60)}
              >
                <div className="h-11 w-11 rounded-2xl bg-brand/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <span className="font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-brand transition-colors duration-300">
                  {title}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 ml-auto group-hover:text-brand group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* CTA vers pages internes */}
          <div className="grid sm:grid-cols-3 gap-4 anim-up" {...d(200)}>
            <Link
              href="/partenaires"
              className="flex flex-col gap-3 vitrine-card rounded-2xl p-7 border border-slate-100 dark:border-zinc-800 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 transition-all group"
            >
              <Building2 className="h-8 w-8 text-brand" />
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">Centres de santé</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Découvrez comment rejoindre notre réseau de partenaires.
              </p>
              <span className="text-xs font-semibold text-brand flex items-center gap-1 mt-auto">
                En savoir plus <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              href="/a-propos"
              className="flex flex-col gap-3 bg-emerald-950 rounded-2xl p-7 border border-emerald-900/50 hover:-translate-y-0.5 transition-all group"
            >
              <ShieldCheck className="h-8 w-8 text-brand" />
              <h3 className="font-bold text-white">Sous autorisation nationale</h3>
              <p className="text-sm text-emerald-200/70 leading-relaxed">
                Accord écrit du Ministère de la Santé Togolaise.
              </p>
              <span className="text-xs font-semibold text-brand flex items-center gap-1 mt-auto">
                À propos de nous <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              href="/contact"
              className="flex flex-col gap-3 vitrine-card rounded-2xl p-7 border border-slate-100 dark:border-zinc-800 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 transition-all group"
            >
              <Key className="h-8 w-8 text-brand" />
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">Prendre contact</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Une question ? Notre équipe vous répond rapidement.
              </p>
              <span className="text-xs font-semibold text-brand flex items-center gap-1 mt-auto">
                Nous écrire <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ COMMENT ÇA MARCHE ══════════════ */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Processus</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 text-base max-w-xl mx-auto">
              Un processus simple et rapide pour une prise en charge optimale à chaque visite.
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

          <div className="mt-14 text-center anim-up" {...d(400)}>
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2 text-brand font-semibold text-sm hover:underline"
            >
              Voir toutes les fonctionnalités <ArrowRight className="h-4 w-4" />
            </Link>
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

      {/* ══════════════ CENTRES PARTENAIRES TEASER ══════════════ */}
      <section className="py-24 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Texte */}
            <div className="anim-left">
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-4">Centres de santé</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-5 leading-tight">
                Rejoignez le réseau<br />
                <span className="text-brand">Alafiya</span>
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
                Intégrez Alafiya à votre centre de santé et offrez à vos patients une expérience
                numérique moderne — dossiers partagés, QR code, dictée vocale et bien plus.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/partenaires"
                  className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:-translate-y-0.5 transition-all"
                >
                  Devenir partenaire <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-6 py-3 rounded-xl font-semibold text-sm hover:border-brand/30 hover:text-brand transition-colors"
                >
                  Nous contacter
                </Link>
              </div>
            </div>

            {/* Grille avantages */}
            <div className="anim-right grid sm:grid-cols-2 gap-4">
              {PARTNER_BENEFITS.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="vitrine-card-muted rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 hover:border-brand/20 hover:shadow-md transition-all"
                  {...d(i * 80)}
                >
                  <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm mb-1">{title}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ AUTORISATION MINISTÈRE ══════════════ */}
      <section className="py-20 bg-emerald-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center anim-up">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand/20 border border-brand/30 mb-6">
            <ShieldCheck className="h-8 w-8 text-brand" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
            Accord écrit du Ministère de la Santé du Togo
          </h2>
          <p className="text-emerald-200/70 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Alafiya est la seule plateforme de dossiers médicaux numériques opérant avec
            une autorisation officielle du Ministère de la Santé de la République Togolaise.
            Vos données sont protégées par le cadre réglementaire national.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/a-propos"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-7 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:scale-105 transition-all"
            >
              En savoir plus <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2 border border-white/20 text-white px-7 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Voir les garanties de sécurité
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center anim-up">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-5">
            Prêt à rejoindre Alafiya ?
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8 max-w-xl mx-auto">
            Rejoignez les milliers de patients et professionnels qui font déjà confiance
            à la première plateforme nationale de santé numérique du Togo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand/25 hover:scale-105 transition-all"
            >
              Commencer maintenant <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 px-8 py-3.5 rounded-xl font-semibold hover:border-brand/30 hover:text-brand transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
