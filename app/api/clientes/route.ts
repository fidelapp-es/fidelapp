import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()
  const q = req.nextUrl.searchParams.get('q')

  let query = supabase.from('customers').select('*').order('created_at', { ascending: false })

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name, email, phone } = await req.json()

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Comprobar si ya existe
  const { data: existing } = await supabase
    .from('customers')
    .select('id, qr_code')
    .eq('email', email)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Este email ya está registrado', customerId: existing.id }, { status: 409 })
  }

  const qr_code = uuidv4()

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, email, phone, qr_code })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
