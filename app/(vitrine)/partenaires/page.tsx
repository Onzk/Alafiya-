'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  Building2, CheckCircle, ArrowRight, FileText,
  Users, Brain, ShieldCheck, Activity, BarChart3, MapPin,
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
const CENTER_BENEFITS = [
  {
    icon: FileText,
    title: 'Dossiers médicaux numériques',
    desc: 'Dossiers complets et structurés pour chaque patient, accessibles et modifiables en temps réel par votre équipe médicale.',
    color: 'text-brand bg-brand/10',
  },
  {
    icon: Users,
    title: 'Accès instantané par QR Code',
    desc: 'Un simple scan suffit pour accéder à l\'historique complet d\'un patient dès son arrivée à l\'accueil.',
    color: 'text-teal-500 bg-teal-500/10',
  },
  {
    icon: Brain,
    title: 'Dictée vocale assistée par IA',
    desc: 'Réduisez le temps de saisie de vos médecins grâce à l\'assistance vocale intelligente intégrée à la plateforme.',
    color: 'text-violet-500 bg-violet-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Gestion fine des accès',
    desc: 'Définissez les droits d\'accès par spécialité médicale. Chaque professionnel ne voit que ce qui est pertinent pour son rôle.',
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    icon: Activity,
    title: 'Mode urgence automatique',
    desc: 'En cas de situation critique, la plateforme notifie automatiquement la personne de confiance du patient par SMS.',
    color: 'text-rose-500 bg-rose-500/10',
  },
  {
    icon: BarChart3,
    title: 'Tableau de bord administrateur',
    desc: 'Gérez vos équipes, suivez l\'activité du centre et supervisez les accès depuis un tableau de bord dédié.',
    color: 'text-emerald-500 bg-emerald-500/10',
  },
]

const PROCESS_STEPS = [
  {
    step: '1',
    title: 'Prise de contact',
    desc: 'Remplissez notre formulaire ou contactez notre équipe. Nous vous répondons sous 48h.',
  },
  {
    step: '2',
    title: 'Convention signée',
    desc: 'Un agent terrain Alafiya se déplace pour signer la convention de partenariat avec le responsable du centre.',
  },
  {
    step: '3',
    title: 'Formation du personnel',
    desc: 'L\'agent forme votre équipe d\'accueil et accompagne les premiers patients dans la création de leur carnet numérique.',
  },
  {
    step: '4',
    title: 'Mission active',
    desc: 'L\'agent reste deux semaines sur place pour assurer un démarrage optimal, puis fait le bilan avec votre direction.',
  },
]

const SECURITY_POINTS = [
  'Données hébergées physiquement au Togo — aucune sortie du territoire national',
  'Chiffrement SSL/TLS sur toutes les communications',
  'Traçabilité complète de toutes les actions sur la plateforme',
  'Aucune donnée transmise à des tiers',
]

/* Centre fictifs au lancement */
const LAUNCH_CENTERS = [
  { name: 'Clinique de la Paix',      zone: 'Lomé — Bè',        status: 'Partenaire actif' },
  { name: 'Hôpital de Tokoin',        zone: 'Lomé — Tokoin',     status: 'Partenaire actif' },
  { name: 'Centre Médical du Golfe',  zone: 'Lomé — Adidogomé', status: 'Partenaire actif' },
  { name: 'Polyclinique Sainte-Anne', zone: 'Lomé — Nyékonakpoè', status: 'Partenaire actif' },
  { name: 'Centre de Santé Agoè',     zone: 'Lomé — Agoè',      status: 'En cours' },
  { name: 'Clinique Olympique',       zone: 'Lomé — Baguida',   status: 'En cours' },
]

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function PartenairesPage() {
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

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative bg-white dark:bg-zinc-950 overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(33,196,136,0.1) 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="anim-fade inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Réseau de centres partenaires
          </div>
          <h1 className="anim-up text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
            Rejoignez le réseau<br />
            <span className="text-brand">Alafiya Plus</span>
          </h1>
          <p className="anim-up text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto mb-8" {...d(80)}>
            En devenant centre partenaire, vous offrez à vos patients un dossier médical numérique
            complet et accédez à une suite d&apos;outils conçus pour simplifier votre activité médicale.
          </p>
          <div className="anim-up flex flex-col sm:flex-row items-center justify-center gap-4" {...d(160)}>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand/20 hover:-translate-y-0.5 transition-all"
            >
              Devenir partenaire <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Voir les fonctionnalités
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ AVANTAGES CENTRES ══════════════ */}
      <section className="py-20 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Avantages</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Ce que votre centre gagne
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
              Un partenariat Alafiya Plus, c&apos;est une transformation complète de la gestion médicale de votre centre.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CENTER_BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <div
                  key={b.title}
                  className="anim-up group vitrine-card rounded-2xl p-7 border border-slate-100/50 dark:border-zinc-800/40 hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300"
                  {...d(i * 60)}
                >
                  <div className={`h-12 w-12 rounded-2xl ${b.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand transition-colors duration-300">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{b.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ TARIFICATION ══════════════ */}
      <section className="py-16 bg-white dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="anim-up vitrine-card-muted rounded-2xl p-8 border border-slate-100 dark:border-zinc-800 text-center">
            <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-5">
              <FileText className="h-6 w-6 text-brand" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
              Tarification souple et transparente
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
              Le prix de création du carnet médical patient est fixé <strong className="text-slate-700 dark:text-zinc-200">librement par chaque centre</strong>.
              Le patient renouvelle son carnet chaque année pour maintenir son dossier actif.
            </p>
            <p className="text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
              Les <strong className="text-slate-700 dark:text-zinc-200">conditions tarifaires du partenariat</strong> avec N&apos;di Solutions sont communiquées sur demande, lors de la prise de contact avec notre équipe.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-7 py-3 rounded-xl font-bold shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5"
            >
              Demander les conditions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ PROCESSUS D'INTÉGRATION ══════════════ */}
      <section className="py-24 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Intégration</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Un accompagnement complet
            </h2>
            <p className="text-slate-500 dark:text-zinc-400">
              Un agent terrain dédié intervient deux semaines dans votre centre pour assurer un démarrage serein.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-9 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-0.5 bg-slate-200 dark:bg-zinc-800" />
            {PROCESS_STEPS.map((item, i) => (
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

      {/* ══════════════ CENTRES AU LANCEMENT ══════════════ */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Zone de lancement</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              Grand Lomé — Année 1
            </h2>
            <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
              <MapPin className="h-4 w-4 text-brand flex-shrink-0" />
              Lomé et ses alentours — déploiement national en cours
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAUNCH_CENTERS.map((c, i) => (
              <div
                key={c.name}
                className="anim-up flex items-center gap-4 vitrine-card-muted rounded-xl p-4 border border-slate-100 dark:border-zinc-800"
                {...d(i * 60)}
              >
                <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">{c.zone}</p>
                </div>
                <span className={`ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  c.status === 'Partenaire actif'
                    ? 'bg-brand/10 text-brand'
                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SÉCURITÉ ══════════════ */}
      <section className="py-16 bg-emerald-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="anim-up text-center mb-10">
            <h2 className="text-2xl font-extrabold text-white mb-3">Vos données ne quittent jamais le Togo</h2>
            <p className="text-emerald-200/70">Hébergement national, conformité totale, traçabilité absolue.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {SECURITY_POINTS.map((point, i) => (
              <div key={i} className="anim-up flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10" {...d(i * 80)}>
                <CheckCircle className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                <span className="text-sm text-emerald-100/80 leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center anim-up">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            Prêt à transformer votre centre ?
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8">
            Contactez notre équipe pour recevoir toutes les informations sur le partenariat et les conditions tarifaires.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand/25 hover:scale-105 transition-all"
          >
            Prendre contact <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
