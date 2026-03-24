'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

type DayData = { jour: number; montant: number }

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
    <div className="h-56 flex items-end gap-1 px-2 pb-2">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-sm animate-pulse"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  )
}

function formatMontant(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M GNF`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} k GNF`
  return `${v} GNF`
}

export default function RevenueChart() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<DayData[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/dashboard/revenue?year=${y}&month=${m}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.parJour)
        setTotal(json.totalMois)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(year, month) }, [year, month, fetchData])

  function handleMonthChange(y: number, m: number) {
    setYear(y)
    setMonth(m)
  }

  const empty: DayData[] = Array.from({ length: 30 }, (_, i) => ({ jour: i + 1, montant: 0 }))
  const chartData = data ?? empty

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10 dark:bg-emerald-400/15">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Revenus du centre</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
              Montants facturés par jour
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
            {formatMontant(total)}
          </p>
          <MonthNav year={year} month={month} onChange={handleMonthChange} />
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 px-1 pb-3">
        {loading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
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
                formatter={(v) => [formatMontant(Number(v)), 'Revenu']}
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="montant"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradRevenu)"
                dot={false}
                activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
