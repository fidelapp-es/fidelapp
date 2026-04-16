import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET — lista clientes del negocio autenticado
export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')
  let query = supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — crea un cliente
// Puede ser llamado desde el dashboard (autenticado) o desde /registro?b=OWNER_ID (público)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, owner_id: ownerFromBody } = body

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Determinar owner_id: sesión autenticada o parámetro público
  let ownerId: string | null = null

  const { user } = await getAuthUser()
  if (user) {
    ownerId = user.id
  } else if (ownerFromBody) {
    // Verificar que el negocio existe (seguridad mínima)
    const sc = getServiceClient()
    const { data: biz } = await sc.from('settings').select('owner_id').eq('owner_id', ownerFromBody).single()
    if (!biz) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    ownerId = ownerFromBody
  } else {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Usar service client para la operación de inserción (RLS requeriría auth del usuario)
  const supabase = getServiceClient()

  // Comprobar duplicado dentro de este negocio
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .eq('owner_id', ownerId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Este email ya está registrado', customerId: existing.id }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, email, phone, qr_code: uuidv4(), owner_id: ownerId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
