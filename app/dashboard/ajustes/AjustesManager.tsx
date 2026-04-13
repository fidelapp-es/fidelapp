'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Save, Building2, CreditCard, Palette, MapPin, Receipt, Check, Upload, X } from 'lucide-react'
import { THEMES, type ThemeId } from '@/lib/themes'
import { useThemeApp } from '../ThemeProvider'

const CARD_TYPES = [
  {
    id: 'points',
    name: 'Puntos',
    icon: '⭐',
    description: 'El cliente acumula puntos por cada euro gastado. Tú defines cuántos puntos vale cada euro.',
  },
  {
    id: 'cashback',
    name: 'Cashback',
    icon: '💰',
    description: 'Un porcentaje de cada compra se acumula como saldo para gastar en el negocio.',
  },
  {
    id: 'stamps',
    name: 'Sellos',
    icon: '🎯',
    description: 'Tarjeta de sellos clásica. Al completar X compras, el cliente gana un premio.',
  },
]

export default function AjustesManager({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings || {})
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [activeTab, setActiveTab] = useState<'empresa' | 'tarjeta' | 'tema' | 'geocatch' | 'facturacion'>('empresa')
  const { theme, setTheme } = useThemeApp()
  const logoInputRef = useRef<HTMLInputElement>(null)

  function set(key: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('El logo debe pesar menos de 2MB'); return }
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set('logo_url', data.url)
      toast.success('Logo subido correctamente')
    } catch (e: any) {
      toast.error('Error al subir el logo: ' + e.message)
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Error guardando')
      // Aplicar el tema solo cuando se guarda
      if (settings.theme) setTheme(settings.theme as ThemeId)
      toast.success('Ajustes guardados')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { id: 'tema', label: 'Tema', icon: Palette },
    { id: 'geocatch', label: 'Geocatch', icon: MapPin },
    { id: 'facturacion', label: 'Facturación', icon: Receipt },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: 'var(--fi-glass)', border: '1px solid var(--fi-border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              touchAction: 'manipulation',
              flex: 1,
              minWidth: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: activeTab === tab.id ? 'var(--fi-accent)' : 'transparent',
              color: activeTab === tab.id ? (theme === 'dark' ? '#0D0B09' : '#FFFFFF') : 'var(--fi-text-muted)',
            }}
          >
            <tab.icon style={{ width: 14, height: 14 }} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Empresa ── */}
      {activeTab === 'empresa' && (
        <div className="glass-strong rounded-2xl p-6 space-y-5">
          <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>Información del negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre del negocio">
              <input value={settings.business_name || ''} onChange={e => set('business_name', e.target.value)} placeholder="Cafetería Ejemplo" className="fi-input" />
            </Field>
            <Field label="Teléfono">
              <input value={settings.business_phone || ''} onChange={e => set('business_phone', e.target.value)} placeholder="612 345 678" className="fi-input" />
            </Field>
            <Field label="Email">
              <input type="email" value={settings.business_email || ''} onChange={e => set('business_email', e.target.value)} placeholder="hola@minegocio.com" className="fi-input" />
            </Field>
            <Field label="Dirección">
              <input value={settings.business_address || ''} onChange={e => set('business_address', e.target.value)} placeholder="Calle Mayor 1, Madrid" className="fi-input" />
            </Field>
            <Field label="Descripción" className="md:col-span-2">
              <textarea value={settings.business_description || ''} onChange={e => set('business_description', e.target.value)} placeholder="Breve descripción de tu negocio..." rows={3} className="fi-input resize-none" />
            </Field>
            <Field label="Logotipo" className="md:col-span-2">
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Preview */}
                <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  {settings.logo_url ? (
                    <>
                      <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} onError={(e: any) => e.target.style.display = 'none'} />
                      <button
                        onClick={() => set('logo_url', '')}
                        style={{ touchAction: 'manipulation', position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X style={{ width: 10, height: 10, color: '#fff' }} />
                      </button>
                    </>
                  ) : (
                    <Upload style={{ width: 24, height: 24, color: 'var(--fi-text-muted)' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    style={{ touchAction: 'manipulation', padding: '10px 18px', borderRadius: 12, border: '1px solid var(--fi-accent-border)', background: 'var(--fi-accent-bg)', color: 'var(--fi-accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: uploadingLogo ? 0.6 : 1 }}
                  >
                    <Upload style={{ width: 14, height: 14 }} />
                    {uploadingLogo ? 'Subiendo...' : settings.logo_url ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, marginTop: 6 }}>PNG, JPG o SVG. Máx. 2MB.<br />Aparece en el panel y en la tarjeta del cliente.</p>
                </div>
              </div>
            </Field>
          </div>
        </div>
      )}

      {/* ── Tarjeta ── */}
      {activeTab === 'tarjeta' && (
        <div className="space-y-5">
          <div className="glass-strong rounded-2xl p-6">
            <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Tipo de tarjeta de fidelización</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CARD_TYPES.map(ct => {
                const active = settings.card_type === ct.id
                return (
                  <button
                    key={ct.id}
                    onClick={() => set('card_type', ct.id)}
                    style={{
                      touchAction: 'manipulation',
                      padding: '16px',
                      borderRadius: 16,
                      border: active ? '2px solid var(--fi-accent)' : '1px solid var(--fi-border)',
                      background: active ? 'var(--fi-accent-bg)' : 'var(--fi-glass)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      position: 'relative',
                      transition: 'all 0.15s',
                    }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: 'var(--fi-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check style={{ width: 12, height: 12, color: theme === 'dark' ? '#0D0B09' : '#fff' }} />
                      </div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{ct.icon}</div>
                    <p style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{ct.name}</p>
                    <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, lineHeight: 1.5 }}>{ct.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Configuración según tipo */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 14 }}>Configuración</h3>
            {settings.card_type === 'points' && (
              <Field label="Puntos por euro gastado">
                <input type="number" min="0.1" step="0.1" value={settings.points_per_euro ?? 1} onChange={e => set('points_per_euro', Number(e.target.value))} className="fi-input" />
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: 4 }}>Ej: 2 → el cliente gana 2 puntos por cada €1 gastado</p>
              </Field>
            )}
            {settings.card_type === 'cashback' && (
              <Field label="Porcentaje de cashback (%)">
                <input type="number" min="0.1" max="100" step="0.1" value={settings.cashback_percent ?? 5} onChange={e => set('cashback_percent', Number(e.target.value))} className="fi-input" />
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: 4 }}>Ej: 5% → si gasta €20, obtiene €1.00 de cashback</p>
              </Field>
            )}
            {settings.card_type === 'stamps' && (
              <>
                <Field label="Compras para completar la tarjeta">
                  <input type="number" min="1" value={settings.stamps_required ?? 10} onChange={e => set('stamps_required', Number(e.target.value))} className="fi-input" />
                </Field>
                <Field label="Premio al completar la tarjeta">
                  <input value={settings.stamps_reward || ''} onChange={e => set('stamps_reward', e.target.value)} placeholder="Ej: Café gratis" className="fi-input" />
                </Field>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tema ── */}
      {activeTab === 'tema' && (
        <div className="glass-strong rounded-2xl p-6">
          <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Estilo visual de la app</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map(t => {
              const active = (settings.theme || 'dark') === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => set('theme', t.id)}
                  style={{
                    touchAction: 'manipulation',
                    padding: 0,
                    border: active ? '2px solid var(--fi-accent)' : '2px solid var(--fi-border)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    background: 'none',
                    position: 'relative',
                  }}
                >
                  {/* Preview */}
                  <div style={{ height: 120, background: t.preview.bg, display: 'flex', gap: 8, padding: 12, position: 'relative', overflow: 'hidden' }}>
                    {/* Mini sidebar */}
                    <div style={{ width: 40, background: t.preview.sidebar, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0', alignItems: 'center' }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ width: 20, height: 4, borderRadius: 4, background: i === 0 ? t.preview.accent : (t.id === 'minimal' ? 'rgba(255,255,255,0.2)' : t.id === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') }} />
                      ))}
                    </div>
                    {/* Mini content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 8, width: '60%', borderRadius: 4, background: t.preview.text, opacity: 0.8 }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                        {[...Array(4)].map((_, i) => (
                          <div key={i} style={{ height: 30, borderRadius: 8, background: t.preview.card, border: `1px solid ${t.id === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 12, height: 4, borderRadius: 3, background: i === 0 ? t.preview.accent : t.preview.text, opacity: i === 0 ? 1 : 0.3 }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {active && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: t.preview.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check style={{ width: 12, height: 12, color: '#FFFFFF' }} />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '10px 14px', background: 'var(--fi-glass)' }}>
                    <p style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 13 }}>{t.name}</p>
                    <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, marginTop: 2 }}>{t.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Geocatch ── */}
      {activeTab === 'geocatch' && (
        <div className="glass-strong rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>Geocatch — Notificaciones de proximidad</h2>
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, marginTop: 4 }}>Cuando un cliente esté cerca, recibirá una notificación automática.</p>
            </div>
            <button
              onClick={() => set('geo_enabled', !settings.geo_enabled)}
              style={{
                touchAction: 'manipulation',
                width: 48, height: 28, borderRadius: 14,
                background: settings.geo_enabled ? 'var(--fi-accent)' : 'var(--fi-border)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, transition: 'left 0.2s', left: settings.geo_enabled ? 24 : 4 }} />
            </button>
          </div>

          {settings.geo_enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitud del negocio">
                  <input type="number" step="0.0001" value={settings.geo_lat || ''} onChange={e => set('geo_lat', Number(e.target.value))} placeholder="40.4168" className="fi-input" />
                </Field>
                <Field label="Longitud del negocio">
                  <input type="number" step="0.0001" value={settings.geo_lng || ''} onChange={e => set('geo_lng', Number(e.target.value))} placeholder="-3.7038" className="fi-input" />
                </Field>
              </div>
              <button
                onClick={() => {
                  if (!navigator.geolocation) { toast.error('Geolocalización no disponible'); return }
                  navigator.geolocation.getCurrentPosition(pos => {
                    set('geo_lat', pos.coords.latitude)
                    set('geo_lng', pos.coords.longitude)
                    toast.success('Ubicación detectada')
                  })
                }}
                style={{ touchAction: 'manipulation', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--fi-accent-border)', background: 'var(--fi-accent-bg)', color: 'var(--fi-accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                <MapPin style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />
                Usar mi ubicación actual
              </button>
              <Field label="Radio de detección (metros)">
                <input type="number" min="50" max="5000" value={settings.geo_radius_meters || 500} onChange={e => set('geo_radius_meters', Number(e.target.value))} className="fi-input" />
              </Field>
              <Field label="Mensaje de notificación">
                <input value={settings.geo_message || ''} onChange={e => set('geo_message', e.target.value)} placeholder="¡Estás cerca! Ven a visitarnos." className="fi-input" />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* ── Facturación ── */}
      {activeTab === 'facturacion' && (
        <div className="glass-strong rounded-2xl p-6 space-y-5">
          <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>Datos de facturación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre fiscal / Razón social">
              <input value={settings.billing_name || ''} onChange={e => set('billing_name', e.target.value)} className="fi-input" />
            </Field>
            <Field label="CIF / NIF">
              <input value={settings.billing_cif || ''} onChange={e => set('billing_cif', e.target.value)} className="fi-input" />
            </Field>
            <Field label="Dirección fiscal" className="md:col-span-2">
              <input value={settings.billing_address || ''} onChange={e => set('billing_address', e.target.value)} className="fi-input" />
            </Field>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)' }}>
            <p style={{ color: 'var(--fi-accent)', fontSize: 13, fontWeight: 500 }}>Plan Fidelapp Pro — €29/mes</p>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: 2 }}>Próxima factura: próximamente</p>
          </div>
        </div>
      )}

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ touchAction: 'manipulation', width: '100%', height: 48, borderRadius: 14, background: 'var(--fi-accent)', border: 'none', color: theme === 'dark' ? '#0D0B09' : '#FFFFFF', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}
      >
        <Save style={{ width: 18, height: 18 }} />
        {saving ? 'Guardando...' : 'Guardar ajustes'}
      </button>

      <style>{`
        .fi-input {
          width: 100%;
          background: var(--fi-glass);
          border: 1px solid var(--fi-border);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          color: var(--fi-text);
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .fi-input:focus { border-color: var(--fi-accent); }
        .fi-input::placeholder { color: var(--fi-text-muted); }
      `}</style>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
