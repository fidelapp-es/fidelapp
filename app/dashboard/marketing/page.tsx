import { getServiceClient } from '@/lib/supabase'
import MarketingManager from './MarketingManager'

export const dynamic = 'force-dynamic'

export default async function MarketingPage() {
  const sb = getServiceClient()

  const [
    { data: campaigns },
    { count: all },
    { count: vip },
    { count: oro },
    { count: newC },
  ] = await Promise.all([
    sb.from('campaigns').select('*').order('created_at', { ascending: false }),
    sb.from('customers').select('*', { count: 'exact', head: true }),
    sb.from('customers').select('*', { count: 'exact', head: true }).gte('points', 200),
    sb.from('customers').select('*', { count: 'exact', head: true }).gte('points', 100).lt('points', 200),
    sb.from('customers').select('*', { count: 'exact', head: true }).lt('points', 20),
  ])

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: inactive } = await sb.from('customers').select('*', { count: 'exact', head: true }).lt('updated_at', cutoff)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700 }}>Marketing</h1>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginTop: 4 }}>Crea campañas y conecta con tus clientes</p>
      </div>
      <MarketingManager
        initialCampaigns={campaigns ?? []}
        customerCounts={{ all: all ?? 0, vip: vip ?? 0, oro: oro ?? 0, new: newC ?? 0, inactive: inactive ?? 0 }}
      />
    </div>
  )
}
