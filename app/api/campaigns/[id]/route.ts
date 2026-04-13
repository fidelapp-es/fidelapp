import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getServiceClient()
  const body = await req.json()

  // Si se está enviando, calcular sent_count según segmento
  if (body.status === 'sent') {
    const { count } = await getSegmentCount(sb, body.segment || 'all')
    body.sent_count = count ?? 0
    body.sent_at = new Date().toISOString()
  }

  const { data, error } = await sb.from('campaigns').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getServiceClient()
  await sb.from('campaigns').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

async function getSegmentCount(sb: any, segment: string) {
  if (segment === 'all') return sb.from('customers').select('*', { count: 'exact', head: true })
  if (segment === 'vip') return sb.from('customers').select('*', { count: 'exact', head: true }).gte('points', 200)
  if (segment === 'oro') return sb.from('customers').select('*', { count: 'exact', head: true }).gte('points', 100).lt('points', 200)
  if (segment === 'new') return sb.from('customers').select('*', { count: 'exact', head: true }).lt('points', 20)
  if (segment === 'inactive') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    return sb.from('customers').select('*', { count: 'exact', head: true }).lt('updated_at', cutoff)
  }
  return { count: 0 }
}
