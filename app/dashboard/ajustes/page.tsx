import { createAuthClient } from '@/lib/supabase/server'
import AjustesManager from './AjustesManager'

export const dynamic = 'force-dynamic'

export default async function AjustesPage() {
  const sb = await createAuthClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: settings } = user
    ? await sb.from('settings').select('*').eq('id', user.id).maybeSingle()
    : { data: null }

  return (
    <div className="p-4 md:p-8" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="mb-6">
        <h1 style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700 }}>Ajustes</h1>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginTop: 4 }}>Configura tu negocio, tarjeta de fidelización y estilo visual</p>
      </div>
      <div style={{ maxWidth: 768, marginLeft: 'auto', marginRight: 'auto' }}>
        <AjustesManager initialSettings={settings} />
      </div>
    </div>
  )
}
