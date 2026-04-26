import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customer')

  // ── Env vars ──────────────────────────────────────────────────────────────
  const envCheck = {
    APPLE_WWDR_CERT:               boolLen('APPLE_WWDR_CERT'),
    APPLE_SIGNER_CERT:             boolLen('APPLE_SIGNER_CERT'),
    APPLE_SIGNER_KEY:              boolLen('APPLE_SIGNER_KEY'),
    PASS_TYPE_ID:                  process.env.PASS_TYPE_ID ?? '(not set)',
    NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL ?? '(not set)',
    appUrlStartsHttps:             (process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https://'),
    GOOGLE_WALLET_CREDENTIALS_JSON: boolLen('GOOGLE_WALLET_CREDENTIALS_JSON'),
  }

  // ── DB checks (optional, if customer ID provided) ─────────────────────────
  let dbCheck: any = null
  if (customerId) {
    const supabase = getServiceClient()

    const { data: customer } = await supabase
      .from('customers').select('id, updated_at, auth_token, owner_id')
      .eq('id', customerId).maybeSingle()

    const { data: regs } = await supabase
      .from('pass_registrations').select('device_library_id, push_token, pass_type_id')
      .eq('serial_number', customerId)

    dbCheck = {
      customerFound:   !!customer,
      updatedAt:       customer?.updated_at ?? null,
      hasAuthToken:    !!(customer?.auth_token),
      registrations:   regs ?? [],
      registrationCount: (regs ?? []).length,
    }
  }

  return NextResponse.json({ envCheck, dbCheck })
}

function boolLen(key: string) {
  const v = process.env[key] ?? ''
  return { set: v.length > 0, length: v.length }
}
