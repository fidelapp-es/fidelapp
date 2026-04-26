import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { parseThemeConfig } from '@/lib/themeConfig'
import jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import path from 'path'

const ISSUER_ID = '3388000000023115382'
const SERVICE_ACCOUNT = 'fidelapp-wallet@fidelapp-493317.iam.gserviceaccount.com'

function loadCredentials(): { private_key: string; client_email: string } {
  const b64 = process.env.GOOGLE_WALLET_CREDENTIALS
  if (b64) {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  }
  const filePath = path.join(process.cwd(), 'certs', 'google-wallet-credentials.json')
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('id', customer.owner_id)
    .maybeSingle()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const cardUrl = `${appUrl}/cliente/${customer.id}`

  const themeConfig  = parseThemeConfig(settings?.theme)
  const accentHex    = themeConfig.wallet.strip_color || themeConfig.accent || '#B5312A'
  const businessName = settings?.business_name || 'Fidelapp'
  const cardType     = settings?.card_type || 'stamps'
  const logoUrl      = themeConfig.wallet.logo_url || settings?.logo_url || null

  const stampsRequired  = settings?.stamps_required || 10
  const stampsCollected = (customer.visits_count || 0) % stampsRequired

  let loyaltyPointsLabel = 'PUNTOS'
  let loyaltyPointsValue = ''
  if (cardType === 'points') {
    loyaltyPointsLabel = 'Puntos'
    loyaltyPointsValue = String(customer.points || 0)
  } else if (cardType === 'cashback') {
    loyaltyPointsLabel = 'Cashback'
    loyaltyPointsValue = `${Number(customer.cashback_balance || 0).toFixed(2)}€`
  } else {
    loyaltyPointsLabel = 'Sellos'
    loyaltyPointsValue = `${stampsCollected}/${stampsRequired}`
  }

  // Class ID is per-owner so each business gets its own template
  const classId  = `${ISSUER_ID}.${(customer.owner_id || 'default').replace(/-/g, '_')}`
  const objectId = `${ISSUER_ID}.${customer.id.replace(/-/g, '_')}`

  const loyaltyClass: Record<string, any> = {
    id: classId,
    issuerName: businessName,
    programName: businessName,
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: accentHex,
    countryCode: 'ES',
    ...(logoUrl ? {
      programLogo: {
        sourceUri: { uri: logoUrl },
        contentDescription: { defaultValue: { language: 'es-ES', value: businessName } },
      },
    } : {}),
  }

  const loyaltyObject: Record<string, any> = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountId: customer.id.slice(0, 8).toUpperCase(),
    accountName: customer.name,
    loyaltyPoints: {
      balance: { string: loyaltyPointsValue },
      label: loyaltyPointsLabel,
    },
    barcode: {
      type: 'QR_CODE',
      value: cardUrl,
      alternateText: customer.name,
    },
    textModulesData: [
      {
        header: 'VISITAS',
        body: String(customer.visits_count || 0),
        id: 'visitas',
      },
      {
        header: 'TOTAL GASTADO',
        body: `${Number(customer.total_spent || 0).toFixed(2)}€`,
        id: 'gastado',
      },
    ],
  }

  try {
    const creds = loadCredentials()

    const payload = {
      iss: creds.client_email,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        loyaltyClasses: [loyaltyClass],
        loyaltyObjects: [loyaltyObject],
      },
    }

    const token = jwt.sign(payload, creds.private_key, { algorithm: 'RS256' })
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`

    return NextResponse.redirect(saveUrl)
  } catch (e: any) {
    console.error('Google Wallet error:', e.message ?? e)
    return NextResponse.json({ error: e.message || 'Error generando pase' }, { status: 500 })
  }
}
