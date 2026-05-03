import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getAuthUser } from '@/lib/supabase/server'
import { pushPassUpdate } from '@/lib/wallet/apns'

/**
 * GET  /api/debug/push-test?customer=ID   → check registrations
 * POST /api/debug/push-test?customer=ID   → send test push
 */
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const customerId = new URL(req.url).searchParams.get('customer')
  if (!customerId) return NextResponse.json({ error: 'Falta ?customer=ID' }, { status: 400 })

  const sb = getServiceClient()
  const passTypeId = process.env.PASS_TYPE_ID || 'pass.es.fidelapp.loyalty'

  const { data: customer } = await sb
    .from('customers').select('id, name, owner_id, last_promo_message, updated_at, auth_token')
    .eq('id', customerId).maybeSingle()

  if (!customer || customer.owner_id !== user.id)
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const { data: regs } = await sb
    .from('pass_registrations').select('device_library_id, push_token, pass_type_id, created_at')
    .eq('serial_number', customerId)

  const envOk = {
    PASS_TYPE_ID:        process.env.PASS_TYPE_ID ?? '(not set — using default)',
    APPLE_SIGNER_CERT:   (process.env.APPLE_SIGNER_CERT?.length ?? 0) > 0,
    APPLE_SIGNER_KEY:    (process.env.APPLE_SIGNER_KEY?.length ?? 0) > 0,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '(not set)',
  }

  return NextResponse.json({
    customer: { id: customer.id, name: customer.name, last_promo_message: customer.last_promo_message, updated_at: customer.updated_at, has_auth_token: !!customer.auth_token },
    registrations: regs ?? [],
    registrationCount: (regs ?? []).length,
    passTypeIdUsed: passTypeId,
    env: envOk,
    verdict: (regs ?? []).length === 0
      ? '❌ Sin dispositivos registrados — el cliente debe añadir la tarjeta a Apple Wallet'
      : `✅ ${(regs ?? []).length} dispositivo(s) registrado(s) — push debería funcionar`,
  })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const customerId = new URL(req.url).searchParams.get('customer')
  if (!customerId) return NextResponse.json({ error: 'Falta ?customer=ID' }, { status: 400 })

  const sb = getServiceClient()
  const { data: customer } = await sb
    .from('customers').select('id, owner_id')
    .eq('id', customerId).maybeSingle()

  if (!customer || customer.owner_id !== user.id)
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  // Write a test message
  await sb.from('customers')
    .update({ last_promo_message: '🔔 Notificación de prueba desde Fidelapp', updated_at: new Date().toISOString() })
    .eq('id', customerId)

  try {
    await pushPassUpdate(customerId)
    return NextResponse.json({ ok: true, message: 'Push enviado — revisa el móvil en unos segundos' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
