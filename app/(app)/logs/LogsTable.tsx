'use client'

import { useState } from 'react'
import { ScrollText, User, Globe, Monitor, FileText, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { ACTION_LABELS } from './constants'

export interface LogEntry {
  id: string
  action: string
  cible: string | null
  cibleId: string | null
  details: unknown
  ip: string | null
  userAgent: string | null
  createdAt: string | Date
  user: { nom: string; prenoms: string; email: string } | null
  centre: { nom: string } | null
}

const couleurAction: Record<string, string> = {
  LOGIN:                    'bg-brand/8 dark:bg-brand/12 border border-brand/20 text-brand',
  LOGOUT:                   'bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400',
  SCAN_QR:                  'bg-blue-50 dark:bg-blue-400/15 border border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-300',
  ENVOI_OTP:                'bg-yellow-50 dark:bg-yellow-400/15 border border-yellow-200 dark:border-yellow-400/20 text-yellow-700 dark:text-yellow-300',
  VALIDATION_OTP:           'bg-brand/8 dark:bg-brand/12 border border-brand/20 text-brand',
  ACCES_DOSSIER:            'bg-blue-50 dark:bg-blue-400/15 border border-blue-200 dark:border-blue-400/20 text-blue-700 dark:text-blue-300',
  MODIFICATION_DOSSIER:     'bg-purple-50 dark:bg-purple-400/15 border border-purple-200 dark:border-purple-400/20 text-purple-700 dark:text-purple-300',
  URGENCE_ACTIVATION:       'bg-red-50 dark:bg-red-400/15 border border-red-200 dark:border-red-400/20 text-red-700 dark:text-red-300',
  CREATION_PATIENT:         'bg-teal-50 dark:bg-teal-400/15 border border-teal-200 dark:border-teal-400/20 text-teal-700 dark:text-teal-300',
  CREATION_USER:            'bg-indigo-50 dark:bg-indigo-400/15 border border-indigo-200 dark:border-indigo-400/20 text-indigo-700 dark:text-indigo-300',
  CREATION_CENTRE:          'bg-orange-50 dark:bg-orange-400/15 border border-orange-200 dark:border-orange-400/20 text-orange-700 dark:text-orange-300',
  CREATION_ROLE:            'bg-pink-50 dark:bg-pink-400/15 border border-pink-200 dark:border-pink-400/20 text-pink-700 dark:text-pink-300',
  MODIFICATION_PERMISSIONS: 'bg-amber-50 dark:bg-amber-400/15 border border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-300',
}

interface LogGeo {
  country_name?: string
  country_code2?: string
  isp?: string
}

function getGeo(details: unknown): LogGeo {
  if (!details || typeof details !== 'object') return {}
  const d = details as Record<string, unknown>
  if (!d.geo || typeof d.geo !== 'object') return {}
  return d.geo as LogGeo
}

function getExtraDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== 'object') return {}
  const { geo: _, ...rest } = details as Record<string, unknown>
  return rest
}

function toFlag(code: string): string {
  if (!code || code.length !== 2) return ''
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  )
}

function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Navigateur inconnu'
  let os = 'OS inconnu'
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Microsoft Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera'
  else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) browser = 'Google Chrome'
  else if (ua.includes('Chromium/')) browser = 'Chromium'
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1'
  else if (ua.includes('Windows NT')) os = 'Windows'
  else if (ua.includes('iPhone')) os = 'iOS (iPhone)'
  else if (ua.includes('iPad')) os = 'iOS (iPad)'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  return { browser, os }
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 w-24 flex-shrink-0 pt-0.5 leading-tight">{label}</p>
      <div className="flex-1 min-w-0 text-sm text-slate-700 dark:text-zinc-300 break-words">{children}</div>
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</p>
    </div>
  )
}

function BadgeAction({ action }: { action: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap w-fit ${couleurAction[action] ?? 'bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400'}`}>
      {ACTION_LABELS[action] ?? action}
    </span>
  )
}

interface Props {
  logs: LogEntry[]
  activeFilters: boolean
  total: number
  page: number
  totalPages: number
}

export function LogsTable({ logs, activeFilters, total, page, totalPages }: Props) {
  const [selected, setSelected] = useState<LogEntry | null>(null)

  return (
    <>
      {/* ── TABLE desktop ── */}
      <div className="hidden lg:block bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-[170px_2fr_1.5fr_200px_155px] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
          {['Action', 'Utilisateur', 'Cible', 'IP / Localisation', 'Date'].map((h) => (
            <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{h}</span>
          ))}
        </div>
        <ul>
          {logs.map((log, i) => {
            const geo = getGeo(log.details)
            return (
              <li
                key={log.id}
                onClick={() => setSelected(log)}
                className={`dash-in delay-${[0, 50, 75, 100, 150, 200, 225, 300][Math.min(i, 7)]} grid grid-cols-[170px_2fr_1.5fr_200px_155px] items-center gap-4 px-5 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer`}
              >
                <BadgeAction action={log.action} />
                <div className="min-w-0">
                  {log.user ? (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {log.user.nom} {log.user.prenoms}
                    </p>
                  ) : (
                    <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                  )}
                  {log.centre && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 truncate mt-0.5">{log.centre.nom}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                  {log.cible ?? <span className="text-slate-300 dark:text-zinc-600">—</span>}
                </p>
                <div className="min-w-0">
                  {log.ip ? (
                    <>
                      <p className="text-xs font-mono text-slate-400 dark:text-zinc-500 truncate">{log.ip}</p>
                      {geo.country_code2 && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {toFlag(geo.country_code2)} {geo.country_name}
                        </p>
                      )}
                      {geo.isp && (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{geo.isp}</p>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-300 dark:text-zinc-600">—</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</p>
              </li>
            )
          })}
        </ul>
        <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/20">
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            {activeFilters
              ? `${total} résultat(s) · page ${page}/${totalPages || 1}`
              : `Page ${page}/${totalPages || 1} · ${total} entrée(s) au total`}
          </p>
        </div>
      </div>

      {/* ── CARDS mobile ── */}
      <div className="lg:hidden space-y-3">
        {logs.map((log, i) => {
          const geo = getGeo(log.details)
          return (
            <div
              key={log.id}
              onClick={() => setSelected(log)}
              className={`dash-in delay-${[0, 50, 75, 100, 150, 200, 225, 300][Math.min(i, 7)]} bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform`}
            >
              <div className="h-1 bg-brand" />
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <BadgeAction action={log.action} />
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 whitespace-nowrap flex-shrink-0">{formatDateTime(log.createdAt)}</span>
                </div>
                {log.user && (
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {log.user.nom} {log.user.prenoms}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {log.centre && <span className="text-xs text-slate-400 dark:text-zinc-500">{log.centre.nom}</span>}
                  {log.cible && <span className="text-xs text-slate-500 dark:text-zinc-400">{log.cible}</span>}
                </div>
                {log.ip && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">{log.ip}</span>
                    {geo.country_code2 && (
                      <span className="text-xs text-slate-500 dark:text-zinc-400">
                        {toFlag(geo.country_code2)} {geo.country_name}
                      </span>
                    )}
                    {geo.isp && (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{geo.isp}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Modal détails ── */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null) }}>
        <DialogContent className="max-w-lg">
          {selected && (() => {
            const geo = getGeo(selected.details)
            const extra = getExtraDetails(selected.details)
            const hasExtra = Object.keys(extra).length > 0
            const ua = selected.userAgent ? parseUserAgent(selected.userAgent) : null

            return (
              <>
                <DialogHeader
                  icon={ScrollText}
                  title="Détail du journal"
                  description={ACTION_LABELS[selected.action] ?? selected.action}
                />
                <div className="px-5 md:px-7 pb-5 md:pb-6 space-y-4 overflow-y-auto max-h-[70vh]">

                  {/* Action + Date */}
                  <div className="space-y-2">
                    <SectionTitle icon={ScrollText} label="Événement" />
                    <div className="space-y-1.5">
                      <InfoRow label="Action">
                        <BadgeAction action={selected.action} />
                      </InfoRow>
                      <InfoRow label="Date">
                        {formatDateTime(selected.createdAt)}
                      </InfoRow>
                      <InfoRow label="ID">
                        <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">{selected.id}</span>
                      </InfoRow>
                    </div>
                  </div>

                  {/* Utilisateur */}
                  {(selected.user || selected.centre) && (
                    <div className="space-y-2">
                      <SectionTitle icon={User} label="Utilisateur" />
                      <div className="space-y-1.5">
                        {selected.user && (
                          <>
                            <InfoRow label="Nom">
                              {selected.user.nom} {selected.user.prenoms}
                            </InfoRow>
                            <InfoRow label="Email">
                              <span className="font-mono text-xs">{selected.user.email}</span>
                            </InfoRow>
                          </>
                        )}
                        {selected.centre && (
                          <InfoRow label="Centre">{selected.centre.nom}</InfoRow>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cible */}
                  {(selected.cible || selected.cibleId) && (
                    <div className="space-y-2">
                      <SectionTitle icon={FileText} label="Cible" />
                      <div className="space-y-1.5">
                        {selected.cible && <InfoRow label="Nom">{selected.cible}</InfoRow>}
                        {selected.cibleId && (
                          <InfoRow label="ID cible">
                            <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">{selected.cibleId}</span>
                          </InfoRow>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Réseau */}
                  {selected.ip && (
                    <div className="space-y-2">
                      <SectionTitle icon={Globe} label="Réseau" />
                      <div className="space-y-1.5">
                        <InfoRow label="Adresse IP">
                          <span className="font-mono text-xs">{selected.ip}</span>
                        </InfoRow>
                        {geo.country_code2 && (
                          <InfoRow label="Pays">
                            {toFlag(geo.country_code2)} {geo.country_name}{' '}
                            <span className="text-xs text-slate-400 dark:text-zinc-500">({geo.country_code2})</span>
                          </InfoRow>
                        )}
                        {geo.isp && <InfoRow label="Opérateur">{geo.isp}</InfoRow>}
                      </div>
                    </div>
                  )}

                  {/* Navigateur */}
                  {ua && (
                    <div className="space-y-2">
                      <SectionTitle icon={Monitor} label="Navigateur" />
                      <div className="space-y-1.5">
                        <InfoRow label="Navigateur">{ua.browser}</InfoRow>
                        <InfoRow label="Système">{ua.os}</InfoRow>
                        <InfoRow label="User-Agent">
                          <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 break-all leading-relaxed">
                            {selected.userAgent}
                          </span>
                        </InfoRow>
                      </div>
                    </div>
                  )}

                  {/* Détails supplémentaires */}
                  {hasExtra && (
                    <div className="space-y-2">
                      <SectionTitle icon={FileText} label="Données supplémentaires" />
                      <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
                        <pre className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(extra, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl mt-1"
                    onClick={() => setSelected(null)}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />Fermer
                  </Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
