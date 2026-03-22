'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  ShieldCheck, CheckCircle, ArrowRight, Lock,
  Heart, Server, Users, Building2,
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
const PROBLEM_POINTS = [
  'L\'historique médical reste dans l\'ancien établissement',
  'Le nouveau médecin repart de zéro sans contexte',
  'Les examens sont répétés inutilement',
  'Les prescriptions incompatibles passent inaperçues',
  'Les erreurs médicales liées au manque d\'information coûtent des vies',
]

const VALUES = [
  {
    icon: Heart,
    title: 'Accessibilité',
    desc: 'Rendre le suivi médical complet accessible à chaque citoyen togolais, peu importe son centre de santé.',
    color: 'text-rose-500 bg-rose-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité',
    desc: 'Protéger les données de santé des Togolais avec les standards les plus rigoureux, sans jamais les exporter.',
    color: 'text-brand bg-brand/10',
  },
  {
    icon: Users,
    title: 'Inclusion',
    desc: 'Concevoir une plateforme utilisable par tous : patients, médecins, personnel d\'accueil, agents de terrain.',
    color: 'text-teal-500 bg-teal-500/10',
  },
  {
    icon: Server,
    title: 'Souveraineté numérique',
    desc: 'Héberger les données médicales nationales au Togo, sous gouvernance togolaise, sans dépendance étrangère.',
    color: 'text-blue-500 bg-blue-500/10',
  },
]

const SECURITY_GUARANTEES = [
  { icon: Lock,       text: 'Données hébergées physiquement au Togo — aucune sortie du territoire national' },
  { icon: ShieldCheck, text: 'Chiffrement SSL/TLS sur toutes les communications' },
  { icon: Users,      text: 'Accès strictement limité à la spécialité du professionnel de santé' },
  { icon: CheckCircle, text: 'Chaque accès à un dossier est tracé et horodaté' },
  { icon: Lock,       text: 'Aucune donnée transmise à des tiers' },
  { icon: Building2,  text: 'Gouvernance assurée par N\'di Solutions sous autorisation nationale' },
]

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function AProposPage() {
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
            N&apos;di Solutions — Startup togolaise
          </div>
          <h1 className="anim-up text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
            Une initiative togolaise<br />
            <span className="text-brand">pour la santé togolaise</span>
          </h1>
          <p className="anim-up text-lg text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto" {...d(80)}>
            Alafiya Plus est développée et administrée par N&apos;di Solutions, une startup privée togolaise,
            sous autorisation du Ministère de la Santé du Togo.
          </p>
        </div>
      </section>

      {/* ══════════════ ACCORD MINISTÈRE ══════════════ */}
      <section className="py-16 bg-emerald-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="anim-up flex flex-col md:flex-row items-center gap-10">

            {/* Icône */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border border-brand/20 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border border-brand/30 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-brand/15 border border-brand/40 flex items-center justify-center">
                      <ShieldCheck className="h-10 w-10 text-brand" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-5 h-2.5 w-2.5 rounded-full bg-brand animate-pulse" />
                <div className="absolute bottom-6 left-2 h-2 w-2 rounded-full bg-brand/60 animate-pulse" style={{ animationDelay: '500ms' }} />
              </div>
            </div>

            {/* Texte */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Légitimité nationale</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-tight">
                Accord écrit du Ministère de la Santé Togolaise
              </h2>
              <p className="text-emerald-200/80 leading-relaxed mb-4">
                Alafiya Plus opère avec l&apos;<strong className="text-white">autorisation écrite officielle</strong> du
                Ministère de la Santé du Togo. Cette accréditation garantit que la plateforme répond aux
                exigences réglementaires nationales en matière de gestion des données médicales.
              </p>
              <p className="text-emerald-200/80 leading-relaxed">
                Notre partenariat avec le Ministère assure une gouvernance responsable, une conformité
                aux lois togolaises sur la protection des données de santé, et la confiance des
                établissements de soins et des patients à travers tout le Togo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ QUI NOUS SOMMES ══════════════ */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            <div className="anim-left">
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Notre histoire</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
                N&apos;di Solutions
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-zinc-300 leading-relaxed">
                <p>
                  N&apos;di Solutions est une startup privée togolaise fondée avec une conviction simple :
                  la technologie peut et doit résoudre les problèmes concrets de santé publique en Afrique.
                </p>
                <p>
                  Face au constat que des milliers de patients togolais perdent leur historique médical
                  à chaque changement de centre de santé, nous avons conçu Alafiya Plus — une plateforme
                  qui centralise, sécurise et rend accessible le dossier médical de chaque patient.
                </p>
                <p>
                  Notre équipe combine expertise technique, connaissance du terrain médical togolais
                  et engagement pour la souveraineté numérique nationale.
                </p>
              </div>
            </div>

            <div className="anim-right space-y-4">
              {[
                { label: 'Fondée au', value: 'Togo' },
                { label: 'Secteur', value: 'HealthTech / GovTech' },
                { label: 'Autorisation', value: 'Ministère de la Santé du Togo' },
                { label: 'Zone de lancement', value: 'Grand Lomé et alentours' },
                { label: 'Déploiement cible', value: 'National — toutes régions' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 px-4 rounded-xl vitrine-card-muted border border-slate-100 dark:border-zinc-800"
                >
                  <span className="text-sm text-slate-500 dark:text-zinc-400">{label}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ LE PROBLÈME ══════════════ */}
      <section className="py-20 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Notre raison d&apos;être</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              Le problème que nous résolvons
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
              Au Togo, lorsqu&apos;un patient change de centre de santé, voilà ce qui se passe :
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {PROBLEM_POINTS.map((point, i) => (
              <div
                key={i}
                className="anim-up flex items-start gap-3 vitrine-card rounded-xl p-4 border border-slate-100 dark:border-zinc-800"
                {...d(i * 70)}
              >
                <span className="h-5 w-5 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                </span>
                <span className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">{point}</span>
              </div>
            ))}
          </div>

          <div className="anim-up text-center">
            <div className="inline-flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-2xl px-6 py-4">
              <CheckCircle className="h-6 w-6 text-brand flex-shrink-0" />
              <p className="text-brand font-bold text-sm md:text-base">
                Alafiya Plus met fin à ce problème.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ VALEURS ══════════════ */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 anim-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Nos engagements</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Ce en quoi nous croyons
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon
              return (
                <div
                  key={v.title}
                  className="anim-up group vitrine-card rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 text-center"
                  {...d(i * 80)}
                >
                  <div className={`h-12 w-12 rounded-2xl ${v.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ SÉCURITÉ & CONFIANCE ══════════════ */}
      <section className="py-20 bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(33,196,136,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 anim-up">
            <h2 className="text-3xl font-extrabold text-white mb-3">Sécurité & Confiance</h2>
            <p className="text-emerald-200/70">
              Votre confiance est notre priorité absolue.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {SECURITY_GUARANTEES.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="anim-up flex items-start gap-4 bg-white/5 rounded-xl p-5 border border-white/10"
                {...d(i * 80)}
              >
                <div className="h-9 w-9 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <span className="text-sm text-emerald-100/80 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center anim-up">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            Une question sur notre mission ?
          </h2>
          <p className="text-slate-500 dark:text-zinc-400 mb-8">
            Notre équipe est disponible pour répondre à toutes vos questions sur la plateforme,
            le partenariat ou notre accréditation nationale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand/25 hover:scale-105 transition-all"
            >
              Nous contacter <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/partenaires"
              className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Devenir partenaire
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
