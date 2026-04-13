'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import Link from 'next/link'
import { Coffee, Star, ArrowRight } from 'lucide-react'

export default function Home() {
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin + '/registro')
  }, [])

  return (
    <main className="min-h-screen bg-[#0D0B09] bg-noise flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Orbe de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C8873A]/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl glass-amber flex items-center justify-center">
            <Coffee className="w-5 h-5 text-[#C8873A]" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight text-glow">Plasér</h1>
        </div>
        <p className="text-[#9A8F85] tracking-widest uppercase text-xs">Programa de fidelización</p>
      </div>

      {/* Card QR con glass */}
      <div className="glass-strong rounded-3xl p-8 flex flex-col items-center gap-6 max-w-sm w-full glow-amber relative z-10">
        <p className="text-white/60 text-sm text-center leading-relaxed">
          Escanea para unirte y ganar puntos en cada visita
        </p>

        {appUrl ? (
          <div className="bg-white rounded-2xl p-4 shadow-2xl">
            <QRCode value={appUrl} size={180} fgColor="#0D0B09" bgColor="#ffffff" />
          </div>
        ) : (
          <div className="w-[212px] h-[212px] rounded-2xl bg-white/5 animate-pulse" />
        )}

        <div className="glass-amber rounded-2xl px-6 py-3 text-center w-full">
          <span className="text-2xl font-bold text-[#C8873A]">1€ = 1 punto</span>
          <p className="text-[#C8873A]/60 text-xs mt-0.5">Acumula y canjea recompensas</p>
        </div>
      </div>

      {/* Botón */}
      <div className="mt-8 relative z-10">
        <Link
          href="/registro"
          className="group flex items-center gap-2 bg-[#C8873A] text-[#0D0B09] px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#E8A85A] transition-all duration-300 shadow-lg shadow-[#C8873A]/20"
        >
          Registrarme ahora
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Badges */}
      <div className="flex gap-3 mt-8 flex-wrap justify-center relative z-10">
        {['Ofertas exclusivas', 'Recompensas gratis', 'Descuentos VIP'].map(b => (
          <span key={b} className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-xs text-white/50">
            <Star className="w-3 h-3 text-[#C8873A] fill-[#C8873A]" />
            {b}
          </span>
        ))}
      </div>

      <div className="mt-12 relative z-10">
        <Link href="/dashboard" className="text-xs text-white/20 hover:text-white/40 transition-colors">
          Acceso propietario →
        </Link>
      </div>
    </main>
  )
}
