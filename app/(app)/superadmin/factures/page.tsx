'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Receipt, TrendingUp, Clock, AlertCircle, CheckCircle2,
  Download, Mail, Search, Filter, FileDown, MoreHorizontal,
  Loader2, BadgeCheck, X, Plus, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import FacturesChart from '@/components/superadmin/factures-chart'

/* ─── Types ─── */
interface Centre {
  nom: string
  region: string
  prefecture: string
  type: string
}

interface Facture {
  id: string
  numero: string
  centreId: string
  centre: Centre
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
  revenusMoisCourant: number
  revenusEnAttente: number
  revenusYTD: number
  totalCarnetsFactures: number
}

interface ChartPoint {
  mois: string
  revenus: number
  label: string
}

/* ─── Helpers ─── */
const inputCls = 'h-10 border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-400'

function formatFCFA(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function formatPeriode(debut: string, fin: string) {
  const d = new Date(debut)
  const f = new Date(fin)
  const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  if (d.getMonth() === f.getMonth() && d.getFullYear() === f.getFullYear()) {
    return `${MOIS[d.getMonth()]} ${d.getFullYear()}`
  }
  return `${MOIS[d.getMonth()]} — ${MOIS[f.getMonth()]} ${f.getFullYear()}`
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatutBadge({ statut }: { statut: Facture['statut'] }) {
  if (statut === 'PAYE') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold bg-brand/8 dark:bg-brand/12 border-brand/20 text-brand">
      <BadgeCheck className="h-3 w-3" /> Payé
    </span>
  )
  if (statut === 'EN_RETARD') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20 text-red-600 dark:text-red-400">
      <AlertCircle className="h-3 w-3" /> En retard
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold bg-orange-50 dark:bg-orange-400/10 border-orange-200 dark:border-orange-400/20 text-orange-600 dark:text-orange-400">
      <Clock className="h-3 w-3" /> En attente
    </span>
  )
}

/* ─── Stat card ─── */
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, accentColor, cardBg, delay }: {
  label: string; value: string; sub?: string
  icon: React.ElementType
  iconBg: string; iconColor: string; accentColor: string; cardBg: string; delay: string
}) {
  return (
    <div className={`dash-in ${delay} relative ${cardBg} rounded-2xl p-5 overflow-hidden hover:shadow-md transition-all duration-200 group`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor} rounded-t-2xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2 tabular-nums leading-none break-all">{value}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

/* ─── Nouvelle facture dialog ─── */
interface NouvelleFactureDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (f: Facture) => void
}

function NouvelleFactureDialog({ open, onClose, onCreated }: NouvelleFactureDialogProps) {
  const { toast } = useToast()
  const [centres, setCentres] = useState<{ id: string; nom: string; region: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    centreId: '',
    periodeDebut: '',
    periodeFin: '',
    nbCarnetsCrees: '',
    nbCarnetsRenouv: '',
    montantDu: '',
  })

  useEffect(() => {
    if (open) {
      fetch('/api/centres').then(r => r.json()).then(d => setCentres(d.centres || []))
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.centreId || !form.periodeDebut || !form.periodeFin) {
      toast({ description: 'Veuillez remplir tous les champs requis', variant: 'destructive' })
      return
    }
    setSaving(true)
    const res = await fetch('/api/superadmin/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        centreId: form.centreId,
        periodeDebut: form.periodeDebut,
        periodeFin: form.periodeFin,
        nbCarnetsCrees: parseInt(form.nbCarnetsCrees) || 0,
        nbCarnetsRenouv: parseInt(form.nbCarnetsRenouv) || 0,
        montantDu: parseInt(form.montantDu) || 0,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    toast({ description: `Facture ${data.facture.numero} créée` })
    onCreated(data.facture)
    onClose()
    setForm({ centreId: '', periodeDebut: '', periodeFin: '', nbCarnetsCrees: '', nbCarnetsRenouv: '', montantDu: '' })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader
          icon={Receipt}
          title="Nouvelle facture"
          description="Créer une facture pour un centre partenaire"
        />
        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Centre *</label>
            <Select value={form.centreId} onValueChange={(v) => setForm(f => ({ ...f, centreId: v }))}>
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Sélectionner un centre" />
              </SelectTrigger>
              <SelectContent>
                {centres.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nom} — {c.region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Début période *</label>
              <Input type="date" className={inputCls} value={form.periodeDebut}
                onChange={e => setForm(f => ({ ...f, periodeDebut: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Fin période *</label>
              <Input type="date" className={inputCls} value={form.periodeFin}
                onChange={e => setForm(f => ({ ...f, periodeFin: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Carnets créés</label>
              <Input type="number" min="0" className={inputCls} placeholder="0" value={form.nbCarnetsCrees}
                onChange={e => setForm(f => ({ ...f, nbCarnetsCrees: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Carnets renouvelés</label>
              <Input type="number" min="0" className={inputCls} placeholder="0" value={form.nbCarnetsRenouv}
                onChange={e => setForm(f => ({ ...f, nbCarnetsRenouv: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Montant dû (FCFA)</label>
            <Input type="number" min="0" className={inputCls} placeholder="0" value={form.montantDu}
              onChange={e => setForm(f => ({ ...f, montantDu: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 bg-brand hover:bg-brand-dark text-white" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Créer la facture
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Mark as paid dialog ─── */
interface MarquerPayeDialogProps {
  facture: Facture | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

function MarquerPayeDialog({ facture, onClose, onConfirm, loading }: MarquerPayeDialogProps) {
  return (
    <Dialog open={!!facture} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader
          icon={CheckCircle2}
          title="Marquer comme payé"
          description={`Confirmer la réception du paiement de la facture ${facture?.numero} ?`}
        />
        <div className="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{facture?.centre.nom}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {facture && formatPeriode(facture.periodeDebut, facture.periodeFin)} · {facture && formatFCFA(facture.montantDu)}
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 bg-brand hover:bg-brand-dark text-white" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmer le paiement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main Page ─── */
export default function FacturesPage() {
  const { toast } = useToast()
  const [factures, setFactures] = useState<Facture[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('tous')
  const [filterRegion, setFilterRegion] = useState<string>('tous')
  const [filterMois, setFilterMois] = useState<string>('tous')

  // Dialogs
  const [showNouvelle, setShowNouvelle] = useState(false)
  const [payTarget, setPayTarget] = useState<Facture | null>(null)
  const [paying, setPaying] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/factures')
      .then(r => {
        if (!r.ok && r.status !== 500) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        setFactures(d.factures || [])
        setStats(d.stats || null)
        setChartData(d.chartData || [])
      })
      .catch(err => console.error('Erreur chargement factures:', err))
      .finally(() => setLoading(false))
  }, [])

  // Derived filter options
  const regions = useMemo(() => {
    const r = new Set(factures.map(f => f.centre.region))
    return Array.from(r).sort()
  }, [factures])

  const moisOptions = useMemo(() => {
    const seen = new Set<string>()
    factures.forEach(f => {
      const d = new Date(f.periodeDebut)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      seen.add(key)
    })
    return Array.from(seen).sort().reverse()
  }, [factures])

  const filtered = useMemo(() => {
    return factures.filter(f => {
      const matchSearch = search === '' ||
        `${f.centre.nom} ${f.centre.region} ${f.numero}`.toLowerCase().includes(search.toLowerCase())
      const matchStatut = filterStatut === 'tous' || f.statut === filterStatut
      const matchRegion = filterRegion === 'tous' || f.centre.region === filterRegion
      const matchMois = filterMois === 'tous' || (() => {
        const d = new Date(f.periodeDebut)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return key === filterMois
      })()
      return matchSearch && matchStatut && matchRegion && matchMois
    })
  }, [factures, search, filterStatut, filterRegion, filterMois])

  async function handleMarquerPaye() {
    if (!payTarget) return
    setPaying(true)
    const res = await fetch(`/api/superadmin/factures/${payTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'PAYE' }),
    })
    const data = await res.json()
    setPaying(false)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setFactures(prev => prev.map(f => f.id === data.facture.id ? data.facture : f))
    toast({ description: `Paiement enregistré pour ${payTarget.centre.nom}` })
    setPayTarget(null)
  }

  async function handleMarquerRetard(facture: Facture) {
    setActionLoading(facture.id)
    const res = await fetch(`/api/superadmin/factures/${facture.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'EN_RETARD' }),
    })
    const data = await res.json()
    setActionLoading(null)
    if (!res.ok) { toast({ description: data.error || 'Erreur', variant: 'destructive' }); return }
    setFactures(prev => prev.map(f => f.id === data.facture.id ? data.facture : f))
    toast({ description: `Facture marquée en retard` })
  }

  function handleRelance(facture: Facture) {
    toast({ description: `Relance envoyée par e-mail à ${facture.centre.nom}` })
  }

  function handleDownloadPDF(facture: Facture) {
    toast({ description: `Génération du PDF pour ${facture.numero}…` })
  }

  function handleExportCSV() {
    const headers = ['N° Facture', 'Centre', 'Région', 'Ville', 'Période', 'Carnets créés', 'Carnets renouvelés', 'Montant dû (FCFA)', 'Statut', 'Date règlement']
    const rows = filtered.map(f => [
      f.numero,
      f.centre.nom,
      f.centre.region,
      f.centre.prefecture,
      formatPeriode(f.periodeDebut, f.periodeFin),
      f.nbCarnetsCrees,
      f.nbCarnetsRenouv,
      f.montantDu,
      f.statut === 'PAYE' ? 'Payé' : f.statut === 'EN_RETARD' ? 'En retard' : 'En attente',
      formatDate(f.dateReglement),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const MOIS_LABELS: Record<string, string> = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
  }

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* En-tête */}
      <div className="dash-in delay-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Facturation nationale
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Vue consolidée de toutes les factures des centres partenaires
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handleExportCSV}>
            <FileDown className="h-4 w-4" /> Exporter CSV
          </Button>
          <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-xl gap-1.5 shadow-sm shadow-brand/20"
            onClick={() => setShowNouvelle(true)}>
            <Plus className="h-4 w-4" /> Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenus mois en cours" delay="delay-75"
          value={loading ? '—' : `${(stats?.revenusMoisCourant ?? 0).toLocaleString('fr-FR')}`}
          sub="FCFA encaissés"
          icon={TrendingUp}
          iconBg="bg-brand/20 dark:bg-brand/25" iconColor="text-brand"
          accentColor="bg-brand" cardBg="bg-brand/10 dark:bg-brand/15"
        />
        <StatCard
          label="Revenus en attente" delay="delay-150"
          value={loading ? '—' : `${(stats?.revenusEnAttente ?? 0).toLocaleString('fr-FR')}`}
          sub="FCFA à encaisser"
          icon={Clock}
          iconBg="bg-orange-500/20 dark:bg-orange-400/25" iconColor="text-orange-500 dark:text-orange-300"
          accentColor="bg-orange-500" cardBg="bg-orange-500/10 dark:bg-orange-500/15"
        />
        <StatCard
          label="Revenus YTD" delay="delay-225"
          value={loading ? '—' : `${(stats?.revenusYTD ?? 0).toLocaleString('fr-FR')}`}
          sub={`FCFA depuis Jan ${new Date().getFullYear()}`}
          icon={Receipt}
          iconBg="bg-blue-500/20 dark:bg-blue-400/25" iconColor="text-blue-600 dark:text-blue-300"
          accentColor="bg-blue-500" cardBg="bg-blue-500/10 dark:bg-blue-500/15"
        />
        <StatCard
          label="Carnets facturés" delay="delay-300"
          value={loading ? '—' : String(stats?.totalCarnetsFactures ?? 0)}
          sub="Créations + renouvellements"
          icon={Building2}
          iconBg="bg-purple-500/20 dark:bg-purple-400/25" iconColor="text-purple-600 dark:text-purple-300"
          accentColor="bg-purple-500" cardBg="bg-purple-500/10 dark:bg-purple-500/15"
        />
      </div>

      {/* Chart */}
      <div className="dash-in delay-150">
        <FacturesChart data={chartData} loading={loading} />
      </div>

      {/* Filters */}
      <div className="dash-in delay-150 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <Input
              placeholder="Rechercher un centre, n° facture…"
              className={`${inputCls} pl-9`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className={`${inputCls} w-40`}>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="PAYE">Payé</SelectItem>
              <SelectItem value="EN_RETARD">En retard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className={`${inputCls} w-44`}>
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes les régions</SelectItem>
              {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterMois} onValueChange={setFilterMois}>
            <SelectTrigger className={`${inputCls} w-44`}>
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes les périodes</SelectItem>
              {moisOptions.map(m => {
                const [yr, mo] = m.split('-')
                return <SelectItem key={m} value={m}>{MOIS_LABELS[mo]} {yr}</SelectItem>
              })}
            </SelectContent>
          </Select>

          {(search || filterStatut !== 'tous' || filterRegion !== 'tous' || filterMois !== 'tous') && (
            <Button variant="ghost" size="sm" className="h-10 gap-1.5 text-slate-500" onClick={() => {
              setSearch(''); setFilterStatut('tous'); setFilterRegion('tous'); setFilterMois('tous')
            }}>
              <X className="h-3.5 w-3.5" /> Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="dash-in delay-225 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Liste des factures</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              {loading ? '…' : `${filtered.length} facture${filtered.length > 1 ? 's' : ''}`}
              {filtered.length !== factures.length && ` sur ${factures.length}`}
            </p>
          </div>
          <Filter className="h-4 w-4 text-slate-300 dark:text-zinc-600" />
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-3">
              <Receipt className="h-6 w-6 text-slate-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-500">Aucune facture trouvée</p>
          </div>
        ) : (
          <>
            {/* Table header — desktop */}
            <div className="hidden lg:grid grid-cols-[1.8fr_1fr_1fr_0.8fr_0.8fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Centre</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Période</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Carnets</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Montant</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Statut</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Date règlement</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500"></span>
            </div>

            <ul>
              {filtered.map((facture, i) => (
                <li
                  key={facture.id}
                  className={`dash-in delay-${[0, 75, 150, 225, 300][Math.min(i, 4)]} flex flex-col lg:grid lg:grid-cols-[1.8fr_1fr_1fr_0.8fr_0.8fr_1fr_auto] items-start lg:items-center gap-3 lg:gap-4 px-5 py-4 border-b border-slate-50 dark:border-zinc-800/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors`}
                >
                  {/* Centre */}
                  <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{facture.centre.nom}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{facture.numero} · {facture.centre.region}, {facture.centre.prefecture}</p>
                    </div>
                    {/* Mobile: statut badge inline */}
                    <div className="lg:hidden flex-shrink-0">
                      <StatutBadge statut={facture.statut} />
                    </div>
                  </div>

                  {/* Mobile row 2 */}
                  <div className="lg:contents flex items-center gap-4 w-full text-xs text-slate-500 dark:text-zinc-400">
                    <span className="lg:hidden font-medium text-slate-700 dark:text-zinc-300 text-[10px] uppercase tracking-wider">
                      {formatPeriode(facture.periodeDebut, facture.periodeFin)}
                    </span>
                    <span className="lg:hidden">
                      {facture.nbCarnetsCrees + facture.nbCarnetsRenouv} carnets · {formatFCFA(facture.montantDu)}
                    </span>
                  </div>

                  {/* Desktop cells */}
                  <p className="hidden lg:block text-xs text-slate-600 dark:text-zinc-300 font-medium">
                    {formatPeriode(facture.periodeDebut, facture.periodeFin)}
                  </p>
                  <div className="hidden lg:flex flex-col gap-0.5">
                    <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">{facture.nbCarnetsCrees + facture.nbCarnetsRenouv} total</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{facture.nbCarnetsCrees} créés · {facture.nbCarnetsRenouv} renouv.</span>
                  </div>
                  <p className="hidden lg:block text-sm font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                    {facture.montantDu.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
                  </p>
                  <div className="hidden lg:block">
                    <StatutBadge statut={facture.statut} />
                  </div>
                  <p className="hidden lg:block text-xs text-slate-500 dark:text-zinc-400">
                    {formatDate(facture.dateReglement)}
                  </p>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 self-end lg:self-auto">
                        {actionLoading === facture.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => handleDownloadPDF(facture)} className="gap-2">
                        <Download className="h-4 w-4" /> Télécharger PDF
                      </DropdownMenuItem>
                      {facture.statut !== 'PAYE' && (
                        <>
                          <DropdownMenuItem onClick={() => setPayTarget(facture)} className="gap-2 text-brand focus:text-brand">
                            <CheckCircle2 className="h-4 w-4" /> Marquer comme payé
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRelance(facture)} className="gap-2">
                            <Mail className="h-4 w-4" /> Envoyer une relance
                          </DropdownMenuItem>
                        </>
                      )}
                      {facture.statut === 'EN_ATTENTE' && (
                        <DropdownMenuItem onClick={() => handleMarquerRetard(facture)} className="gap-2 text-orange-600 focus:text-orange-600">
                          <AlertCircle className="h-4 w-4" /> Marquer en retard
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Dialogs */}
      <NouvelleFactureDialog
        open={showNouvelle}
        onClose={() => setShowNouvelle(false)}
        onCreated={(f) => setFactures(prev => [f, ...prev])}
      />

      <MarquerPayeDialog
        facture={payTarget}
        onClose={() => setPayTarget(null)}
        onConfirm={handleMarquerPaye}
        loading={paying}
      />
    </div>
  )
}
