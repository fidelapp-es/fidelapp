import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { pushPassUpdate } from '@/lib/wallet/apns'
import {
  loadGoogleCreds, getAccessToken,
  classId, objectId, buildObjectPayload, upsertLoyaltyObject,
} from '@/lib/googleWallet'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // RLS garantiza que solo puede ver sus propios clientes
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const allowed = ['name', 'email', 'phone', 'points', 'total_spent', 'cashback_balance']
  const update: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  // RLS garantiza que solo puede editar sus propios clientes
  const { data, error } = await supabase
    .from('customers')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Invalidate Next.js cache for the customer card page and dashboard
  revalidatePath(`/cliente/${id}`)
  revalidatePath('/dashboard/clientes')

  // Sync Apple Wallet (fire-and-forget)
  pushPassUpdate(id).catch(err =>
    console.error('[Apple Wallet] Push failed:', err.message)
  )

  // Sync Google Wallet (fire-and-forget)
  ;(async () => {
    try {
      const { data: settings } = await supabase
        .from('settings').select('*').eq('id', user.id).maybeSingle()
      const cardType = settings?.card_type || 'points'
      const stampsRequired = settings?.stamps_required || 10
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const cardUrl = `${appUrl}/cliente/${id}`
      const creds = loadGoogleCreds()
      const token = await getAccessToken(creds)
      const oId = objectId(id)
      const cId = classId(data.owner_id)
      await upsertLoyaltyObject(
        buildObjectPayload(oId, cId, data, cardType, stampsRequired, cardUrl, settings),
        token,
      )
    } catch (e: any) {
      console.error('[Google Wallet] Object update failed:', e.message)
    }
  })()

  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // RLS garantiza que solo puede eliminar sus propios clientes
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
