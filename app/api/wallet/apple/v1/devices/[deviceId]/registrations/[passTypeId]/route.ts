import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

/**
 * GET /api/wallet/apple/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince={tag}
 *
 * iOS calls this on launch to find out which of its passes have updates.
 * Returns the serial numbers (customer IDs) of passes that changed since the given date.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string; passTypeId: string }> }
) {
  const { deviceId, passTypeId } = await params
  const passesUpdatedSince = req.nextUrl.searchParams.get('passesUpdatedSince')

  const supabase = getServiceClient()

  // Find all passes registered to this device
  const { data: registrations } = await supabase
    .from('pass_registrations')
    .select('serial_number')
    .eq('device_library_id', deviceId)
    .eq('pass_type_id', passTypeId)

  if (!registrations || registrations.length === 0) {
    return new NextResponse(null, { status: 204 })
  }

  const serialNumbers = registrations.map(r => r.serial_number)

  // Find which of those customers have been updated since the given tag
  let query = supabase
    .from('customers')
    .select('id, updated_at')
    .in('id', serialNumbers)

  if (passesUpdatedSince) {
    query = query.gt('updated_at', passesUpdatedSince)
  }

  const { data: updatedCustomers } = await query

  if (!updatedCustomers || updatedCustomers.length === 0) {
    return new NextResponse(null, { status: 204 })
  }

  // The lastUpdated tag is the most recent updated_at
  const lastUpdated = updatedCustomers
    .map(c => new Date(c.updated_at).toISOString())
    .sort()
    .at(-1)

  return NextResponse.json({
    serialNumbers: updatedCustomers.map(c => c.id),
    lastUpdated,
  })
}
