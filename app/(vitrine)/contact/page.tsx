'use client'

import { useEffect, useState } from 'react'
import {
  Mail, MapPin, Phone, Send, CheckCircle,
  Building2, Users, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

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

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type FormState = 'idle' | 'sending' | 'sent' | 'error'

interface FormFields {
  nom: string
  email: string
  sujet: string
  message: string
}

const SUJET_OPTIONS = [
  'Je suis un patient — question générale',
  'Je représente un centre de santé',
  'Je souhaite devenir agent de terrain',
  'Demande de partenariat institutionnel',
  'Presse & médias',
  'Autre',
]

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function ContactPage() {
  useScrollReveal()

  const [form, setForm] = useState<FormFields>({ nom: '', email: '', sujet: '', message: '' })
  const [state, setState] = useState<FormState>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.email || !form.sujet || !form.message) return

    setState('sending')
    /* Simuler un envoi (brancher l'API ici) */
    await new Promise((r) => setTimeout(r, 1200))
    setState('sent')
  }

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
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="anim-fade inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Réponse sous 48h
          </div>
          <h1 className="anim-up text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
            Parlons de votre projet
          </h1>
          <p className="anim-up text-lg text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
            Patient, centre de santé ou agent de terrain — notre équipe est là pour répondre
            à toutes vos questions.
          </p>
        </div>
      </section>

      {/* ══════════════ CORPS ══════════════ */}
      <section className="py-12 pb-24 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">

            {/* ── Colonne gauche — infos + raccourcis ── */}
            <div className="lg:col-span-2 space-y-6 anim-left">

              {/* Coordonnées */}
              <div className="vitrine-card rounded-2xl p-7 border border-slate-100 dark:border-zinc-800 space-y-5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Nos coordonnées</h2>
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300">
                  <MapPin className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                  <span>Lomé, Togo</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-300">
                  <Phone className="h-4 w-4 text-brand flex-shrink-0" />
                  <span>+228 00 00 00 00</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-300">
                  <Mail className="h-4 w-4 text-brand flex-shrink-0" />
                  <a href="mailto:contact@alafiya.tg" className="hover:text-brand transition-colors">
                    contact@alafiya.tg
                  </a>
                </div>
              </div>

              {/* Raccourcis selon profil */}
              <div className="vitrine-card rounded-2xl p-7 border border-slate-100 dark:border-zinc-800 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Vous cherchez plutôt…</h2>
                <Link
                  href="/partenaires"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand/5 hover:border-brand/20 border border-transparent transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                    <Building2 className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Devenir centre partenaire</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Rejoindre le réseau Alafiya</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 ml-auto group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </Link>
                <Link
                  href="/fonctionnalites"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand/5 hover:border-brand/20 border border-transparent transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/20 transition-colors">
                    <Users className="h-4 w-4 text-teal-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Découvrir les fonctionnalités</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Ce qu&apos;Alafiya vous offre</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 ml-auto group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* ── Colonne droite — Formulaire ── */}
            <div className="lg:col-span-3 anim-right">
              <div className="vitrine-card rounded-2xl p-8 border border-slate-100 dark:border-zinc-800">

                {state === 'sent' ? (
                  /* ── Confirmation ── */
                  <div className="flex flex-col items-center justify-center text-center py-12 gap-5">
                    <div className="h-16 w-16 rounded-full bg-brand/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                        Message envoyé !
                      </h3>
                      <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-sm">
                        Merci pour votre message. Notre équipe vous répondra dans les 48 heures.
                      </p>
                    </div>
                    <button
                      onClick={() => { setForm({ nom: '', email: '', sujet: '', message: '' }); setState('idle') }}
                      className="text-sm text-brand font-semibold hover:underline"
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  /* ── Formulaire ── */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
                        Envoyez-nous un message
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Remplissez le formulaire ci-dessous, nous vous répondrons sous 48h.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Nom */}
                      <div className="space-y-1.5">
                        <label htmlFor="nom" className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">
                          Nom complet <span className="text-brand">*</span>
                        </label>
                        <input
                          id="nom"
                          name="nom"
                          type="text"
                          value={form.nom}
                          onChange={handleChange}
                          required
                          placeholder="Kofi Mensah"
                          className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">
                          Adresse e-mail <span className="text-brand">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="kofi@exemple.tg"
                          className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                        />
                      </div>
                    </div>

                    {/* Sujet */}
                    <div className="space-y-1.5">
                      <label htmlFor="sujet" className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">
                        Objet de votre message <span className="text-brand">*</span>
                      </label>
                      <select
                        id="sujet"
                        name="sujet"
                        value={form.sujet}
                        onChange={handleChange}
                        required
                        className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                      >
                        <option value="" disabled>Sélectionnez un objet…</option>
                        {SUJET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label htmlFor="message" className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">
                        Message <span className="text-brand">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Décrivez votre demande en quelques lignes…"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors resize-none"
                      />
                    </div>

                    {/* Bouton */}
                    <button
                      type="submit"
                      disabled={state === 'sending'}
                      className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:-translate-y-0.5 transition-all"
                    >
                      {state === 'sending' ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Envoi en cours…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Envoyer le message
                        </>
                      )}
                    </button>

                    <p className="text-xs text-slate-400 dark:text-zinc-600 text-center">
                      Vos données sont utilisées uniquement pour répondre à votre demande.
                    </p>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
