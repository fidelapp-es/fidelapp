import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { generatePassBuffer } from '@/lib/wallet/generatePass'

/**
 * GET /api/wallet/apple/v1/passes/{passTypeIdentifier}/{serialNumber}
 *
 * Apple calls this after receiving an APNs push to get the latest pass data.
 * serialNumber = customer.id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passTypeId: string; serialNumber: string }> }
) {
  const { serialNumber } = await params

  // Verify Authorization: ApplePass <authenticationToken>
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^ApplePass\s+/i, '').trim()

  const supabase = getServiceClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('id, updated_at, auth_token')
    .eq('id', serialNumber)
    .single()

  if (!customer) {
    return new NextResponse(null, { status: 401 })
  }

  // auth_token may be UUID or customer.id (pre-migration fallback)
  const expectedToken = customer.auth_token ? String(customer.auth_token) : serialNumber
  if (expectedToken !== token) {
    return new NextResponse(null, { status: 401 })
  }

  // Check If-Modified-Since header — if the pass hasn't changed, return 304
  const ifModifiedSince = req.headers.get('if-modified-since')
  if (ifModifiedSince && customer.updated_at) {
    const since = new Date(ifModifiedSince)
    const updatedAt = new Date(customer.updated_at)
    if (updatedAt <= since) {
      return new NextResponse(null, { status: 304 })
    }
  }

  try {
    const buffer = await generatePassBuffer(serialNumber)
    const lastModified = customer.updated_at
      ? new Date(customer.updated_at).toUTCString()
      : new Date().toUTCString()

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type':  'application/vnd.apple.pkpass',
        'Last-Modified': lastModified,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    console.error('[PassKit] Error generating pass:', e.message)
    return new NextResponse(null, { status: 500 })
  }
}
