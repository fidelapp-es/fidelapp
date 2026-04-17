import { createAuthClient } from '@/lib/supabase/server'
import PromocionesManager from './PromocionesManager'

export const dynamic = 'force-dynamic'

export default async function PromocionesPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: promotions } = user
    ? await supabase
        .from('promotions')
        .select('*')
        .eq('owner_id', user.id)
        .order('points_required', { ascending: true })
    : { data: [] }

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
