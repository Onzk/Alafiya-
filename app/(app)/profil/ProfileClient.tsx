'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { SessionUser } from '@/types'

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  const base = 'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium'
  return type === 'success'
    ? <div className={`${base} bg-brand/10 dark:bg-brand/15 text-brand`}><CheckCircle2 className="h-4 w-4 flex-shrink-0" />{msg}</div>
    : <div className={`${base} bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400`}><AlertCircle className="h-4 w-4 flex-shrink-0" />{msg}</div>
}

export function ProfileClient({ user, photo: initialPhoto }: { user: SessionUser; photo: string | null }) {
  const { update: updateSession } = useSession()

  /* ── Photo ── */
  const [photo, setPhoto] = useState(initialPhoto)
  const [photoMsg, setPhotoMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [uploadPending, startUpload] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    startUpload(async () => {
      setPhotoMsg(null)
      const res = await fetch('/api/profil', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setPhotoMsg({ type: 'error', msg: data.error ?? 'Erreur' }); return }
      setPhoto(data.photo)
      setPhotoMsg({ type: 'success', msg: 'Photo mise à jour' })
      await updateSession()
    })
  }

  /* ── Mot de passe ── */
  const [pwd, setPwd] = useState({ ancien: '', nouveau: '', confirmer: '' })
  const [showAncien, setShowAncien] = useState(false)
  const [showNouveau, setShowNouveau] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [pwdPending, startPwd] = useTransition()

  function handlePwdSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pwd.nouveau !== pwd.confirmer) {
      setPwdMsg({ type: 'error', msg: 'Les nouveaux mots de passe ne correspondent pas' })
      return
    }
    startPwd(async () => {
      setPwdMsg(null)
      const res = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienMotDePasse: pwd.ancien, nouveauMotDePasse: pwd.nouveau }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = typeof data.error === 'string' ? data.error : 'Données invalides'
        setPwdMsg({ type: 'error', msg })
        return
      }
      setPwdMsg({ type: 'success', msg: 'Mot de passe mis à jour avec succès' })
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

      {/* ── Card photo + infos ── */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        {/* Bannière */}
        <div className="h-24 bg-gradient-to-r from-brand/30 via-brand/15 to-transparent dark:from-brand/20" />

        <div className="px-6 pb-6 -mt-12 flex items-end gap-4">
          {/* Avatar */}
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

          {/* Infos */}
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

        {photoMsg && (
          <div className="px-6 pb-5">
            <Alert {...photoMsg} />
          </div>
        )}

        <div className="px-6 pb-5 text-xs text-slate-400 dark:text-zinc-500">
          Formats acceptés : JPG, PNG, WEBP · Taille max : 2 Mo
        </div>
      </div>

      {/* ── Card mot de passe ── */}
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

        {pwdMsg && <div className="mb-4"><Alert {...pwdMsg} /></div>}

        <form onSubmit={handlePwdSubmit} className="space-y-4">
          {/* Ancien */}
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

          {/* Nouveau */}
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

          {/* Confirmer */}
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
    </div>
  )
}
