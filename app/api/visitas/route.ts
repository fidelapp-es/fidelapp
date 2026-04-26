import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { pushPassUpdate } from '@/lib/wallet/apns'
import { parseThemeConfig } from '@/lib/themeConfig'
import {
  loadGoogleCreds, getAccessToken,
  classId, objectId, buildObjectPayload, upsertLoyaltyObject,
} from '@/lib/googleWallet'

export async function POST(req: NextRequest) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { qr_code, customer_id, amount_spent, notes } = await req.json()

  if ((!qr_code && !customer_id) || !amount_spent || amount_spent <= 0) {
    return NextResponse.json({ error: 'Datos incorrectos' }, { status: 400 })
  }

  // Obtener configuración del negocio autenticado filtrada por user.id
  const { data: settings } = await supabase
    .from('settings')
    .select('card_type, points_per_euro, cashback_percent, stamps_required, stamps_reward')
    .eq('id', user.id)
    .maybeSingle()

  const cardType = settings?.card_type || 'points'
  const pointsPerEuro = Number(settings?.points_per_euro ?? 1)
  const cashbackPercent = Number(settings?.cashback_percent ?? 5)
  const stampsRequired = settings?.stamps_required || 10

  // Buscar cliente del negocio filtrando explícitamente por owner_id
  const customerQuery = supabase.from('customers').select('*').eq('owner_id', user.id)
  const { data: customer, error: findError } = customer_id
    ? await customerQuery.eq('id', customer_id).single()
    : await customerQuery.eq('qr_code', qr_code).single()

  if (findError || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // Calcular según tipo de tarjeta
  let points_earned = 0
  let cashback_earned = 0
  let stamps_earned = 0

  if (cardType === 'points') {
    points_earned = Math.floor(Number(amount_spent) * pointsPerEuro)
  } else if (cardType === 'cashback') {
    cashback_earned = Math.round(Number(amount_spent) * cashbackPercent) / 100
    points_earned = Math.round(cashback_earned * 100)
  } else if (cardType === 'stamps') {
    stamps_earned = 1
    points_earned = 1
  }

  // Registrar visita con owner_id
  const { error: visitError } = await supabase.from('visits').insert({
    customer_id: customer.id,
    owner_id: user.id,
    amount_spent: Number(amount_spent),
    points_earned,
    notes: notes || null,
  })

  if (visitError) return NextResponse.json({ error: visitError.message }, { status: 500 })

  // Actualizar cliente
  const newPoints = (customer.points || 0) + points_earned
  const newVisits = (customer.visits_count || 0) + 1
  const newCashback = Math.round(((customer.cashback_balance || 0) + cashback_earned) * 100) / 100
  const stampsCompleted = cardType === 'stamps' && newVisits % stampsRequired === 0

  const { data: updated, error: updateError } = await supabase
    .from('customers')
    .update({
      points:           newPoints,
      total_spent:      Number(customer.total_spent) + Number(amount_spent),
      visits_count:     newVisits,
      cashback_balance: newCashback,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', customer.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // ── Wallet sync (fire-and-forget) ─────────────────────────────────────────
  // Apple Wallet: APNs silent push → iOS fetches updated pass from our web service
  pushPassUpdate(customer.id).catch(err =>
    console.error('[Apple Wallet] Push failed:', err.message)
  )

  // Google Wallet: update the LoyaltyObject directly via REST API
  ;(async () => {
    try {
      const appUrl  = process.env.NEXT_PUBLIC_APP_URL || ''
      const cardUrl = `${appUrl}/cliente/${customer.id}`
      const creds   = loadGoogleCreds()
      const token   = await getAccessToken(creds)
      const oId     = objectId(customer.id)
      const cId     = classId(customer.owner_id)
      await upsertLoyaltyObject(
        buildObjectPayload(oId, cId, updated, cardType, stampsRequired, cardUrl),
        token,
      )
    } catch (e: any) {
      console.error('[Google Wallet] Object update failed:', e.message)
    }
  })()

  let display: Record<string, any> = {}
  if (cardType === 'points') {
    display = { label: 'Puntos ganados', value: `+${points_earned} pts`, total: `${newPoints} puntos` }
  } else if (cardType === 'cashback') {
    display = { label: 'Cashback ganado', value: `+${cashback_earned.toFixed(2)}€`, total: `${newCashback.toFixed(2)}€ acumulados` }
  } else if (cardType === 'stamps') {
    const currentStamp = newVisits % stampsRequired || stampsRequired
    display = {
      label: stampsCompleted ? '¡Tarjeta completada!' : 'Sello añadido',
      value: stampsCompleted ? `🎉 ${settings?.stamps_reward}` : `${currentStamp}/${stampsRequired} sellos`,
      total: `${newVisits} visitas totales`,
      completed: stampsCompleted,
    }
  }

  return NextResponse.json({
    customer: updated,
    points_earned,
    cashback_earned,
    stamps_earned,
    card_type: cardType,
    display,
    message: `${display.value} para ${customer.name}`,
  })
}
