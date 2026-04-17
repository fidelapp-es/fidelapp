import { createAuthClient } from '@/lib/supabase/server'
import ClientesTable from './ClientesTable'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: customers } = user
    ? await supabase
        .from('customers')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-white/40 mt-1 text-sm">{customers?.length ?? 0} clientes registrados</p>
      </div>
      <ClientesTable customers={customers ?? []} />
    </div>
  )
}
