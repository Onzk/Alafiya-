'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import Image from 'next/image'
import {
  Camera, Lock, Eye, EyeOff,
  Loader2, Shield, Smartphone, User, Mail, BadgeCheck, CreditCard, Phone,
  Building2, MapPin, ImageIcon,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { SessionUser } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

type Section = 'profil' | 'mot-de-passe' | 'securite' | 'paiement' | 'centre'

const navItemsBase: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profil',        label: 'Profil',         icon: User },
  { id: 'mot-de-passe',  label: 'Mot de passe',   icon: Lock },
  { id: 'securite',      label: 'Sécurité',        icon: Shield },
]

const navItemSuperAdmin: { id: Section; label: string; icon: React.ElementType } = {
  id: 'paiement', label: 'Paiement', icon: CreditCard,
}

const navItemAdminCentre: { id: Section; label: string; icon: React.ElementType } = {
  id: 'centre', label: 'Mon centre', icon: Building2,
}

interface InfoCentre {
  id: string
  nom: string
  adresse: string
  telephone: string
  email: string
  region: string
  prefecture: string
  type: string
  logo: string | null
  banniere: string | null
}

interface ConfigPaiement {
  mobileMoney:  string
  mobileNumero: string
  mobileNom:    string
  virementInfo: string
  contactEmail: string
  contactTel:   string
  noteFacture:  string
}

export function ParametresClient({ user, photo: initialPhoto }: { user: SessionUser; photo: string | null }) {
  const { update: updateSession } = useSession()
  const { toast } = useToast()

  const isSuperAdmin = user.niveauAcces === 'SUPERADMIN'
  const isAdminCentre = user.niveauAcces === 'ADMIN_CENTRE'
  const navItems = [
    ...navItemsBase,
    ...(isSuperAdmin ? [navItemSuperAdmin] : []),
    ...(isAdminCentre ? [navItemAdminCentre] : []),
  ]

  const [activeSection, setActiveSection] = useState<Section>('profil')

  /* ── Config paiement (superadmin) ── */
  const [config, setConfig] = useState<ConfigPaiement>({
    mobileMoney:  '', mobileNumero: '', mobileNom: '',
    virementInfo: '', contactEmail: '', contactTel: '', noteFacture: '',
  })
  const [configPending, startConfig] = useTransition()

  useEffect(() => {
    if (!isSuperAdmin) return
    fetch('/api/superadmin/configuration')
      .then(r => r.json())
      .then(d => setConfig({
        mobileMoney:  d.mobileMoney  ?? '',
        mobileNumero: d.mobileNumero ?? '',
        mobileNom:    d.mobileNom    ?? '',
        virementInfo: d.virementInfo ?? '',
        contactEmail: d.contactEmail ?? '',
        contactTel:   d.contactTel   ?? '',
        noteFacture:  d.noteFacture  ?? '',
      }))
      .catch(() => {})
  }, [isSuperAdmin])

  function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault()
    startConfig(async () => {
      const res = await fetch('/api/superadmin/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const d = await res.json()
        toast({ description: d.error ?? 'Erreur', variant: 'destructive' })
        return
      }
      toast({ description: 'Informations de paiement mises à jour', variant: 'success' })
    })
  }

  /* ── Centre (admin_centre) ── */
  const [centre, setCentre] = useState<InfoCentre | null>(null)
  const [logoUploading, startLogoUpload] = useTransition()
  const [banniereUploading, startBanniereUpload] = useTransition()
  const logoRef = useRef<HTMLInputElement>(null)
  const banniereRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAdminCentre) return
    fetch('/api/admin/centre')
      .then(r => r.json())
      .then(d => setCentre(d))
      .catch(() => {})
  }, [isAdminCentre])

  function handleImageUpload(type: 'logo' | 'banniere', file: File) {
    const startTransition = type === 'logo' ? startLogoUpload : startBanniereUpload
    startTransition(async () => {
      const fd = new FormData()
      fd.append('type', type)
      fd.append('fichier', file)
      const res = await fetch('/api/admin/centre', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast({ description: data.error ?? 'Erreur', variant: 'destructive' })
        return
      }
      setCentre(prev => prev ? { ...prev, [type]: data[type] } : prev)
      toast({ description: type === 'logo' ? 'Logo mis à jour' : 'Bannière mise à jour', variant: 'success' })
    })
  }

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
                  <Field icon={Mail}       label="Adresse e-mail" value={user.email ?? ''} />
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

          {/* ════ Paiement (superadmin) ════ */}
          {activeSection === 'paiement' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    Coordonnées de paiement
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    Informations affichées aux admins de centre dans la page de facturation
                  </p>
                </div>
                <form onSubmit={handleConfigSubmit} className="px-6 py-5 space-y-5">

                  {/* Mobile Money */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
                      Mobile Money
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                          Libellé
                        </label>
                        <Input
                          value={config.mobileMoney}
                          onChange={e => setConfig(c => ({ ...c, mobileMoney: e.target.value }))}
                          placeholder="Orange Money / MTN MoMo"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            Numéro
                          </label>
                          <Input
                            value={config.mobileNumero}
                            onChange={e => setConfig(c => ({ ...c, mobileNumero: e.target.value }))}
                            placeholder="+224 6XX XX XX XX"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            Nom du compte
                          </label>
                          <Input
                            value={config.mobileNom}
                            onChange={e => setConfig(c => ({ ...c, mobileNom: e.target.value }))}
                            placeholder="Au nom de N'di Solutions"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-zinc-800" />

                  {/* Virement bancaire */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">
                      Virement bancaire
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Description
                      </label>
                      <Input
                        value={config.virementInfo}
                        onChange={e => setConfig(c => ({ ...c, virementInfo: e.target.value }))}
                        placeholder="IBAN / RIB fourni sur demande"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-zinc-800" />

                  {/* Contact facturation */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">
                      Contact facturation
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                          E-mail
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="email"
                            value={config.contactEmail}
                            onChange={e => setConfig(c => ({ ...c, contactEmail: e.target.value }))}
                            placeholder="facturation@example.com"
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                          Téléphone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            value={config.contactTel}
                            onChange={e => setConfig(c => ({ ...c, contactTel: e.target.value }))}
                            placeholder="+224 6XX XX XX XX"
                            className="pl-9"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-zinc-800" />

                  {/* Note de bas de modal */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      Note de bas de modal
                    </label>
                    <Input
                      value={config.noteFacture}
                      onChange={e => setConfig(c => ({ ...c, noteFacture: e.target.value }))}
                      placeholder="Merci d'indiquer le numéro de facture..."
                      required
                    />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={configPending}
                      className="h-12 px-5 rounded-xl bg-brand hover:bg-brand/90 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {configPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ════ Centre (admin_centre) ════ */}
          {activeSection === 'centre' && isAdminCentre && (
            <div className="space-y-6">

              {/* Bannière */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      Image bannière
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Format recommandé : 1200 × 300 px — max 5 Mo</p>
                  </div>
                  <button
                    onClick={() => banniereRef.current?.click()}
                    disabled={banniereUploading}
                    className="h-9 px-4 rounded-xl bg-brand hover:bg-brand/90 text-white text-xs font-bold transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {banniereUploading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <ImageIcon className="h-3.5 w-3.5" />
                    }
                    {centre?.banniere ? 'Changer' : 'Ajouter'}
                  </button>
                  <input
                    ref={banniereRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload('banniere', f) }}
                  />
                </div>
                <div className="p-6">
                  {centre?.banniere ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800">
                      <Image src={centre.banniere} alt="Bannière du centre" fill className="object-cover" />
                    </div>
                  ) : (
                    <button
                      onClick={() => banniereRef.current?.click()}
                      disabled={banniereUploading}
                      className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500 hover:border-brand hover:text-brand transition-colors disabled:opacity-60"
                    >
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs font-semibold">Cliquer pour ajouter une bannière</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Logo + infos */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    Logo du centre
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Format carré recommandé — max 2 Mo</p>
                </div>
                <div className="px-6 py-5 flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="h-20 w-20 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
                      {centre?.logo
                        ? <Image src={centre.logo} alt="Logo du centre" fill className="object-cover rounded-2xl" />
                        : <Building2 className="h-8 w-8 text-brand/40" />
                      }
                    </div>
                    <button
                      onClick={() => logoRef.current?.click()}
                      disabled={logoUploading}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand/90 transition-colors disabled:opacity-60"
                    >
                      {logoUploading
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Camera className="h-3 w-3" />
                      }
                    </button>
                    <input
                      ref={logoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload('logo', f) }}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{centre?.nom ?? '…'}</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{centre?.type ?? ''}</p>
                    {centre?.logo && (
                      <span className="inline-flex mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Logo actif
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations du centre */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    Informations du centre
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                    Lecture seule
                  </span>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <Field icon={Building2} label="Nom"         value={centre?.nom ?? '…'} />
                  <Field icon={Mail}      label="E-mail"      value={centre?.email ?? '…'} />
                  <Field icon={Phone}     label="Téléphone"   value={centre?.telephone ?? '…'} />
                  <Field icon={MapPin}    label="Adresse"     value={centre?.adresse ?? '…'} />
                  <Field icon={MapPin}    label="Région"      value={centre?.region ?? '…'} />
                  <Field icon={MapPin}    label="Préfecture"  value={centre?.prefecture ?? '…'} />
                </div>
                <div className="px-6 pb-4 text-[11px] text-slate-400 dark:text-zinc-500">
                  Pour modifier ces informations, contactez l&apos;administrateur national.
                </div>
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
