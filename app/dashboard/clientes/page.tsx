import { getServiceClient } from '@/lib/supabase'
import ClientesTable from './ClientesTable'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = getServiceClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

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
