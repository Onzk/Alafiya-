'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import {
  Camera, Lock, Eye, EyeOff,
  Loader2, Shield, Smartphone, User,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { SessionUser } from '@/types'
import { useToast } from '@/hooks/use-toast'

const TABS = [
  { id: 'profil',    label: 'Profil',                   icon: User },
  { id: 'password',  label: 'Mot de passe',              icon: Lock },
  { id: '2fa',       label: 'Double authentification',   icon: Smartphone },
]

export function ParametresClient({ user, photo: initialPhoto }: { user: SessionUser; photo: string | null }) {
  const { update: updateSession } = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profil')

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
    user.niveauAcces === 'MINISTERE'    ? 'Administrateur National' :
    user.niveauAcces === 'ADMIN_CENTRE' ? 'Admin de centre' :
    'Personnel médical'

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Tabs ── */}
      <div className="flex gap-0 p-1 bg-slate-100 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <div key={tab.id} className="flex-1 flex items-center">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-700'
                    : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
              {idx < TABS.length - 1 && (
                <div className="h-6 w-px bg-slate-200 dark:bg-zinc-700 mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Tab : Profil ── */}
      {activeTab === 'profil' && (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand/30 via-brand/15 to-transparent dark:from-brand/20" />

          <div className="px-6 pb-6 -mt-12 flex items-end gap-4">
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-zinc-900 shadow-md overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
                {photo
                  ? <Image src={photo} alt="Photo de profil" fill className="object-cover rounded-2xl" />
                  : <span className="text-brand font-extrabold text-xl">{initials}</span>
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadPending}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand/90 transition-colors disabled:opacity-60"
              >
                {uploadPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Camera className="h-3.5 w-3.5" />
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="pb-1">
              <p className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                {user.nom} {user.prenoms}
              </p>
              <p className="text-sm text-slate-400 dark:text-zinc-500">{user.email}</p>
              <span className="inline-flex mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand/10 dark:bg-brand/15 text-brand">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="px-6 pb-5 text-xs text-slate-400 dark:text-zinc-500">
            Formats acceptés : JPG, PNG, WEBP · Taille max : 2 Mo
          </div>
        </div>
      )}

      {/* ── Tab : Mot de passe ── */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <Lock className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Changer le mot de passe</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Minimum 8 caractères</p>
            </div>
          </div>

          <form onSubmit={handlePwdSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showAncien ? 'text' : 'password'}
                  value={pwd.ancien}
                  onChange={e => setPwd(p => ({ ...p, ancien: e.target.value }))}
                  required
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowAncien(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300">
                  {showAncien ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNouveau ? 'text' : 'password'}
                  value={pwd.nouveau}
                  onChange={e => setPwd(p => ({ ...p, nouveau: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowNouveau(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300">
                  {showNouveau ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={pwd.confirmer}
                onChange={e => setPwd(p => ({ ...p, confirmer: e.target.value }))}
                required
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={pwdPending}
              className="w-full h-10 rounded-xl bg-brand hover:bg-brand/90 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pwdPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>
      )}

      {/* ── Tab : Double authentification ── */}
      {activeTab === '2fa' && (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Double authentification (2FA)</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Renforcez la sécurité de votre compte</p>
            </div>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500">
              Inactif
            </span>
          </div>

          <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 space-y-1">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Comment ça fonctionne ?</p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
              À chaque connexion, en plus de votre mot de passe, vous devrez saisir un code à usage unique
              généré par une application d'authentification (Google Authenticator, Authy, etc.).
            </p>
          </div>

          <button
            disabled
            className="w-full h-10 rounded-xl bg-blue-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Activer la double authentification
          </button>

          <p className="text-center text-[11px] text-slate-400 dark:text-zinc-500">
            Fonctionnalité disponible prochainement
          </p>
        </div>
      )}
    </div>
  )
}
