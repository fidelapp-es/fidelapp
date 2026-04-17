import { getServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import ClienteCard from './ClienteCard'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) return notFound()

  // Load business settings for this customer's owner.
  // settings.id = owner user_id, so filter by customer.owner_id.
  const [{ data: settings }, { data: promotions }] = await Promise.all([
    customer.owner_id
      ? supabase.from('settings').select('*').eq('id', customer.owner_id).maybeSingle()
      : supabase.from('settings').select('*').maybeSingle(),
    supabase.from('promotions').select('*')
      .eq('active', true)
      .eq('owner_id', customer.owner_id ?? '')
      .order('points_required', { ascending: true }),
  ])

  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = host.includes('localhost') || host.includes('192.168') || host.includes('172.') ? 'http' : 'https'
  const cardUrl = `${proto}://${host}/cliente/${customer.id}`

  return <ClienteCard customer={customer} promotions={promotions || []} settings={settings} cardUrl={cardUrl} />
}
