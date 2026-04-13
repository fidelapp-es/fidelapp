import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name, price, category, active } = await req.json()
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('products')
    .insert({ name, price, category, active: active ?? true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
