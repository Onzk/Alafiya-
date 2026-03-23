'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { FileText, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

type DayData = { jour: number; count: number }
type ChartData = { enregistrements: DayData[]; dossiers: DayData[] }

function MonthNav({
  year, month, onChange,
}: {
  year: number; month: number
  onChange: (y: number, m: number) => void
}) {
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  function prev() {
    if (month === 1) onChange(year - 1, 12)
    else onChange(year, month - 1)
  }
  function next() {
    if (isCurrentMonth) return
    if (month === 12) onChange(year + 1, 1)
    else onChange(year, month + 1)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 min-w-[110px] text-center">
        {MOIS[month - 1]} {year}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="h-48 flex items-end gap-1 px-2 pb-2">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-sm animate-pulse"
          style={{ height: `${20 + (i * 13) % 60}%` }}
        />
      ))}
    </div>
  )
}

interface ChartPanelProps {
  title: string
  subtitle: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  gradientId: string
  strokeColor: string
  fillColor: string
  data: DayData[]
  loading: boolean
  year: number
  month: number
  onMonthChange: (y: number, m: number) => void
}

function ChartPanel({
  title, subtitle, icon: Icon, iconBg, iconColor,
  gradientId, strokeColor, fillColor,
  data, loading, year, month, onMonthChange,
}: ChartPanelProps) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
      <div className="px-5 pt-5 pb-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{title}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">{total}</p>
          <MonthNav year={year} month={month} onChange={onMonthChange} />
        </div>
      </div>

      <div className="h-48 px-1 pb-3">
        {loading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fillColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="jour"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--tooltip-bg, #fff)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '10px',
                  fontSize: 12,
                  padding: '6px 12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
                labelFormatter={(v) => `Jour ${v}`}
                formatter={(v) => [v ?? 0, 'Créations']}
                cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default function SuperadminDashboardCharts() {
  const now = new Date()
  const [enregYear, setEnregYear] = useState(now.getFullYear())
  const [enregMonth, setEnregMonth] = useState(now.getMonth() + 1)
  const [dossierYear, setDossierYear] = useState(now.getFullYear())
  const [dossierMonth, setDossierMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (ey: number, em: number, dy: number, dm: number) => {
    setLoading(true)
    try {
      const [resEnreg, resDossier] = await Promise.all([
        fetch(`/api/superadmin/dashboard/charts?year=${ey}&month=${em}`),
        fetch(`/api/superadmin/dashboard/charts?year=${dy}&month=${dm}`),
      ])
      const [d1, d2] = await Promise.all([
        resEnreg.ok ? resEnreg.json() : null,
        resDossier.ok ? resDossier.json() : null,
      ])
      setData({
        enregistrements: d1?.enregistrements ?? [],
        dossiers: d2?.dossiers ?? [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(enregYear, enregMonth, dossierYear, dossierMonth)
  }, [enregYear, enregMonth, dossierYear, dossierMonth, fetchData])

  const emptyDays = (y: number, m: number) =>
    Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => ({ jour: i + 1, count: 0 }))

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <ChartPanel
        title="Enregistrements médicaux"
        subtitle="Nouvelles entrées par jour · national"
        icon={FileText}
        iconBg="bg-brand/10 dark:bg-brand/15"
        iconColor="text-brand"
        gradientId="sa-gradEnreg"
        strokeColor="#21c488"
        fillColor="#21c488"
        data={data?.enregistrements ?? emptyDays(enregYear, enregMonth)}
        loading={loading}
        year={enregYear}
        month={enregMonth}
        onMonthChange={(y, m) => { setEnregYear(y); setEnregMonth(m) }}
      />
      <ChartPanel
        title="Dossiers médicaux patients"
        subtitle="Nouveaux dossiers par jour · national"
        icon={FolderOpen}
        iconBg="bg-blue-500/10 dark:bg-blue-400/15"
        iconColor="text-blue-600 dark:text-blue-300"
        gradientId="sa-gradDossier"
        strokeColor="#3b82f6"
        fillColor="#3b82f6"
        data={data?.dossiers ?? emptyDays(dossierYear, dossierMonth)}
        loading={loading}
        year={dossierYear}
        month={dossierMonth}
        onMonthChange={(y, m) => { setDossierYear(y); setDossierMonth(m) }}
      />
    </div>
  )
}
