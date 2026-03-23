'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import {
  Camera, Lock, Eye, EyeOff,
  Loader2, Shield, Smartphone, User, Mail, BadgeCheck,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { SessionUser } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

type Section = 'profil' | 'mot-de-passe' | 'securite'

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profil',        label: 'Profil',         icon: User },
  { id: 'mot-de-passe',  label: 'Mot de passe',   icon: Lock },
  { id: 'securite',      label: 'Sécurité',        icon: Shield },
]

export function ParametresClient({ user, photo: initialPhoto }: { user: SessionUser; photo: string | null }) {
  const { update: updateSession } = useSession()
  const { toast } = useToast()

  const [activeSection, setActiveSection] = useState<Section>('profil')

  /* ── Photo ── */
  const [photo, setPhoto] = useState(initialPhoto)
  const [uploadPending, startUpload] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    startUpload(async () => {
      const res = await fetch('/api/profil', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast({ description: data.error ?? 'Erreur', variant: 'destructive' }); return }
      setPhoto(data.photo)
      toast({ description: 'Photo mise à jour', variant: 'success' })
      await updateSession()
    })
  }

  /* ── Mot de passe ── */
  const [pwd, setPwd] = useState({ ancien: '', nouveau: '', confirmer: '' })
  const [showAncien, setShowAncien] = useState(false)
  const [showNouveau, setShowNouveau] = useState(false)
  const [pwdPending, startPwd] = useTransition()

  function handlePwdSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pwd.nouveau !== pwd.confirmer) {
      toast({ description: 'Les nouveaux mots de passe ne correspondent pas', variant: 'destructive' })
      return
    }
    startPwd(async () => {
      const res = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienMotDePasse: pwd.ancien, nouveauMotDePasse: pwd.nouveau }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ description: typeof data.error === 'string' ? data.error : 'Données invalides', variant: 'destructive' })
        return
      }
      toast({ description: 'Mot de passe mis à jour avec succès', variant: 'success' })
      setPwd({ ancien: '', nouveau: '', confirmer: '' })
    })
  }

  const initials = `${user.nom[0]}${user.prenoms[0]}`
  const roleLabel =
    user.niveauAcces === 'SUPERADMIN'    ? 'Administrateur National' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Admin de centre' :
    'Personnel médical'

  return (
    <div className="max-w-4xl">

      {/* ── Mobile: horizontal tabs ── */}
      <div className="flex md:hidden overflow-x-auto border-b border-slate-100 dark:border-zinc-800 mb-5 -mx-4 px-4 gap-1 no-scrollbar">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors flex-shrink-0',
              activeSection === id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* ── Desktop: left nav ── */}
        <aside className="hidden md:block w-44 flex-shrink-0">
          <nav className="space-y-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 h-12 rounded-xl text-sm font-semibold transition-colors text-left',
                  activeSection === id
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-700 dark:hover:text-zinc-200'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Right content ── */}
        <div className="flex-1 min-w-0">

          {/* ════ Profil ════ */}
          {activeSection === 'profil' && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">
                  Photo de profil
                </p>
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
                      {photo
                        ? <Image src={photo} alt="Photo de profil" fill className="object-cover rounded-2xl" />
                        : <span className="text-brand font-extrabold text-lg">{initials}</span>
                      }
                    </div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadPending}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand/90 transition-colors disabled:opacity-60"
                    >
                      {uploadPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Camera className="h-3 w-3" />
                      }
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{user.prenoms} {user.nom}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{user.email}</p>
                    <span className="inline-flex mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand/10 dark:bg-brand/15 text-brand">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    Informations personnelles
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                    Lecture seule
                  </span>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <Field icon={User}       label="Prénom"         value={user.prenoms} />
                  <Field icon={User}       label="Nom"            value={user.nom} />
                  <Field icon={Mail}       label="Adresse e-mail" value={user.email} />
                  <Field icon={BadgeCheck} label="Rôle"           value={roleLabel} />
                </div>
                <div className="px-6 pb-4 text-[11px] text-slate-400 dark:text-zinc-500">
                  Pour modifier ces informations, contactez votre administrateur.
                </div>
              </div>
            </div>
          )}

          {/* ════ Mot de passe ════ */}
          {activeSection === 'mot-de-passe' && (
            <div className="space-y-6">

              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    Changer le mot de passe
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Minimum 8 caractères requis</p>
                </div>
                <form onSubmit={handlePwdSubmit} className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <Input
                        type={showAncien ? 'text' : 'password'}
                        value={pwd.ancien}
                        onChange={e => setPwd(p => ({ ...p, ancien: e.target.value }))}
                        required
                        // className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowAncien(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300">
                        {showAncien ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Input
                          type={showNouveau ? 'text' : 'password'}
                          value={pwd.nouveau}
                          onChange={e => setPwd(p => ({ ...p, nouveau: e.target.value }))}
                          required
                          minLength={8}
                          // className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowNouveau(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300">
                          {showNouveau ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Confirmer le nouveau
                      </label>
                      <Input
                        type="password"
                        value={pwd.confirmer}
                        onChange={e => setPwd(p => ({ ...p, confirmer: e.target.value }))}
                        required
                        // className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between mt-2">
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Utilisez un mot de passe fort et unique
                    </p>
                    <button
                      type="submit"
                      disabled={pwdPending}
                      className="h-9 px-5 rounded-xl bg-brand hover:bg-brand/90 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {pwdPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ════ Sécurité ════ */}
          {activeSection === 'securite' && (
            <div className="space-y-6">

              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Double authentification</h3>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Renforcez la sécurité de votre compte</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                    Inactif
                  </span>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 space-y-1">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Comment ça fonctionne ?</p>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                      À chaque connexion, en plus de votre mot de passe, vous devrez saisir un code à usage unique
                      généré par une application d'authentification (Google Authenticator, Authy, etc.).
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 mt-2">
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Disponible prochainement</p>
                    <button
                      disabled
                      className="h-9 px-5 rounded-xl bg-blue-500 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Activer la 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-2 border-b border-slate-100 dark:border-zinc-800">
      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h2>
      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{description}</p>
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</p>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
