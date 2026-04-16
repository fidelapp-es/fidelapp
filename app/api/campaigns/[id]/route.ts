import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  // Calcular sent_count según segmento si se está enviando
  if (body.status === 'sent') {
    const count = await getSegmentCount(supabase, body.segment || 'all')
    body.sent_count = count
    body.sent_at = new Date().toISOString()
  }

  // RLS garantiza que solo puede editar sus propias campañas
  const { data, error } = await supabase.from('campaigns').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await supabase.from('campaigns').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

async function getSegmentCount(supabase: any, segment: string): Promise<number> {
  let q = supabase.from('customers').select('*', { count: 'exact', head: true })
  if (segment === 'vip') q = q.gte('points', 200)
  else if (segment === 'oro') q = q.gte('points', 100).lt('points', 200)
  else if (segment === 'new') q = q.lt('points', 20)
  else if (segment === 'inactive') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    q = q.lt('updated_at', cutoff)
  }
  const { count } = await q
  return count ?? 0
}
