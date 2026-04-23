'use client'

import QRCode from 'react-qr-code'
import { Star, Gift, TrendingUp } from 'lucide-react'
import { Customer, Promotion } from '@/lib/types'
import { useState, useEffect } from 'react'
import { applyBrandColors } from '@/lib/themes'
import { parseThemeConfig } from '@/lib/themeConfig'
import { getIcon } from '@/lib/walletIcons'

interface Settings {
  theme?: string
  custom_mode?: string
  custom_accent?: string
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
  useEffect(() => {
    const cfg = parseThemeConfig(settings?.theme)
    applyBrandColors(cfg.accent, cfg.mode)
  }, [settings?.theme])

  const themeConfig = parseThemeConfig(settings?.theme)
  const accent = themeConfig.accent
  const sectorIcon = getIcon(themeConfig.wallet.icon_key || 'coffee')
  const cardType = settings?.card_type || 'points'
  const businessName = settings?.business_name || 'Fidelapp'
  const stampsRequired = settings?.stamps_required || 10
  const stampsCollected = (customer.visits_count || 0) % stampsRequired
  const cashbackBalance = customer.cashback_balance || 0
  const nextPromotion = promotions.find(p => p.points_required > customer.points)
  const pointsToNext = nextPromotion ? nextPromotion.points_required - customer.points : 0
  const progress = nextPromotion ? Math.min((customer.points / nextPromotion.points_required) * 100, 100) : 100

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--fi-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px', gap: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'var(--fi-accent-bg)', filter: 'blur(100px)', pointerEvents: 'none',
      }} />


      {/* Header: negocio */}
      <div style={{ width: '100%', maxWidth: 384, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={businessName} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--fi-accent)">
                <path d={sectorIcon.d} />
              </svg>
            </div>
          )}
          <div>
            <p style={{ color: 'var(--fi-text)', fontWeight: 700, fontSize: 16, margin: 0 }}>{businessName}</p>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, margin: 0 }}>Programa de fidelización</p>
          </div>
        </div>
        <span style={{
          background: 'var(--fi-accent-bg)', color: 'var(--fi-accent)',
          border: '1px solid var(--fi-accent-border)', borderRadius: 20,
          fontSize: 11, fontWeight: 500, padding: '4px 12px',
        }}>Socio</span>
      </div>

      {/* QR — protagonista */}
      <div className="glass-strong" style={{ width: '100%', maxWidth: 384, borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 10 }}>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          Escanea en cada visita
        </p>
        <div style={{ background: '#fff', padding: 14, borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          <QRCode value={cardUrl} size={168} fgColor="#0D0B09" bgColor="#ffffff" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, margin: 0 }}>Bienvenido/a</p>
          <h2 style={{ color: 'var(--fi-text)', fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{customer.name}</h2>
        </div>

        {/* Apple Wallet — justo debajo del QR */}
        <a href={`/api/wallet/apple/${customer.id}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: '#000', color: '#fff', borderRadius: 12, padding: '12px 24px',
          fontWeight: 600, fontSize: 14, textDecoration: 'none', touchAction: 'manipulation',
          border: '1px solid rgba(255,255,255,0.12)', width: '100%', boxSizing: 'border-box',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Añadir a Apple Wallet
        </a>
      </div>

      {/* Métrica principal */}
      <div className="glass-strong" style={{ width: '100%', maxWidth: 384, borderRadius: 20, padding: 20, position: 'relative', zIndex: 10 }}>
        {cardType === 'points' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
              <Star size={20} style={{ color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
              <span style={{ fontSize: 48, fontWeight: 700, color: 'var(--fi-accent)', lineHeight: 1 }}>{customer.points}</span>
              <Star size={20} style={{ color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
            </div>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, margin: 0 }}>puntos acumulados</p>
            {nextPromotion && (
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 6, background: 'var(--fi-glass)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--fi-accent)', borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, margin: 0 }}>
                  Te faltan <span style={{ color: 'var(--fi-accent)', fontWeight: 600 }}>{pointsToNext} puntos</span> para {nextPromotion.title}
                </p>
              </div>
            )}
          </div>
        )}
        {cardType === 'cashback' && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: 'var(--fi-accent)', lineHeight: 1 }}>
              {Number(cashbackBalance).toFixed(2)}€
            </span>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, margin: '4px 0 0' }}>saldo cashback disponible</p>
          </div>
        )}
        {cardType === 'stamps' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
              {Array.from({ length: stampsRequired }).map((_, i) => {
                const filled = i < stampsCollected
                return (
                  <div key={i} style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: filled ? 'var(--fi-accent)' : 'var(--fi-glass)',
                    border: `2px solid ${filled ? 'var(--fi-accent)' : 'var(--fi-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.25s',
                    boxShadow: filled ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"
                      fill={filled ? '#fff' : 'var(--fi-text-muted)'}
                      style={{ opacity: filled ? 1 : 0.3 }}>
                      <path d={sectorIcon.d} />
                    </svg>
                  </div>
                )
              })}
            </div>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, textAlign: 'center', margin: 0 }}>
              {stampsCollected} / {stampsRequired} cafés
            </p>
            {stampsCollected >= stampsRequired && (
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 600, textAlign: 'center', marginTop: 8 }}>
                🎉 ¡Premio listo! {settings?.stamps_reward}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ width: '100%', maxWidth: 384, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, position: 'relative', zIndex: 10 }}>
        <div className="glass" style={{ borderRadius: 16, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
            <TrendingUp size={13} style={{ color: 'var(--fi-accent)' }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--fi-text)' }}>{Number(customer.total_spent).toFixed(0)}€</span>
          </div>
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, margin: 0 }}>total gastado</p>
        </div>
        <div className="glass" style={{ borderRadius: 16, padding: '14px 16px', textAlign: 'center' }}>
          {cardType === 'stamps' ? (
            <>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--fi-text)' }}>{customer.visits_count || 0}</span>
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, margin: '4px 0 0' }}>visitas totales</p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                <Star size={13} style={{ color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--fi-text)' }}>{customer.points}</span>
              </div>
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, margin: 0 }}>puntos totales</p>
            </>
          )}
        </div>
      </div>

      {/* Recompensas (puntos) */}
      {cardType === 'points' && promotions.length > 0 && (
        <div style={{ width: '100%', maxWidth: 384, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Gift size={15} style={{ color: 'var(--fi-accent)' }} />
            <h3 style={{ color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Recompensas disponibles
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {promotions.map(promo => {
              const canRedeem = customer.points >= promo.points_required
              return (
                <div key={promo.id} className="glass" style={{
                  borderRadius: 14, padding: 16,
                  border: canRedeem ? '1px solid var(--fi-accent-border)' : '1px solid var(--fi-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                  <div>
                    <p style={{ color: 'var(--fi-text)', fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>{promo.title}</p>
                    <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, margin: 0 }}>{promo.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
                    <p style={{ color: 'var(--fi-accent)', fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>{promo.points_required} pts</p>
                    {canRedeem && <span style={{ color: '#10B981', fontSize: 12 }}>¡Disponible!</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pie */}
      <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, textAlign: 'center', maxWidth: 280, position: 'relative', zIndex: 10, margin: 0 }}>
        {cardType === 'points' && `Muestra el QR en cada visita. ${settings?.points_per_euro || 1}€ = 1 punto.`}
        {cardType === 'cashback' && `Muestra el QR. Acumulas un ${settings?.cashback_percent || 5}% en cada compra.`}
        {cardType === 'stamps' && 'Muestra el QR en cada visita para acumular sellos.'}
      </p>
    </main>
  )
}
