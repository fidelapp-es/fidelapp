'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Coffee, Lock } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        toast.error('Contraseña incorrecta')
        return
      }
      window.location.href = '/dashboard'
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0B09] bg-noise flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C8873A]/6 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl glass-amber flex items-center justify-center">
              <Coffee className="w-5 h-5 text-[#C8873A]" />
            </div>
            <h1 className="text-3xl font-bold text-white text-glow">Plasér</h1>
          </div>
          <p className="text-[#9A8F85] text-xs tracking-widest uppercase">Panel de administración</p>
        </div>

        <div className="glass-strong rounded-3xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-[#C8873A]" />
            <p className="text-white/50 text-sm">Acceso restringido</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <Label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-12"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#C8873A] hover:bg-[#E8A85A] text-[#0D0B09] font-semibold h-12 rounded-xl transition-all duration-300 shadow-lg shadow-[#C8873A]/20 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar al panel'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
