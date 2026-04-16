import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, password, business_name } = await req.json()

  if (!email || !password || !business_name) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
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

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    const msg = authError.message.includes('already registered')
      ? 'Este email ya está registrado'
      : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = authData.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 })
  }

  // 2. Crear fila de settings para este negocio (usando service key para bypass RLS)
  const serviceClient = getServiceClient()
  const { error: settingsError } = await serviceClient.from('settings').insert({
    id: userId,
    business_name,
  })

  if (settingsError) {
    // Revertir: eliminar el usuario si falla la creación de settings
    await serviceClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Error creando configuración del negocio' }, { status: 500 })
  }

  // 3. Iniciar sesión automáticamente después del registro
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
  if (loginError) {
    // El usuario existe pero el auto-login falló — no es crítico
    return NextResponse.json({ ok: true, autoLogin: false })
  }

  return NextResponse.json({ ok: true, autoLogin: true })
}
