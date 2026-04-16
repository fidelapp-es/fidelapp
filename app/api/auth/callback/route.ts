import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const userId = data.user.id
  const serviceClient = getServiceClient()

  // Create settings row for new users if it doesn't exist yet
  const { data: existing } = await serviceClient
    .from('settings')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!existing) {
    const businessName =
      data.user.user_metadata?.full_name ||
      data.user.email?.split('@')[0] ||
      'Mi Negocio'

    await serviceClient.from('settings').insert({
      id: userId,
      business_name: businessName,
    })
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
