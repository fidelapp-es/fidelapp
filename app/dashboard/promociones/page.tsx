import { getServiceClient } from '@/lib/supabase'
import PromocionesManager from './PromocionesManager'

export const dynamic = 'force-dynamic'

export default async function PromocionesPage() {
  const supabase = getServiceClient()
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .order('points_required', { ascending: true })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Promociones</h1>
        <p className="text-white/40 mt-1 text-sm">Gestiona las recompensas de tu programa de fidelización</p>
      </div>
      <PromocionesManager initialPromotions={promotions ?? []} />
    </div>
  )
}
