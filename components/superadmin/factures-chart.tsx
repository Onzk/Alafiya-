'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ChartPoint {
  mois: string
  revenus: number
  label: string
}

function formatFCFA(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return `${v}`
}

function SkeletonChart() {
  return (
    <div className="h-52 flex items-end gap-2 px-4 pb-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-sm animate-pulse"
          style={{ height: `${15 + (i * 17) % 70}%` }}
        />
      ))}
    </div>
  )
}

interface FacturesChartProps {
  data: ChartPoint[]
  loading: boolean
}

export default function FacturesChart({ data, loading }: FacturesChartProps) {
  const total = data.reduce((s, d) => s + d.revenus, 0)

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10 dark:bg-emerald-400/15">
            <TrendingUp className="h-4 w-4 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Évolution des revenus</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">
              12 derniers mois · encaissés
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
            {formatFCFA(total)} FCFA
          </p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Total période</p>
        </div>
      </div>

      <div className="h-52 px-2 pb-3">
        {loading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
              <defs>
                <linearGradient id="factureBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#21c488" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#21c488" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatFCFA}
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
                labelFormatter={(_, payload) => payload?.[0]?.payload?.mois ?? ''}
                formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, 'Revenus']}
                cursor={{ fill: 'rgba(33,196,136,0.06)' }}
              />
              <Bar
                dataKey="revenus"
                fill="url(#factureBarGrad)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
