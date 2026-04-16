import { getServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import ClienteCard from './ClienteCard'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) return notFound()

  // Load business settings — owner_id may not exist yet (pre-migration schema)
  // Fall back to single() since there is only one settings row per business
  const [{ data: settings }, { data: promotions }] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('promotions').select('*').eq('active', true).order('points_required', { ascending: true }),
  ])

  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = host.includes('localhost') || host.includes('192.168') || host.includes('172.') ? 'http' : 'https'
  const cardUrl = `${proto}://${host}/cliente/${customer.id}`

  return <ClienteCard customer={customer} promotions={promotions || []} settings={settings} cardUrl={cardUrl} />
}
