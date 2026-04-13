import { getServiceClient } from '@/lib/supabase'
import MetricasCharts from './MetricasCharts'

export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const supabase = getServiceClient()

  const { data: visits } = await supabase
    .from('visits')
    .select('amount_spent, points_earned, created_at')
    .order('created_at', { ascending: true })

  const { data: customers } = await supabase
    .from('customers')
    .select('created_at, points')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Métricas</h1>
        <p className="text-white/40 mt-1 text-sm">Análisis del rendimiento de tu programa</p>
      </div>
      <MetricasCharts visits={visits ?? []} customers={customers ?? []} />
    </div>
  )
}
