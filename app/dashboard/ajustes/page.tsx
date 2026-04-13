import { getServiceClient } from '@/lib/supabase'
import AjustesManager from './AjustesManager'

export const dynamic = 'force-dynamic'

export default async function AjustesPage() {
  const sb = getServiceClient()
  const { data: settings } = await sb.from('settings').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single()

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700 }}>Ajustes</h1>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginTop: 4 }}>Configura tu negocio, tarjeta de fidelización y estilo visual</p>
      </div>
      <AjustesManager initialSettings={settings} />
    </div>
  )
}
