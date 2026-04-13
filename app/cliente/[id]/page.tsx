import { getServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import ClienteCard from './ClienteCard'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServiceClient()

  const [{ data: customer }, { data: promotions }, { data: settings }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('promotions').select('*').eq('active', true).order('points_required', { ascending: true }),
    supabase.from('settings').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single(),
  ])

  if (!customer) return notFound()

  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const cardUrl = `${proto}://${host}/cliente/${customer.id}`

  return <ClienteCard customer={customer} promotions={promotions || []} settings={settings} cardUrl={cardUrl} />
}
