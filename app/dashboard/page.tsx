import { getServiceClient } from '@/lib/supabase'
import { Users, TrendingUp, Star, ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = getServiceClient()

  const [{ count: totalClientes }, { data: visitsData }, { data: customers }] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('visits').select('amount_spent, points_earned, created_at'),
    supabase.from('customers').select('name, points, total_spent').order('points', { ascending: false }).limit(5),
  ])

  const totalIngresos = visitsData?.reduce((sum, v) => sum + Number(v.amount_spent), 0) ?? 0
  const totalPuntos = visitsData?.reduce((sum, v) => sum + v.points_earned, 0) ?? 0
  const totalVisitas = visitsData?.length ?? 0
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const visitasMes = visitsData?.filter(v => v.created_at >= startOfMonth).length ?? 0

  const stats = [
    { label: 'Clientes registrados', value: totalClientes ?? 0, icon: Users },
    { label: 'Ingresos totales', value: `${totalIngresos.toFixed(2)}€`, icon: TrendingUp },
    { label: 'Puntos emitidos', value: totalPuntos, icon: Star },
    { label: 'Visitas este mes', value: visitasMes, icon: ShoppingBag },
  ]

  return (
    <div style={{ padding: '24px 16px' }} className="md:p-8">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700 }}>Bienvenido</h1>
        <p style={{ color: 'var(--fi-text-muted)', marginTop: 4, fontSize: 14 }}>Resumen del programa de fidelización</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }} className="lg:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{stat.label}</p>
                <p style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700 }}>{stat.value}</p>
              </div>
              <div className="glass" style={{ padding: 8, borderRadius: 10 }}>
                <stat.icon style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="lg:grid-cols-2">
        {/* Top clientes */}
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--fi-border)' }}>
            <h2 style={{ color: 'var(--fi-text-muted)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top clientes</h2>
          </div>
          <div style={{ padding: 20 }}>
            {customers && customers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {customers.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < customers.length - 1 ? '1px solid var(--fi-border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--fi-accent-bg)', color: 'var(--fi-accent)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--fi-accent-border)', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <div>
                        <p style={{ color: 'var(--fi-text)', fontSize: 14, fontWeight: 500 }}>{c.name}</p>
                        <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{Number(c.total_spent).toFixed(2)}€ gastados</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star style={{ width: 12, height: 12, color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                      <span style={{ color: 'var(--fi-accent)', fontWeight: 700, fontSize: 14 }}>{c.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Aún no hay clientes</p>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--fi-border)' }}>
            <h2 style={{ color: 'var(--fi-text-muted)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estadísticas</h2>
          </div>
          <div style={{ padding: 20 }}>
            {[
              { label: 'Total visitas registradas', value: totalVisitas },
              { label: 'Ticket medio', value: totalVisitas > 0 ? `${(totalIngresos / totalVisitas).toFixed(2)}€` : '—' },
              { label: 'Puntos por visita (media)', value: totalVisitas > 0 ? Math.round(totalPuntos / totalVisitas) : '—' },
              { label: 'Visitas este mes', value: visitasMes },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--fi-border)' : 'none' }}>
                <span style={{ color: 'var(--fi-text-muted)', fontSize: 14 }}>{row.label}</span>
                <span style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 14 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
