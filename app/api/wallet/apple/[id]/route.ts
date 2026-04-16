import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { generatePassBuffer } from '@/lib/wallet/generatePass'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  // Basic existence check before generating
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, name')
    .eq('id', id)
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  try {
    const buffer = await generatePassBuffer(id)

    const { data: settings } = await supabase
      .from('settings')
      .select('business_name')
      .single()

    const bizName = (settings?.business_name || 'Fidelapp').replace(/\s+/g, '-')
    const custName = customer.name.replace(/\s+/g, '-')

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type':        'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${bizName}-${custName}.pkpass"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (e: any) {
    console.error('Apple Wallet error:', e.message ?? e)
    return NextResponse.json({ error: e.message || 'Error desconocido' }, { status: 500 })
  }
}
