import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { parseThemeConfig } from '@/lib/themeConfig'
import {
  loadGoogleCreds, getAccessToken,
  classId, objectId,
  buildClassPayload, buildObjectPayload,
  upsertLoyaltyClass, upsertLoyaltyObject,
  buildSaveJwt,
} from '@/lib/googleWallet'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: customer, error } = await supabase
    .from('customers').select('*').eq('id', id).single()
  if (error || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { data: settings } = await supabase
    .from('settings').select('*').eq('id', customer.owner_id).maybeSingle()

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || ''
  const cardUrl     = `${appUrl}/cliente/${customer.id}`
  const themeConfig = parseThemeConfig(settings?.theme)
  const accentHex   = themeConfig.wallet.strip_color || themeConfig.accent || '#B5312A'
  const businessName = settings?.business_name || 'Fidelapp'
  const cardType    = settings?.card_type || 'stamps'
  const logoUrl     = themeConfig.wallet.logo_url || settings?.logo_url || null
  const stampsRequired = settings?.stamps_required || 10

  const cId  = classId(customer.owner_id || 'default')
  const oId  = objectId(customer.id)

  try {
    const creds = loadGoogleCreds()
    const token = await getAccessToken(creds)

    // Sync class (business settings) and object (customer data) to Google API
    await upsertLoyaltyClass(buildClassPayload(cId, businessName, accentHex, logoUrl), token)
    await upsertLoyaltyObject(buildObjectPayload(oId, cId, customer, cardType, stampsRequired, cardUrl), token)

    // JWT only references the object ID — Google fetches the live data from its API
    const saveJwt = buildSaveJwt(creds, oId)
    return NextResponse.redirect(`https://pay.google.com/gp/v/save/${saveJwt}`)
  } catch (e: any) {
    console.error('Google Wallet error:', e.message ?? e)
    return NextResponse.json({ error: e.message || 'Error generando pase' }, { status: 500 })
  }
}
