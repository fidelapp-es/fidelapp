'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Star, ArrowRight, Gift, Shield } from 'lucide-react'
import { applyBrandColors } from '@/lib/themes'
import { parseThemeConfig } from '@/lib/themeConfig'

interface BusinessSettings {
  business_name: string
  logo_url: string
  card_type: string
  custom_accent: string
  custom_mode: string
  owner_id: string
}

function RegistroContent() {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const businessId = searchParams.get('b') // owner_id del negocio

  useEffect(() => {
    const url = businessId
      ? `/api/public/settings?owner_id=${businessId}`
      : '/api/public/settings'

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data)
          const cfg = parseThemeConfig(data.theme)
          applyBrandColors(cfg.accent, cfg.mode)
        }
      })
      .catch(() => {})
  }, [businessId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, owner_id: businessId }),
      })
      const data = await res.json()
      if (res.status === 409) { toast.info('Ya estás registrado'); router.push(`/cliente/${data.customerId}`); return }
      if (!res.ok) { toast.error(data.error || 'Error al registrarse'); return }
      toast.success('¡Bienvenido!')
      router.push(`/cliente/${data.id}`)
    } finally { setLoading(false) }
  }

  const accent = settings?.custom_accent || '#C8873A'
  const businessName = settings?.business_name || 'Fidelapp'

  return (
    <main className="min-h-screen bg-noise flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: 'var(--fi-bg)' }}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: `${accent}20` }} />

      <div className="text-center mb-10 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" style={{ width: 48, height: 48, borderRadius: 16, objectFit: 'contain' }} />
          ) : (
            <div className="w-12 h-12 rounded-2xl glass-amber flex items-center justify-center" style={{ background: `${accent}20` }}>
              <Zap className="w-6 h-6" style={{ color: accent }} />
            </div>
          )}
          <h1 className="text-4xl font-bold" style={{ color: 'var(--fi-text)' }}>{businessName}</h1>
        </div>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }} className="tracking-widest uppercase">Únete al programa de fidelización</p>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap justify-center relative z-10">
        {[
          { icon: Star, text: 'Gana recompensas' },
          { icon: Gift, text: 'Ofertas exclusivas' },
          { icon: Shield, text: 'Datos protegidos' },
        ].map(b => (
          <span key={b.text} className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs" style={{ color: 'var(--fi-text-muted)' }}>
            <b.icon className="w-3 h-3" style={{ color: accent }} />
            {b.text}
          </span>
        ))}
      </div>

      <div className="glass-strong rounded-3xl p-8 w-full max-w-md relative z-10">
        <h2 className="font-semibold text-lg mb-6" style={{ color: 'var(--fi-text)' }}>Crea tu cuenta</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            { name: 'name', label: 'Nombre completo', placeholder: 'María García', type: 'text' },
            { name: 'email', label: 'Email', placeholder: 'maria@ejemplo.com', type: 'email' },
            { name: 'phone', label: 'Teléfono', placeholder: '612 345 678', type: 'tel' },
          ].map(field => (
            <div key={field.name}>
              <Label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--fi-text-muted)' }}>{field.label}</Label>
              <Input
                name={field.name}
                type={field.type}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                className="rounded-xl h-12"
                style={{ background: 'var(--fi-glass)', borderColor: 'var(--fi-border)', color: 'var(--fi-text)' }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{ touchAction: 'manipulation', background: accent, color: '#fff', height: 48, borderRadius: 14, border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Registrando...' : <><span>¡Unirme al programa!</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        <p className="text-xs text-center mt-6" style={{ color: 'var(--fi-text-muted)' }}>
          Tus datos se usan solo para el programa de fidelización de {businessName}.
        </p>
      </div>
    </main>
  )
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroContent />
    </Suspense>
  )
}
