import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const sb = getServiceClient()
  const { data, error } = await sb.from('settings').select('*').eq('id', SETTINGS_ID).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const sb = getServiceClient()
  const body = await req.json()
  const { data, error } = await sb
    .from('settings')
    .upsert({ id: SETTINGS_ID, ...body }, { onConflict: 'id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
