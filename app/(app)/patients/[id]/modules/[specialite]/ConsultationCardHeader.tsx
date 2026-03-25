'use client'

import { useState } from 'react'
import { ChevronDown, User, Building2, Phone, Mail, MapPin, Sparkles, Clock, CheckCircle2, CalendarX2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Medecin = {
  nom: string
  prenoms: string
  telephone: string | null
  photo: string | null
  role: { nom: string } | null
}

type Centre = {
  nom: string
  adresse: string
  region: string
  prefecture: string
  type: string
  telephone: string | null
  email: string | null
  logo: string | null
}

type StatutConsultation = 'EN_COURS' | 'TERMINEE' | 'REPORTEE'

const STATUT_CONFIG: Record<StatutConsultation, { label: string; Icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  EN_COURS: { label: 'En cours',  Icon: Clock,        cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  TERMINEE: { label: 'Terminée',  Icon: CheckCircle2, cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  REPORTEE: { label: 'Reportée',  Icon: CalendarX2,   cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
}

export function ConsultationCardHeader({
  jour,
  heure,
  genereParIA,
  statut,
  medecin,
  centre,
}: {
  jour: string
  heure: string
  genereParIA: boolean
  statut: StatutConsultation
  medecin: Medecin
  centre: Centre
}) {
  const statutConf = STATUT_CONFIG[statut]
  const [open, setOpen] = useState(false)

  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-800 space-y-3">

      {/* Date + heure + badges + toggle */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{jour}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">à {heure}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('inline-flex items-center gap-1 rounded-full text-xs font-medium px-2 py-0.5', statutConf.cls)}>
            <statutConf.Icon className="h-3 w-3" />
            {statutConf.label}
          </span>
          {genereParIA && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium px-2 py-0.5">
              <Sparkles className="h-3 w-3" />
              IA
            </span>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center transition-colors shrink-0',
              'border border-slate-200 dark:border-zinc-700',
              open
                ? 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                : 'bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800',
            )}
            aria-label="Voir les informations du personnel"
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', open && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Collapsible : médecin + centre */}
      {open && (
        <div className="grid gap-3 sm:grid-cols-2 pt-2">

          {/* Médecin */}
          <div className="flex items-start gap-2.5">
            {medecin.photo ? (
              <img
                src={medecin.photo}
                alt={`Dr ${medecin.nom}`}
                className="h-9 w-9 rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-zinc-700"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-zinc-700">
                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 leading-tight">
                Dr {medecin.nom} {medecin.prenoms}
              </p>
              {medecin.role && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{medecin.role.nom}</p>
              )}
              {medecin.telephone && (
                <a
                  href={`tel:${medecin.telephone}`}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mt-0.5"
                >
                  <Phone className="h-3 w-3 shrink-0" />
                  {medecin.telephone}
                </a>
              )}
            </div>
          </div>

          {/* Centre */}
          <div className="flex items-start gap-2.5">
            {centre.logo ? (
              <img
                src={centre.logo}
                alt={centre.nom}
                className="h-9 w-9 rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-zinc-700"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-zinc-700">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 leading-tight truncate">
                {centre.nom}
              </p>
              <p className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {centre.adresse}, {centre.prefecture}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {centre.telephone && (
                  <a
                    href={`tel:${centre.telephone}`}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    {centre.telephone}
                  </a>
                )}
                {centre.email && (
                  <a
                    href={`mailto:${centre.email}`}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Mail className="h-3 w-3 shrink-0" />
                    {centre.email}
                  </a>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
