import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

type Ctx = { params: Promise<{ deviceId: string; passTypeId: string; serialNumber: string }> }

/**
 * POST /api/wallet/apple/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 *
 * iOS calls this when the user adds the pass to Wallet.
 * Body: { "pushToken": "..." }
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { deviceId, passTypeId, serialNumber } = await params

  // Verify Authorization: ApplePass <authenticationToken>
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^ApplePass\s+/i, '').trim()

  const supabase = getServiceClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('id, auth_token')
    .eq('id', serialNumber)
    .single()

  const expectedToken = customer?.auth_token ? String(customer.auth_token) : serialNumber
  if (!customer || expectedToken !== token) {
    return new NextResponse(null, { status: 401 })
  }

  let pushToken: string
  try {
    const body = await req.json()
    pushToken = body.pushToken
    if (!pushToken) throw new Error('missing pushToken')
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  // Upsert the registration (device may re-register with a new push token)
  const { error } = await supabase.from('pass_registrations').upsert(
    {
      device_library_id: deviceId,
      push_token:        pushToken,
      serial_number:     serialNumber,
      pass_type_id:      passTypeId,
    },
    { onConflict: 'device_library_id,serial_number' }
  )

  if (error) {
    console.error('[PassKit] Registration error:', error.message)
    return new NextResponse(null, { status: 500 })
  }

  return new NextResponse(null, { status: 201 })
}

/**
 * DELETE /api/wallet/apple/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 *
 * iOS calls this when the user removes the pass from Wallet.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { deviceId, passTypeId, serialNumber } = await params

  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^ApplePass\s+/i, '').trim()

  const supabase = getServiceClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('id, auth_token')
    .eq('id', serialNumber)
    .single()

  const expectedToken2 = customer?.auth_token ? String(customer.auth_token) : serialNumber
  if (!customer || expectedToken2 !== token) {
    return new NextResponse(null, { status: 401 })
  }

  await supabase
    .from('pass_registrations')
    .delete()
    .eq('device_library_id', deviceId)
    .eq('serial_number', serialNumber)
    .eq('pass_type_id', passTypeId)

  return new NextResponse(null, { status: 200 })
}
