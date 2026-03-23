'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Receipt, Clock, CheckCircle2, AlertCircle, FileDown, Eye,
  CreditCard, Loader2, Users, Calendar, Phone, Mail,
  Building2, Info, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

/* ─── Types ─── */
interface Facture {
  id: string
  numero: string
  periodeDebut: string
  periodeFin: string
  nbCarnetsCrees: number
  nbCarnetsRenouv: number
  montantDu: number
  statut: 'EN_ATTENTE' | 'PAYE' | 'EN_RETARD'
  dateReglement: string | null
  createdAt: string
}

interface Stats {
  montantEnCours: number
  soldeImpaye: number
  totalPaye: number
  nbFactures: number
}

interface AgentDetail {
  agent: { id: string; nom: string; prenoms: string }
  count: number
}

/* ─── Helpers ─── */
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatFCFA(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function formatPeriode(debut: string, fin: string) {
  const d = new Date(debut)
  const f = new Date(fin)
  if (d.getMonth() === f.getMonth() && d.getFullYear() === f.getFullYear()) {
    return `${MOIS[d.getMonth()]} ${d.getFullYear()}`
  }
  return `${MOIS_COURT[d.getMonth()]} – ${MOIS_COURT[f.getMonth()]} ${f.getFullYear()}`
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function dateLimite(periodeFin: string) {
  const d = new Date(periodeFin)
  d.setDate(d.getDate() + 30)
  return d
}

function isEchue(f: Facture) {
  return f.statut !== 'PAYE' && new Date() > dateLimite(f.periodeFin)
}

function StatutBadge({ statut, echue }: { statut: Facture['statut']; echue?: boolean }) {
  if (statut === 'PAYE') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Payé
    </span>
  )
  if (statut === 'EN_RETARD' || echue) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
      <AlertCircle className="h-3 w-3" /> En retard
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
      <Clock className="h-3 w-3" /> En attente
    </span>
  )
}

/* ─── PDF print window ─── */
function printFacturePDF(facture: Facture, centreName: string) {
  const periode = formatPeriode(facture.periodeDebut, facture.periodeFin)
  const limite = formatDate(dateLimite(facture.periodeFin).toISOString())
  const statut = facture.statut === 'PAYE' ? 'PAYÉ' : facture.statut === 'EN_RETARD' ? 'EN RETARD' : 'EN ATTENTE'

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture ${facture.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; margin-bottom: 32px; }
    .brand { font-size: 22px; font-weight: 800; color: #059669; }
    .brand span { color: #1e293b; }
    .numero { font-size: 13px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; background: ${facture.statut === 'PAYE' ? '#d1fae5' : '#fef3c7'}; color: ${facture.statut === 'PAYE' ? '#065f46' : '#92400e'}; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field label { font-size: 11px; color: #64748b; margin-bottom: 2px; display: block; }
    .field p { font-size: 14px; font-weight: 600; color: #1e293b; }
    .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: left; padding: 8px 12px; background: #f8fafc; }
    .table td { font-size: 13px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .amount-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f0fdf4; border-radius: 10px; margin-top: 16px; }
    .amount-label { font-size: 13px; color: #475569; }
    .amount-value { font-size: 22px; font-weight: 800; color: #059669; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">N'di <span>Solutions</span></div>
      <div class="numero">Alafiya Plus — Plateforme de santé numérique</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:800;color:#1e293b">${facture.numero}</div>
      <div style="margin-top:6px"><span class="badge">${statut}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informations</div>
    <div class="grid">
      <div class="field"><label>Centre de santé</label><p>${centreName}</p></div>
      <div class="field"><label>Période facturée</label><p>${periode}</p></div>
      <div class="field"><label>Date d'émission</label><p>${formatDate(facture.createdAt)}</p></div>
      <div class="field"><label>Date limite de règlement</label><p>${limite}</p></div>
      ${facture.dateReglement ? `<div class="field"><label>Date de règlement</label><p>${formatDate(facture.dateReglement)}</p></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Détail des prestations</div>
    <table class="table">
      <thead>
        <tr>
          <th>Désignation</th>
          <th style="text-align:right">Quantité</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Carnets de santé créés</td>
          <td style="text-align:right;font-weight:600">${facture.nbCarnetsCrees}</td>
        </tr>
        <tr>
          <td>Renouvellements enregistrés</td>
          <td style="text-align:right;font-weight:600">${facture.nbCarnetsRenouv}</td>
        </tr>
      </tbody>
    </table>
    <div class="amount-row">
      <span class="amount-label">Montant total dû à N'di Solutions</span>
      <span class="amount-value">${formatFCFA(facture.montantDu)}</span>
    </div>
  </div>

  <div class="footer">
    N'di Solutions · Alafiya Plus · Ce document est généré automatiquement par la plateforme
  </div>

  <script>window.onload = () => { window.print() }</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=820,height=700')
  if (!w) return
  w.document.write(html)
  w.document.close()
}

/* ─── Coordonnées dialog ─── */
function CoordonneesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader
          icon={CreditCard}
          title="Coordonnées de paiement"
          description="Règlement des factures à N'di Solutions"
        />
        <div className="mt-1 space-y-3 p-6 pt-2">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/15 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Mobile Money</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Orange Money / MTN MoMo</p>
              <p className="text-sm text-slate-700 dark:text-zinc-300 font-mono mt-0.5">+224 6XX XX XX XX</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Au nom de N'di Solutions</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">Virement bancaire</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">N'di Solutions</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">IBAN / RIB fourni sur demande</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Contact facturation</p>
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              facturation@ndisolutions.com
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300 mt-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              +224 6XX XX XX XX
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center pb-1">
            Merci d'indiquer le numéro de facture dans votre virement.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Detail dialog ─── */
interface DetailDialogProps {
  facture: Facture | null
  onClose: () => void
}

function DetailDialog({ facture, onClose }: DetailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<AgentDetail[]>([])
  const [totalCarnets, setTotalCarnets] = useState(0)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!facture) return
    setLoading(true)
    setExpanded(false)
    fetch(`/api/admin/factures/${facture.id}/detail`)
      .then((r) => r.json())
      .then((d) => {
        setDetail(d.detail ?? [])
        setTotalCarnets(d.totalCarnets ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [facture?.id])

  if (!facture) return null

  return (
    <Dialog open={!!facture} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader
          icon={Eye}
          title={`Détail — ${facture.numero}`}
          description={formatPeriode(facture.periodeDebut, facture.periodeFin)}
        />
        <div className="mt-1 space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Carnets créés', value: facture.nbCarnetsCrees, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Renouvellements', value: facture.nbCarnetsRenouv, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Montant dû', value: formatFCFA(facture.montantDu), color: 'text-slate-900 dark:text-white', small: true },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-center">
                <p className={`text-lg font-extrabold ${item.color} ${item.small ? 'text-sm' : ''}`}>{item.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Date limite */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
              <Calendar className="h-4 w-4" />
              Date limite de règlement
            </div>
            <span className={`text-sm font-bold ${isEchue(facture) ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {formatDate(dateLimite(facture.periodeFin).toISOString())}
            </span>
          </div>

          {/* Per-agent breakdown */}
          <div className="rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <button
              className="flex w-full items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setExpanded((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Détail par agent</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">({totalCarnets} carnets)</span>
              </div>
              {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {expanded && (
              <div className="divide-y divide-slate-50 dark:divide-zinc-800/80">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : detail.length === 0 ? (
                  <div className="px-4 py-5 text-center text-sm text-slate-400 dark:text-zinc-500">
                    Aucune donnée de création disponible pour cette période
                  </div>
                ) : (
                  detail.map((row) => (
                    <div key={row.agent.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            {row.agent.prenoms[0]}{row.agent.nom[0]}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {row.agent.prenoms} {row.agent.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{row.count}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">carnets</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-start gap-1.5 pb-1">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            Le détail par agent est calculé à partir des enregistrements de création de carnets dans la plateforme.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main page ─── */
export default function AdminFacturesPage() {
  const { toast } = useToast()
  const [factures, setFactures] = useState<Facture[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [detailFacture, setDetailFacture] = useState<Facture | null>(null)
  const [showCoordonnees, setShowCoordonnees] = useState(false)
  const [centreName, setCentreName] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/factures')
      .then((r) => r.json())
      .then((data) => {
        setFactures(data.factures ?? [])
        setStats(data.stats ?? null)
        setCentreName(data.centreName ?? 'Votre centre')
      })
      .catch(() => {
        toast({ title: 'Erreur', description: 'Impossible de charger les factures.', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [])

  const facturesFiltrees = useMemo(() => {
    if (filtreStatut === 'tous') return factures
    return factures.filter((f) => f.statut === filtreStatut)
  }, [factures, filtreStatut])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Facturation</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Vos factures N'di Solutions · consultation uniquement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtreStatut} onValueChange={setFiltreStatut}>
            <SelectTrigger className="h-12 rounded-xl flex-1 sm:flex-none sm:w-36 text-xs border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="EN_RETARD">En retard</SelectItem>
              <SelectItem value="PAYE">Payées</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="default"
            className="h-12 gap-1.5 text-xs whitespace-nowrap rounded-xl"
            onClick={() => setShowCoordonnees(true)}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Paiement
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Facture en cours"
          value={loading ? '…' : formatFCFA(stats?.montantEnCours ?? 0)}
          sub="Montant de la facture active"
          icon={Receipt}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          accent="bg-amber-400"
        />
        <SummaryCard
          label="Solde impayé"
          value={loading ? '…' : formatFCFA(stats?.soldeImpaye ?? 0)}
          sub="Total des factures non réglées"
          icon={AlertCircle}
          iconBg={stats && stats.soldeImpaye > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-50 dark:bg-zinc-900'}
          iconColor={stats && stats.soldeImpaye > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}
          accent={stats && stats.soldeImpaye > 0 ? 'bg-red-400' : 'bg-slate-200 dark:bg-zinc-700'}
        />
        <SummaryCard
          label="Total des paiements"
          value={loading ? '…' : formatFCFA(stats?.totalPaye ?? 0)}
          sub="Somme de tous les règlements"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          accent="bg-emerald-400"
        />
      </div>

      {/* Factures list */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-white text-sm">Mes factures</span>
          {!loading && (
            <span className="text-xs text-slate-400 dark:text-zinc-500">· {factures.length} au total</span>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : facturesFiltrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Receipt className="h-8 w-8 text-slate-200 dark:text-zinc-700" />
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucune facture trouvée</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800">
                    {['Numéro', 'Période', 'Carnets / Renouv.', 'Montant dû', 'Statut', 'Date limite', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
                  {facturesFiltrees.map((f) => {
                    const echue = isEchue(f)
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">{f.numero}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-900 dark:text-white">{formatPeriode(f.periodeDebut, f.periodeFin)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-slate-900 dark:text-white font-semibold tabular-nums">{f.nbCarnetsCrees}</span>
                          <span className="text-slate-400 dark:text-zinc-500 mx-1">/</span>
                          <span className="text-slate-600 dark:text-zinc-400 tabular-nums">{f.nbCarnetsRenouv}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{formatFCFA(f.montantDu)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <StatutBadge statut={f.statut} echue={echue} />
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-medium ${echue && f.statut !== 'PAYE' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-zinc-400'}`}>
                            {formatDate(dateLimite(f.periodeFin).toISOString())}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                              title="Télécharger PDF"
                              onClick={() => printFacturePDF(f, centreName)}
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                              title="Voir détail"
                              onClick={() => setDetailFacture(f)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                              title="Coordonnées de paiement"
                              onClick={() => setShowCoordonnees(true)}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-50 dark:divide-zinc-800/60">
              {facturesFiltrees.map((f) => {
                const echue = isEchue(f)
                return (
                  <div key={f.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-500 dark:text-zinc-400">{f.numero}</p>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">{formatPeriode(f.periodeDebut, f.periodeFin)}</p>
                      </div>
                      <StatutBadge statut={f.statut} echue={echue} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 text-center">
                        <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">{f.nbCarnetsCrees}</p>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Créés</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 text-center">
                        <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">{f.nbCarnetsRenouv}</p>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Renouv.</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 text-center">
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">{(f.montantDu / 1000).toFixed(0)}k</p>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">FCFA</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${echue && f.statut !== 'PAYE' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                        Limite : {formatDate(dateLimite(f.periodeFin).toISOString())}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => printFacturePDF(f, centreName)}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => setDetailFacture(f)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => setShowCoordonnees(true)}>
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Note read-only */}
      <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-zinc-500 px-1">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Les factures sont générées automatiquement par la plateforme à partir des données réelles de création et de renouvellement de carnets.
          Aucune modification n'est possible depuis cette interface.
        </span>
      </div>

      {/* Dialogs */}
      <DetailDialog facture={detailFacture} onClose={() => setDetailFacture(null)} />
      <CoordonneesDialog open={showCoordonnees} onClose={() => setShowCoordonnees(false)} />
    </div>
  )
}

/* ─── Summary card ─── */
function SummaryCard({
  label, value, sub, icon: Icon, iconBg, iconColor, accent,
}: {
  label: string; value: string; sub: string
  icon: React.ElementType; iconBg: string; iconColor: string; accent: string
}) {
  return (
    <div className="relative bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent} rounded-t-2xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2 tabular-nums leading-none">{value}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5">{sub}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}
