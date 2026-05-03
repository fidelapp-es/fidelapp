import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'

const ALLOWED = new Set([
  'business_name', 'business_category', 'business_address', 'business_city',
  'business_postal_code', 'business_phone', 'business_website',
  'contact_name', 'contact_role', 'contact_phone', 'contact_avatar_url',
  'logo_url', 'secondary_color', 'theme',
  'onboarding_step', 'onboarding_completed',
])

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const payload: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED.has(k)) payload[k] = v
  }

  const { data: existing } = await supabase
    .from('settings').select('id').eq('id', user.id).maybeSingle()

  if (!existing) {
    await supabase.from('settings').insert({ id: user.id, ...payload })
  } else {
    await supabase.from('settings').update(payload).eq('id', user.id)
  }

  return NextResponse.json({ ok: true })
}
