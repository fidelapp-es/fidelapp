import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  // In Vercel, x-forwarded-host is the real public domain.
  // `origin` would be an internal Vercel URL the browser can't reach.
  const forwardedHost = req.headers.get('x-forwarded-host')
  const base = forwardedHost ? `https://${forwardedHost}` : origin

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=no_code`)
  }

  // Capture every cookie Supabase wants to write so we can attach them
  // to the redirect response (NextResponse.redirect is a NEW response object
  // — cookies set via next/headers would NOT appear on it).
  const cookiesToSet: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read PKCE verifier and any existing cookies from the incoming request
        getAll() {
          return req.cookies.getAll()
        },
        // Collect session cookies — we'll attach them to the redirect below
        setAll(cookies) {
          cookiesToSet.push(...cookies)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[OAuth callback] exchangeCodeForSession error:', error?.message)
    return NextResponse.redirect(`${base}/login?error=auth_failed`)
  }

  // Create a fresh settings row for new users (existing users are left untouched)
  const userId = data.user.id
  const serviceClient = getServiceClient()

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

  // Build the redirect and attach session cookies to THIS response object
  const response = NextResponse.redirect(`${base}/dashboard`)
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
