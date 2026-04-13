import { getServiceClient } from '@/lib/supabase'
import GeocatchClient from './GeocatchClient'

export const dynamic = 'force-dynamic'

export default async function GeocatchPage() {
  const sb = getServiceClient()
  const { data: settings } = await sb.from('settings').select('geo_lat,geo_lng,geo_radius_meters,geo_message,geo_enabled,business_name').eq('id', '00000000-0000-0000-0000-000000000001').single()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700 }}>Geocatch</h1>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginTop: 4 }}>Notificaciones automáticas cuando un cliente esté cerca de tu negocio</p>
      </div>
      <GeocatchClient settings={settings} />
    </div>
  )
}
