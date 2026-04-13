'use client'

import QRCode from 'react-qr-code'
import { Coffee, Star, Gift, TrendingUp, Share } from 'lucide-react'
import { Customer, Promotion } from '@/lib/types'
import { useState, useEffect } from 'react'

interface Settings {
  theme?: string
  card_type?: string
  cashback_percent?: number
  stamps_required?: number
  stamps_reward?: string
  points_per_euro?: number
  business_name?: string
  logo_url?: string
}

interface Props {
  customer: Customer
  promotions: Promotion[]
  settings: Settings | null
  cardUrl: string
}

export default function ClienteCard({ customer, promotions, settings, cardUrl }: Props) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const theme = settings?.theme || 'dark'
    document.body.setAttribute('data-theme', theme)

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    if (ios && !standalone) {
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShowBanner(true)
    }
  }, [settings?.theme])

  function dismissBanner() {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setShowBanner(false)
  }

  const cardType = settings?.card_type || 'points'
  const businessName = settings?.business_name || 'Fidelapp'
  const stampsRequired = settings?.stamps_required || 10
  const stampsCollected = (customer.visits_count || 0) % stampsRequired
  const cashbackBalance = customer.cashback_balance || 0

  const nextPromotion = promotions.find(p => p.points_required > customer.points)
  const pointsToNext = nextPromotion ? nextPromotion.points_required - customer.points : 0
  const progress = nextPromotion ? Math.min((customer.points / nextPromotion.points_required) * 100, 100) : 100

  return (
    <main style={{ minHeight: '100vh', background: 'var(--fi-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px', gap: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'var(--fi-accent-bg)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* Banner iOS */}
      {showBanner && (
        <div style={{ width: '100%', maxWidth: 384, position: 'relative', zIndex: 20 }}>
          <div className="glass-amber" style={{ borderRadius: 16, padding: 16, border: '1px solid var(--fi-accent-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--fi-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee style={{ width: 16, height: 16, color: 'var(--fi-bg)' }} />
                </div>
                <p style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 14 }}>Añade tu tarjeta al iPhone</p>
              </div>
              <button onClick={dismissBanner} style={{ touchAction: 'manipulation', color: 'var(--fi-text-muted)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>×</button>
            </div>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
              Guarda tu tarjeta en la pantalla de inicio para acceder a tu QR al instante.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--fi-glass)', borderRadius: 12, padding: '10px 12px' }}>
              <Share style={{ width: 16, height: 16, color: 'var(--fi-accent)', flexShrink: 0 }} />
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>
                Pulsa <span style={{ color: 'var(--fi-accent)', fontWeight: 600 }}>Compartir</span> → <span style={{ color: 'var(--fi-accent)', fontWeight: 600 }}>Añadir a pantalla de inicio</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta principal */}
      <div style={{ width: '100%', maxWidth: 384, position: 'relative', zIndex: 10 }}>
        <div className="glass-strong" style={{ borderRadius: 24, padding: 28 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} onError={(e: any) => e.target.style.display = 'none'} />
              ) : (
                <Coffee style={{ width: 20, height: 20, color: 'var(--fi-accent)' }} />
              )}
              <span style={{ color: 'var(--fi-text)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{businessName}</span>
            </div>
            <span className="glass-amber" style={{ color: 'var(--fi-accent)', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, border: '1px solid var(--fi-accent-border)' }}>Socio</span>
          </div>

          {/* QR */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ background: '#ffffff', padding: 12, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
              <QRCode value={cardUrl} size={160} fgColor="#0D0B09" bgColor="#ffffff" />
            </div>
          </div>

          {/* Nombre */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginBottom: 4 }}>Bienvenido/a</p>
            <h2 style={{ color: 'var(--fi-text)', fontSize: 24, fontWeight: 700, margin: 0 }}>{customer.name}</h2>
          </div>

          {/* Métrica principal según tipo de tarjeta */}
          <div className="glass" style={{ borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid var(--fi-accent-border)' }}>
            {cardType === 'points' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                  <Star style={{ width: 16, height: 16, color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                  <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--fi-accent)', lineHeight: 1 }}>{customer.points}</span>
                  <Star style={{ width: 16, height: 16, color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                </div>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>puntos acumulados</p>
              </>
            )}
            {cardType === 'cashback' && (
              <>
                <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--fi-accent)', lineHeight: 1 }}>{Number(cashbackBalance).toFixed(2)}€</span>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: 4 }}>saldo cashback disponible</p>
              </>
            )}
            {cardType === 'stamps' && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                  {Array.from({ length: stampsRequired }).map((_, i) => (
                    <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: i < stampsCollected ? 'var(--fi-accent)' : 'var(--fi-glass)', border: `2px solid ${i < stampsCollected ? 'var(--fi-accent)' : 'var(--fi-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {i < stampsCollected && <span style={{ color: 'var(--fi-bg)', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                  ))}
                </div>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{stampsCollected} / {stampsRequired} sellos</p>
                {stampsCollected >= stampsRequired && (
                  <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, marginTop: 6 }}>🎉 ¡Premio listo! {settings?.stamps_reward}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progreso — solo puntos */}
      {cardType === 'points' && nextPromotion && (
        <div className="glass-strong" style={{ width: '100%', maxWidth: 384, borderRadius: 20, padding: 20, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Próxima recompensa</p>
            <span style={{ color: 'var(--fi-accent)', fontSize: 12, fontWeight: 500 }}>{nextPromotion.points_required} pts</span>
          </div>
          <p style={{ color: 'var(--fi-text)', fontWeight: 500, fontSize: 14, marginBottom: 12 }}>{nextPromotion.title}</p>
          <div style={{ width: '100%', background: 'var(--fi-glass)', borderRadius: 99, height: 8, marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, background: 'var(--fi-accent)', height: 8, borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>
            Te faltan <span style={{ color: 'var(--fi-accent)', fontWeight: 600 }}>{pointsToNext} puntos</span>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="glass-strong" style={{ width: '100%', maxWidth: 384, borderRadius: 20, padding: 20, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
              <TrendingUp style={{ width: 14, height: 14, color: 'var(--fi-accent)' }} />
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--fi-text)' }}>{Number(customer.total_spent).toFixed(0)}€</span>
            </div>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>total gastado</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            {cardType === 'points' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                  <Star style={{ width: 14, height: 14, color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--fi-text)' }}>{customer.points}</span>
                </div>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>puntos totales</p>
              </>
            )}
            {cardType === 'cashback' && (
              <>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--fi-text)' }}>{Number(cashbackBalance).toFixed(2)}€</span>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>cashback</p>
              </>
            )}
            {cardType === 'stamps' && (
              <>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--fi-text)' }}>{customer.visits_count || 0}</span>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>visitas totales</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recompensas — solo puntos */}
      {cardType === 'points' && promotions.length > 0 && (
        <div style={{ width: '100%', maxWidth: 384, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Gift style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
            <h3 style={{ color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Recompensas disponibles</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {promotions.map(promo => {
              const canRedeem = customer.points >= promo.points_required
              return (
                <div key={promo.id} className="glass" style={{ borderRadius: 14, padding: 16, border: canRedeem ? '1px solid var(--fi-accent-border)' : '1px solid var(--fi-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ color: 'var(--fi-text)', fontSize: 14, fontWeight: 500, margin: 0 }}>{promo.title}</p>
                      <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: 2 }}>{promo.description}</p>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
                      <p style={{ color: 'var(--fi-accent)', fontSize: 14, fontWeight: 700, margin: 0 }}>{promo.points_required} pts</p>
                      {canRedeem && <span style={{ color: '#10B981', fontSize: 12 }}>¡Disponible!</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, textAlign: 'center', maxWidth: 280, position: 'relative', zIndex: 10 }}>
        {cardType === 'points' && `Muestra este QR en cada visita. ${settings?.points_per_euro || 1}€ = 1 punto.`}
        {cardType === 'cashback' && `Muestra este QR. Acumulas un ${settings?.cashback_percent || 5}% en cada compra.`}
        {cardType === 'stamps' && 'Muestra este QR en cada visita para acumular sellos.'}
      </p>
    </main>
  )
}
