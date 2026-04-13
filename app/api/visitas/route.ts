import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(req: NextRequest) {
  const { qr_code, customer_id, amount_spent, notes } = await req.json()

  if ((!qr_code && !customer_id) || !amount_spent || amount_spent <= 0) {
    return NextResponse.json({ error: 'Datos incorrectos' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Obtener configuración del negocio (card_type, puntos, cashback, sellos)
  const { data: settings } = await supabase
    .from('settings')
    .select('card_type, points_per_euro, cashback_percent, stamps_required, stamps_reward')
    .eq('id', SETTINGS_ID)
    .single()

  const cardType = settings?.card_type || 'points'
  const pointsPerEuro = Number(settings?.points_per_euro ?? 1)
  const cashbackPercent = Number(settings?.cashback_percent ?? 5)

  // Buscar cliente — por ID (QR nuevo con URL) o por qr_code (QR antiguo)
  const customerQuery = supabase.from('customers').select('*')
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
    points_earned = Math.round(cashback_earned * 100) // guardamos en centavos como "puntos"
  } else if (cardType === 'stamps') {
    stamps_earned = 1
    points_earned = 1
  }

  // Registrar visita
  const { error: visitError } = await supabase.from('visits').insert({
    customer_id: customer.id,
    amount_spent: Number(amount_spent),
    points_earned,
    notes: notes || null,
  })

  if (visitError) return NextResponse.json({ error: visitError.message }, { status: 500 })

  // Actualizar cliente
  const newPoints = (customer.points || 0) + points_earned
  const newVisits = (customer.visits_count || 0) + 1
  const newCashback = Math.round(((customer.cashback_balance || 0) + cashback_earned) * 100) / 100

  // Comprobar si completa tarjeta de sellos
  const stampsRequired = settings?.stamps_required || 10
  const stampsCompleted = cardType === 'stamps' && newVisits % stampsRequired === 0

  const { data: updated, error: updateError } = await supabase
    .from('customers')
    .update({
      points: newPoints,
      total_spent: Number(customer.total_spent) + Number(amount_spent),
      visits_count: newVisits,
      cashback_balance: newCashback,
    })
    .eq('id', customer.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Respuesta adaptada al tipo de tarjeta
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
