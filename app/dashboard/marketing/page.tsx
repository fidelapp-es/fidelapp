import { createAuthClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarketingManager from './MarketingManager'

export const dynamic = 'force-dynamic'

export default async function MarketingPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: campaigns },
    { count: all },
    { count: vip },
    { count: oro },
    { count: newC },
    { count: inactive },
  ] = await Promise.all([
    supabase.from('campaigns').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('owner_id', user.id).gte('points', 200),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('owner_id', user.id).gte('points', 100).lt('points', 200),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('owner_id', user.id).lt('points', 20),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('owner_id', user.id).lt('updated_at', cutoff),
  ])

  const emailConfigured = !!process.env.RESEND_API_KEY

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700 }}>Marketing</h1>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginTop: 4 }}>Crea campañas y conecta con tus clientes</p>
      </div>
      <MarketingManager
        initialCampaigns={campaigns ?? []}
        customerCounts={{ all: all ?? 0, vip: vip ?? 0, oro: oro ?? 0, new: newC ?? 0, inactive: inactive ?? 0 }}
        emailConfigured={emailConfigured}
      />
    </div>
  )
}
