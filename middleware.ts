import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard')
  const isOnboarding = path.startsWith('/onboarding')

  if (!user) {
    if (isDashboard) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // Usuario autenticado — comprobar estado del onboarding
  if (isDashboard || isOnboarding) {
    const { data: settings } = await supabase
      .from('settings').select('onboarding_completed').eq('id', user.id).maybeSingle()

    const completed = settings?.onboarding_completed === true

    if (isDashboard && !completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    if (isOnboarding && completed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Si ya está autenticado e intenta ir a /login → redirigir al dashboard
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/onboarding', '/login'],
}
