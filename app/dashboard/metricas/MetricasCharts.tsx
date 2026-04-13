'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Visit { amount_spent: number; points_earned: number; created_at: string }
interface CustomerStat { created_at: string; points: number }

function groupByMonth(items: { created_at: string; value: number }[]) {
  const map: Record<string, number> = {}
  items.forEach(item => {
    const date = new Date(item.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    map[key] = (map[key] ?? 0) + item.value
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }))
}

const tooltipStyle = { backgroundColor: '#1A1612', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#F5F0EB' }
const axisStyle = { fontSize: 11, fill: 'rgba(255,255,255,0.3)' }
const gridStyle = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)' }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-white/50 text-xs uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function MetricasCharts({ visits, customers }: { visits: Visit[]; customers: CustomerStat[] }) {
  const ingresosPorMes = groupByMonth(visits.map(v => ({ created_at: v.created_at, value: Number(v.amount_spent) })))
  const visitasPorMes = groupByMonth(visits.map(v => ({ created_at: v.created_at, value: 1 })))
  const registrosPorMes = groupByMonth(customers.map(c => ({ created_at: c.created_at, value: 1 })))
  const noData = <p className="text-center text-white/20 py-10 text-sm">Sin datos aún</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title="Ingresos por mes (€)">
        {ingresosPorMes.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresosPorMes}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)}€`, 'Ingresos']} />
              <Bar dataKey="total" fill="#C8873A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : noData}
      </ChartCard>

      <ChartCard title="Visitas por mes">
        {visitasPorMes.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={visitasPorMes}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Visitas']} />
              <Line type="monotone" dataKey="total" stroke="#C8873A" strokeWidth={2} dot={{ fill: '#C8873A', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : noData}
      </ChartCard>

      <ChartCard title="Nuevos clientes por mes">
        {registrosPorMes.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={registrosPorMes}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Nuevos clientes']} />
              <Bar dataKey="total" fill="#E8A85A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : noData}
      </ChartCard>

      <ChartCard title="Clientes por nivel">
        {customers.length > 0 ? (() => {
          const levels = [
            { label: 'Nuevo', count: customers.filter(c => c.points < 50).length },
            { label: 'Plata', count: customers.filter(c => c.points >= 50 && c.points < 100).length },
            { label: 'Oro', count: customers.filter(c => c.points >= 100 && c.points < 200).length },
            { label: 'VIP', count: customers.filter(c => c.points >= 200).length },
          ]
          return (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={levels} layout="vertical">
                <CartesianGrid {...gridStyle} />
                <XAxis type="number" tick={axisStyle} />
                <YAxis dataKey="label" type="category" tick={axisStyle} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Clientes']} />
                <Bar dataKey="count" fill="#C8873A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        })() : noData}
      </ChartCard>
    </div>
  )
}
