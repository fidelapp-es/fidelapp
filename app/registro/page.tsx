'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Star, ArrowRight, Gift, Shield } from 'lucide-react'

export default function RegistroPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.status === 409) { toast.info('Ya estás registrado'); router.push(`/cliente/${data.customerId}`); return }
      if (!res.ok) { toast.error(data.error || 'Error al registrarse'); return }
      toast.success('¡Bienvenido a Fidelapp!')
      router.push(`/cliente/${data.id}`)
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-noise flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: 'var(--fi-bg)' }}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'var(--fi-accent-bg)' }} />

      <div className="text-center mb-10 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-12 h-12 rounded-2xl glass-amber flex items-center justify-center">
            <Zap className="w-6 h-6" style={{ color: 'var(--fi-accent)' }} />
          </div>
          <h1 className="text-4xl font-bold text-glow" style={{ color: 'var(--fi-text)' }}>Fidelapp</h1>
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
            <b.icon className="w-3 h-3" style={{ color: 'var(--fi-accent)' }} />
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
            style={{ touchAction: 'manipulation', background: 'var(--fi-accent)', color: 'var(--fi-text)', height: 48, borderRadius: 14, border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Registrando...' : <><span>¡Unirme al programa!</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        <p className="text-xs text-center mt-6" style={{ color: 'var(--fi-text-muted)' }}>
          Tus datos se usan solo para el programa de fidelización.
        </p>
      </div>
    </main>
  )
}
