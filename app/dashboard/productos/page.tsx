import { getServiceClient } from '@/lib/supabase'
import ProductosManager from './ProductosManager'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  const supabase = getServiceClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Productos</h1>
        <p className="text-white/40 mt-1 text-sm">Gestiona tu carta de productos</p>
      </div>
      <ProductosManager initialProducts={products ?? []} />
    </div>
  )
}
