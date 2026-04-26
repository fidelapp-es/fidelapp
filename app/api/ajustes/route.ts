import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { parseThemeConfig } from '@/lib/themeConfig'
import {
  loadGoogleCreds, getAccessToken,
  classId, buildClassPayload,
  upsertLoyaltyClass,
} from '@/lib/googleWallet'

// Columns that DEFINITELY exist in the settings table (original schema)
const BASE_COLS = new Set([
  'business_name', 'business_description', 'business_address',
  'business_phone', 'business_email', 'logo_url',
  'card_type', 'points_per_euro', 'cashback_percent',
  'stamps_required', 'stamps_reward',
  'geo_lat', 'geo_lng', 'geo_radius_meters', 'geo_message', 'geo_enabled',
  'billing_name', 'billing_cif', 'billing_address',
  'theme',   // ← stores ALL visual config as JSON (mode, accent, wallet design)
])

export async function GET() {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data, error } = await supabase.from('settings').select('*').eq('id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || {})
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  // Find existing row for this user
  const { data: existing, error: fetchErr } = await supabase
    .from('settings').select('id').eq('id', user.id).maybeSingle()
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  // If no row yet, create an empty one for this user first
  if (!existing) {
    await supabase.from('settings').insert({ id: user.id })
  }

  // Only save columns that definitely exist — skip anything unknown
  const payload: Record<string, any> = {}
  for (const [key, value] of Object.entries(body)) {
    if (key !== 'id' && key !== 'created_at' && BASE_COLS.has(key)) {
      payload[key] = value
    }
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing)
  }

  const { data, error } = await supabase
    .from('settings')
    .update(payload)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync Google Wallet loyalty class with updated business settings (fire-and-forget)
  try {
    const themeConfig  = parseThemeConfig(data.theme)
    const accentHex    = themeConfig.wallet.strip_color || themeConfig.accent || '#B5312A'
    const businessName = data.business_name || 'Fidelapp'
    const logoUrl      = themeConfig.wallet.logo_url || data.logo_url || null
    const cId          = classId(user.id)

    const creds = loadGoogleCreds()
    const token = await getAccessToken(creds)
    await upsertLoyaltyClass(buildClassPayload(cId, businessName, accentHex, logoUrl), token)
  } catch (e: any) {
    // Non-fatal: log but don't fail the settings save
    console.warn('[Google Wallet] class sync failed:', e.message)
  }

  return NextResponse.json(data)
}
