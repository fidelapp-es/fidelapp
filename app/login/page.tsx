'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function LoyaltyCardIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 28" fill="none">
      <rect x="1" y="1" width="38" height="26" rx="4" stroke={color} strokeWidth="2"/>
      <rect x="1" y="8" width="38" height="6" fill={color} opacity="0.25"/>
      <rect x="6" y="17" width="7" height="5" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <circle cx="26" cy="19.5" r="2" fill={color} opacity="0.7"/>
      <circle cx="32" cy="19.5" r="2" fill={color} opacity="0.7"/>
    </svg>
  )
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Credenciales incorrectas')
        return
      }
      window.location.href = '/dashboard'
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    try {
      const sb = getSupabase()
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) toast.error(error.message)
    } catch {
      toast.error('Error al conectar con Google')
      setGoogleLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', background: '#F3F4F8' }}>
      {/* Left gradient panel */}
      <div style={{
        display: 'none',
        flex: 1,
        background: 'linear-gradient(145deg, #0F172A 0%, #162447 30%, #1a3a6b 55%, #c45c1a 80%, #F97316 100%)',
        padding: 40,
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }} className="md-left-panel">
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '-60px', width: 200, height: 200, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '45%', right: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Top loyalty card icon */}
        <div>
          <LoyaltyCardIcon color="white" size={36} />
        </div>

        {/* Bottom text */}
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 10 }}>Bienvenido de nuevo</p>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
            Gestiona tus clientes<br />y haz crecer<br />tu negocio
          </h2>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: '#fff',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Loyalty card icon */}
          <div style={{ marginBottom: 24 }}>
            <LoyaltyCardIcon color="#F97316" size={32} />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>
            Iniciar sesión
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 28px 0', lineHeight: 1.5 }}>
            Accede a tu panel de fidelización y gestiona tu negocio.
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 10,
              border: '1.5px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontWeight: 500,
              fontSize: 14,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 20,
              transition: 'border-color 0.2s, background 0.2s',
              opacity: googleLoading ? 0.7 : 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>o con email</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Tu email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="tu@negocio.com"
                required
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: '1.5px solid #E5E7EB',
                  fontSize: 14,
                  color: '#111827',
                  background: '#F9FAFB',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#F97316')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••••"
                  required
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 44px 0 14px',
                    borderRadius: 10,
                    border: '1.5px solid #E5E7EB',
                    fontSize: 14,
                    color: '#111827',
                    background: '#F9FAFB',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#F97316')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: 46,
                borderRadius: 10,
                border: 'none',
                background: loading ? '#FBD38D' : 'linear-gradient(90deg, #1E3A5F 0%, #F97316 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'opacity 0.2s',
                boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar al panel'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 24 }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: '#F97316', fontWeight: 500, textDecoration: 'none' }}>
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md-left-panel { display: flex !important; }
        }
      `}</style>
    </main>
  )
}
