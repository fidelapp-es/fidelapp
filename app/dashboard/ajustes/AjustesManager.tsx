'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, Building2, CreditCard, Palette, MapPin, Receipt, Check, Upload, X, Moon, Sun, Wallet, Link as LinkIcon, Copy, Download, QrCode } from 'lucide-react'
import QRCode from 'react-qr-code'
import QRCodeLib from 'qrcode'
import { applyBrandColors, type ColorMode } from '@/lib/themes'
import { useThemeApp } from '../ThemeProvider'
import { parseThemeConfig, serializeThemeConfig, type ThemeConfig } from '@/lib/themeConfig'

const CARD_TYPES = [
  { id: 'points',   name: 'Puntos',   icon: '⭐', description: 'El cliente acumula puntos por cada euro gastado.' },
  { id: 'cashback', name: 'Cashback', icon: '💰', description: 'Un porcentaje de cada compra se acumula como saldo.' },
  { id: 'stamps',   name: 'Sellos',   icon: '☕', description: 'Tarjeta de sellos. Al completar X visitas gana un premio.' },
]

const PRESET_COLORS = [
  { color: '#C8873A', name: 'Ámbar' },
  { color: '#E85D26', name: 'Naranja' },
  { color: '#E84040', name: 'Rojo' },
  { color: '#EC4899', name: 'Rosa' },
  { color: '#8B5CF6', name: 'Violeta' },
  { color: '#3B82F6', name: 'Azul' },
  { color: '#14B8A6', name: 'Turquesa' },
  { color: '#10B981', name: 'Verde' },
  { color: '#1A1A1A', name: 'Negro' },
]

// Columns that exist in the original DB schema — no migration needed
const BASE_FIELDS = [
  'business_name', 'business_description', 'business_address', 'business_phone', 'business_email',
  'logo_url', 'card_type', 'points_per_euro', 'cashback_percent', 'stamps_required', 'stamps_reward',
  'geo_lat', 'geo_lng', 'geo_radius_meters', 'geo_message', 'geo_enabled',
  'billing_name', 'billing_cif', 'billing_address',
  'theme',  // stores ALL visual config (mode, accent, wallet design) as JSON
]

// ── Wallet card preview ───────────────────────────────────────────────────────
function WalletPreview({ s, cardType }: { s: any; cardType: string }) {
  const stripColor   = s.wallet_strip_color || s.custom_accent || '#B5312A'
  const bgColor      = s.wallet_bg_color    || '#F0E8D8'
  const fgColor      = s.wallet_fg_color    || '#2A1008'
  const labelColor   = s.wallet_label_color || s.custom_accent || '#B5312A'
  const header       = s.wallet_header      || s.business_name || 'Mi negocio'
  const stampsReq    = s.stamps_required    || 10
  const logoUrl      = s.wallet_logo_url    || s.logo_url      || null
  const stripUrl     = s.wallet_strip_url   || null

  // Darken for gradient
  function darken(hex: string, amt = 0.6) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!m) return hex
    return '#' + [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)]
      .map(v => Math.round(v * amt).toString(16).padStart(2,'0')).join('')
  }

  const stripDeep = darken(stripColor)

  const card: React.CSSProperties = {
    width: '100%', maxWidth: 300, borderRadius: 16,
    background: bgColor,
    boxShadow: '0 8px 40px rgba(0,0,0,0.28)',
    overflow: 'hidden', fontFamily: 'system-ui, sans-serif',
  }

  const strip: React.CSSProperties = {
    height: 100, position: 'relative', overflow: 'hidden',
    background: stripUrl ? undefined : `linear-gradient(160deg, ${stripColor} 0%, ${stripDeep} 100%)`,
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={card}>
        {/* Strip */}
        <div style={strip}>
          {stripUrl
            ? <img src={stripUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <>
                {/* Decorative circles */}
                <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
                <div style={{ position:'absolute', bottom:-20, left:-20, width:90, height:90, borderRadius:'50%', background:'rgba(0,0,0,0.08)' }} />
                {/* Business name */}
                <div style={{ position:'absolute', bottom:12, left:14 }}>
                  <p style={{ color:'rgba(240,232,216,0.92)', fontSize:20, fontWeight:700, letterSpacing:2, margin:0, textTransform:'uppercase', fontFamily:'Georgia, serif' }}>
                    {header.toUpperCase().slice(0,12)}
                  </p>
                  <p style={{ color:'rgba(240,232,216,0.5)', fontSize:8, letterSpacing:3, margin:0 }}>PROGRAMA DE FIDELIZACIÓN</p>
                </div>
                {/* Coffee cup decoration */}
                <div style={{ position:'absolute', top:10, right:12, opacity:0.45, fontSize:24 }}>☕</div>
                {/* Stamps row */}
                {cardType === 'stamps' && (
                  <div style={{ position:'absolute', top:10, left:14, display:'flex', gap:4 }}>
                    {Array.from({length: Math.min(stampsReq, 8)}).map((_,i) => (
                      <div key={i} style={{ width:14, height:14, borderRadius:4, background: i < 3 ? 'rgba(240,232,216,0.85)' : 'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 }}>
                        {i < 3 ? '☕' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          }
        </div>

        {/* Card body */}
        <div style={{ padding: '10px 14px 14px' }}>
          {/* Logo + business name */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width:28, height:28, objectFit:'contain', borderRadius:6 }} />
              : <div style={{ width:28, height:28, borderRadius:6, background: `${stripColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>☕</div>
            }
            <span style={{ color: fgColor, fontWeight:700, fontSize:13, opacity:0.7 }}>{header}</span>
          </div>

          {/* Primary metric */}
          {cardType === 'points' && (
            <div>
              <p style={{ color: labelColor, fontSize:9, fontWeight:600, letterSpacing:1, margin:'0 0 2px', textTransform:'uppercase' }}>PUNTOS</p>
              <p style={{ color: fgColor, fontSize:28, fontWeight:700, margin:0, lineHeight:1 }}>150</p>
            </div>
          )}
          {cardType === 'cashback' && (
            <div>
              <p style={{ color: labelColor, fontSize:9, fontWeight:600, letterSpacing:1, margin:'0 0 2px', textTransform:'uppercase' }}>CASHBACK</p>
              <p style={{ color: fgColor, fontSize:28, fontWeight:700, margin:0, lineHeight:1 }}>12.50€</p>
            </div>
          )}
          {cardType === 'stamps' && (
            <div>
              <p style={{ color: labelColor, fontSize:9, fontWeight:600, letterSpacing:1, margin:'0 0 6px', textTransform:'uppercase' }}>SELLOS</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {Array.from({length: Math.min(stampsReq, 10)}).map((_,i) => (
                  <div key={i} style={{ width:20, height:20, borderRadius:5, background: i < 3 ? stripColor : `${stripColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>
                    {i < 3 ? <span style={{color:'#fff'}}>☕</span> : <span style={{color:`${stripColor}88`}}>·</span>}
                  </div>
                ))}
              </div>
              <p style={{ color: fgColor, fontSize:10, margin:'6px 0 0', opacity:0.5 }}>3 / {stampsReq} cafés</p>
            </div>
          )}

          {/* Secondary fields */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginTop:12, paddingTop:10, borderTop:`1px solid ${fgColor}18` }}>
            {['CLIENTE','VISITAS','GASTADO'].map((lbl, i) => (
              <div key={lbl}>
                <p style={{ color: labelColor, fontSize:7, fontWeight:600, letterSpacing:1, margin:0, textTransform:'uppercase' }}>{lbl}</p>
                <p style={{ color: fgColor, fontSize:11, fontWeight:600, margin:'2px 0 0' }}>{i===0 ? 'Ana García' : i===1 ? '5' : '47€'}</p>
              </div>
            ))}
          </div>

          {/* QR placeholder */}
          <div style={{ marginTop:10, display:'flex', justifyContent:'center' }}>
            <div style={{ width:54, height:54, borderRadius:8, border:`2px solid ${fgColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, opacity:0.4 }}>
              ▪
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Color picker row ──────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange, presets }: { label: string; value: string; onChange: (v: string) => void; presets?: string[] }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, background:'var(--fi-glass)', border:'1px solid var(--fi-border)' }}>
      <div style={{ position:'relative', width:40, height:40, borderRadius:10, overflow:'hidden', flexShrink:0, boxShadow:'0 2px 6px rgba(0,0,0,0.18)', border:'2px solid var(--fi-border)' }}>
        <div style={{ width:'100%', height:'100%', background: value }} />
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
      </div>
      <div style={{ flex:1 }}>
        <p style={{ color:'var(--fi-text)', fontWeight:600, fontSize:13, margin:0 }}>{label}</p>
        {presets && (
          <div style={{ display:'flex', gap:5, marginTop:5 }}>
            {presets.map(c => (
              <button key={c} onClick={() => onChange(c)} style={{ width:18, height:18, borderRadius:'50%', background:c, border: value.toLowerCase()===c.toLowerCase() ? '2px solid var(--fi-text)' : '2px solid transparent', cursor:'pointer', padding:0 }} />
            ))}
          </div>
        )}
      </div>
      <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--fi-text-muted)', background:'var(--fi-glass)', padding:'3px 8px', borderRadius:6, border:'1px solid var(--fi-border)' }}>{value.toUpperCase()}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AjustesManager({ initialSettings }: { initialSettings: any }) {
  // Parse ALL visual config from the `theme` JSON column (works with existing DB schema)
  const initTheme = parseThemeConfig(initialSettings?.theme)

  const [settings, setSettings] = useState({
    ...(initialSettings || {}),
    // Expose parsed theme fields as flat state so the UI works naturally
    custom_mode:         initTheme.mode,
    custom_accent:       initTheme.accent,
    wallet_strip_color:  initTheme.wallet.strip_color,
    wallet_bg_color:     initTheme.wallet.bg_color,
    wallet_fg_color:     initTheme.wallet.fg_color,
    wallet_label_color:  initTheme.wallet.label_color,
    wallet_header:       initTheme.wallet.header,
    wallet_logo_url:     initTheme.wallet.logo_url,
    wallet_strip_url:    initTheme.wallet.strip_url,
  })
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingWalletLogo, setUploadingWalletLogo] = useState(false)
  const [uploadingStrip, setUploadingStrip] = useState(false)
  const [activeTab, setActiveTab] = useState<'empresa'|'tarjeta'|'wallet'|'tema'|'geocatch'|'facturacion'|'enlace'>('empresa')
  const [walletPreviewType, setWalletPreviewType] = useState<string>(initialSettings?.card_type || 'stamps')
  const { mode, accent, setMode, setAccent } = useThemeApp()
  const logoInputRef        = useRef<HTMLInputElement>(null)
  const walletLogoInputRef  = useRef<HTMLInputElement>(null)
  const stripInputRef       = useRef<HTMLInputElement>(null)

  function set(key: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(file: File, onUrl: (url: string) => void, setLoading: (v: boolean) => void) {
    if (file.size > 5 * 1024 * 1024) { toast.error('El archivo debe pesar menos de 5MB'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUrl(data.url)
      toast.success('Imagen subida correctamente')
    } catch (e: any) {
      toast.error('Error al subir: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Pack ALL visual/wallet config into the `theme` JSON column (already exists in DB)
      const themeConfig: ThemeConfig = {
        mode:   (settings.custom_mode as ColorMode) || 'dark',
        accent: settings.custom_accent || '#C8873A',
        wallet: {
          strip_color:  settings.wallet_strip_color  || '#B5312A',
          bg_color:     settings.wallet_bg_color     || '#F0E8D8',
          fg_color:     settings.wallet_fg_color     || '#2A1008',
          label_color:  settings.wallet_label_color  || settings.custom_accent || '#B5312A',
          header:       settings.wallet_header       || '',
          logo_url:     settings.wallet_logo_url     || null,
          strip_url:    settings.wallet_strip_url    || null,
        },
      }

      // Build payload: base fields + theme JSON
      const payload: Record<string, any> = { theme: serializeThemeConfig(themeConfig) }
      for (const key of BASE_FIELDS) {
        if (key !== 'theme' && key in settings) payload[key] = settings[key]
      }

      const res = await fetch('/api/ajustes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')

      toast.success('Ajustes guardados')

      const newAccent = themeConfig.accent
      const newMode = themeConfig.mode
      applyBrandColors(newAccent, newMode)
      setMode(newMode)
      setAccent(newAccent)
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'empresa',     label: 'Empresa',    icon: Building2 },
    { id: 'tarjeta',     label: 'Tarjeta',    icon: CreditCard },
    { id: 'wallet',      label: 'Wallet',     icon: Wallet },
    { id: 'tema',        label: 'Tema',       icon: Palette },
    { id: 'enlace',      label: 'Enlace',     icon: QrCode },
    { id: 'geocatch',    label: 'Geocatch',   icon: MapPin },
    { id: 'facturacion', label: 'Facturación',icon: Receipt },
  ]

  const currentAccent = settings.custom_accent || accent
  const currentMode: ColorMode = settings.custom_mode || mode

  // Wallet color defaults
  const wStrip  = settings.wallet_strip_color || currentAccent || '#B5312A'
  const wBg     = settings.wallet_bg_color    || '#F0E8D8'
  const wFg     = settings.wallet_fg_color    || '#2A1008'
  const wLabel  = settings.wallet_label_color || currentAccent || '#B5312A'

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div style={{ overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' as any, borderRadius:16, background:'var(--fi-glass)', border:'1px solid var(--fi-border)' }}>
        <div style={{ display:'flex', gap:4, padding:4, minWidth:'max-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                touchAction:'manipulation',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'9px 16px', borderRadius:12, fontSize:13, fontWeight:500,
                border:'none', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
                background: activeTab === tab.id ? 'var(--fi-accent)' : 'transparent',
                color: activeTab === tab.id ? 'var(--fi-accent-text)' : 'var(--fi-text-muted)',
              }}
            >
              <tab.icon style={{ width:14, height:14, flexShrink:0 }} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empresa ── */}
      {activeTab === 'empresa' && (
        <div className="glass-strong rounded-2xl p-6 space-y-5">
          <h2 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:16 }}>Información del negocio</h2>
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
              <textarea value={settings.business_description || ''} onChange={e => set('business_description', e.target.value)} placeholder="Breve descripción..." rows={3} className="fi-input resize-none" />
            </Field>
            <Field label="Logotipo" className="md:col-span-2">
              <input ref={logoInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => set('logo_url', url), setUploadingLogo) }} style={{ display:'none' }} />
              <ImageUploadBox
                url={settings.logo_url}
                onClear={() => set('logo_url', '')}
                onUpload={() => logoInputRef.current?.click()}
                loading={uploadingLogo}
                label={settings.logo_url ? 'Cambiar logo' : 'Subir logo'}
                hint="PNG, JPG o SVG. Máx. 2MB. Aparece en el panel y en la tarjeta del cliente."
              />
            </Field>
          </div>
        </div>
      )}

      {/* ── Tarjeta ── */}
      {activeTab === 'tarjeta' && (
        <div className="space-y-5">
          <div className="glass-strong rounded-2xl p-6">
            <h2 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:16, marginBottom:16 }}>Tipo de tarjeta de fidelización</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CARD_TYPES.map(ct => {
                const active = settings.card_type === ct.id
                return (
                  <button key={ct.id} onClick={() => { set('card_type', ct.id); setWalletPreviewType(ct.id) }}
                    style={{ touchAction:'manipulation', padding:16, borderRadius:16, border: active ? '2px solid var(--fi-accent)' : '1px solid var(--fi-border)', background: active ? 'var(--fi-accent-bg)' : 'var(--fi-glass)', cursor:'pointer', textAlign:'left', position:'relative', transition:'all 0.15s' }}
                  >
                    {active && <div style={{ position:'absolute', top:10, right:10, width:20, height:20, borderRadius:'50%', background:'var(--fi-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}><Check style={{ width:12, height:12, color:'var(--fi-accent-text)' }} /></div>}
                    <div style={{ fontSize:28, marginBottom:8 }}>{ct.icon}</div>
                    <p style={{ color:'var(--fi-text)', fontWeight:600, fontSize:14, marginBottom:4 }}>{ct.name}</p>
                    <p style={{ color:'var(--fi-text-muted)', fontSize:12, lineHeight:1.5 }}>{ct.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:14 }}>Configuración</h3>
            {settings.card_type === 'points' && (
              <Field label="Puntos por euro gastado">
                <input type="number" min="0.1" step="0.1" value={settings.points_per_euro ?? 1} onChange={e => set('points_per_euro', Number(e.target.value))} className="fi-input" />
                <p style={{ color:'var(--fi-text-muted)', fontSize:12, marginTop:4 }}>Ej: 2 → el cliente gana 2 puntos por cada €1 gastado</p>
              </Field>
            )}
            {settings.card_type === 'cashback' && (
              <Field label="Porcentaje de cashback (%)">
                <input type="number" min="0.1" max="100" step="0.1" value={settings.cashback_percent ?? 5} onChange={e => set('cashback_percent', Number(e.target.value))} className="fi-input" />
                <p style={{ color:'var(--fi-text-muted)', fontSize:12, marginTop:4 }}>Ej: 5% → si gasta €20, obtiene €1.00 de cashback</p>
              </Field>
            )}
            {settings.card_type === 'stamps' && (
              <>
                <Field label="Visitas para completar la tarjeta">
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

      {/* ── Wallet ── */}
      {activeTab === 'wallet' && (
        <div className="space-y-5">
          {/* Preview */}
          <div className="glass-strong rounded-2xl p-6">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <h2 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:16, margin:0 }}>Vista previa en tiempo real</h2>
                <p style={{ color:'var(--fi-text-muted)', fontSize:12, marginTop:4 }}>Así verá el cliente la tarjeta en Apple Wallet</p>
              </div>
              {/* Mini type selector */}
              <div style={{ display:'flex', gap:4 }}>
                {CARD_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setWalletPreviewType(ct.id)} title={ct.name}
                    style={{ padding:'4px 10px', borderRadius:8, border: walletPreviewType===ct.id ? '1.5px solid var(--fi-accent)' : '1.5px solid var(--fi-border)', background: walletPreviewType===ct.id ? 'var(--fi-accent-bg)' : 'transparent', color: walletPreviewType===ct.id ? 'var(--fi-accent)' : 'var(--fi-text-muted)', fontSize:11, cursor:'pointer', fontWeight:500 }}>
                    {ct.icon}
                  </button>
                ))}
              </div>
            </div>
            <WalletPreview s={settings} cardType={walletPreviewType} />
          </div>

          {/* Colores */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:14, marginBottom:4 }}>Colores de la tarjeta</h3>
            <ColorRow
              label="Color de la banda superior"
              value={wStrip}
              onChange={v => set('wallet_strip_color', v)}
              presets={['#B5312A','#E85D26','#1A1A1A','#1D4ED8','#059669','#7C3AED']}
            />
            <ColorRow
              label="Color de fondo de la tarjeta"
              value={wBg}
              onChange={v => set('wallet_bg_color', v)}
              presets={['#F0E8D8','#FFFFFF','#F9FAFB','#1A1A1A','#0F172A','#FFF7ED']}
            />
            <ColorRow
              label="Color del texto principal"
              value={wFg}
              onChange={v => set('wallet_fg_color', v)}
              presets={['#2A1008','#1A1A1A','#111827','#FFFFFF','#F9FAFB','#374151']}
            />
            <ColorRow
              label="Color de etiquetas y acento"
              value={wLabel}
              onChange={v => set('wallet_label_color', v)}
              presets={['#B5312A','#E85D26','#C8873A','#1D4ED8','#059669','#7C3AED']}
            />
          </div>

          {/* Encabezado */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:14 }}>Texto de la banda</h3>
            <Field label="Nombre en la tarjeta (máx. 12 caracteres)">
              <input
                value={settings.wallet_header || ''}
                onChange={e => set('wallet_header', e.target.value.slice(0, 12))}
                placeholder={settings.business_name || 'Mi negocio'}
                className="fi-input"
              />
              <p style={{ color:'var(--fi-text-muted)', fontSize:11, marginTop:4 }}>Aparece en la banda superior en letras grandes. Si se deja vacío, usa el nombre del negocio.</p>
            </Field>
          </div>

          {/* Imágenes */}
          <div className="glass-strong rounded-2xl p-6 space-y-5">
            <h3 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:14 }}>Imágenes</h3>

            {/* Wallet logo */}
            <Field label="Logo de la tarjeta (recomendado 90×90 px)">
              <input ref={walletLogoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => set('wallet_logo_url', url), setUploadingWalletLogo) }} style={{ display:'none' }} />
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:64, height:64, borderRadius:12, background:'var(--fi-glass)', border:'1px solid var(--fi-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', position:'relative' }}>
                  {settings.wallet_logo_url
                    ? <>
                        <img src={settings.wallet_logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:6 }} />
                        <button onClick={() => set('wallet_logo_url', '')} style={{ touchAction:'manipulation', position:'absolute', top:3, right:3, width:16, height:16, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X style={{ width:9, height:9, color:'#fff' }} /></button>
                      </>
                    : <Upload style={{ width:22, height:22, color:'var(--fi-text-muted)' }} />
                  }
                </div>
                <div>
                  <button onClick={() => walletLogoInputRef.current?.click()} disabled={uploadingWalletLogo}
                    style={{ touchAction:'manipulation', padding:'8px 14px', borderRadius:10, border:'1px solid var(--fi-accent-border)', background:'var(--fi-accent-bg)', color:'var(--fi-accent)', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: uploadingWalletLogo ? 0.6 : 1 }}>
                    <Upload style={{ width:13, height:13 }} />
                    {uploadingWalletLogo ? 'Subiendo...' : settings.wallet_logo_url ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  <p style={{ color:'var(--fi-text-muted)', fontSize:11, marginTop:5 }}>PNG, JPG, SVG o WEBP. Máx. 5MB.<br />Si se deja vacío, se usa el logotipo del negocio.</p>
                </div>
              </div>
            </Field>

            {/* Strip / banner */}
            <Field label="Banda personalizada (recomendado 1125×432 px)">
              <input ref={stripInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => set('wallet_strip_url', url), setUploadingStrip) }} style={{ display:'none' }} />
              {settings.wallet_strip_url && (
                <div style={{ marginBottom:10, borderRadius:12, overflow:'hidden', position:'relative', height:70 }}>
                  <img src={settings.wallet_strip_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button onClick={() => set('wallet_strip_url', '')} style={{ touchAction:'manipulation', position:'absolute', top:6, right:6, padding:'3px 8px', borderRadius:8, background:'rgba(0,0,0,0.6)', border:'none', cursor:'pointer', color:'#fff', fontSize:11, display:'flex', alignItems:'center', gap:4 }}><X style={{ width:10, height:10 }} /> Quitar</button>
                </div>
              )}
              <button onClick={() => stripInputRef.current?.click()} disabled={uploadingStrip}
                style={{ touchAction:'manipulation', padding:'8px 14px', borderRadius:10, border:'1px solid var(--fi-accent-border)', background:'var(--fi-accent-bg)', color:'var(--fi-accent)', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: uploadingStrip ? 0.6 : 1 }}>
                <Upload style={{ width:13, height:13 }} />
                {uploadingStrip ? 'Subiendo...' : settings.wallet_strip_url ? 'Cambiar banda' : 'Subir banda personalizada'}
              </button>
              <p style={{ color:'var(--fi-text-muted)', fontSize:11, marginTop:5 }}>HEIC, WEBP, SVG, PNG o JPG. Máx. 5MB.<br />Si se sube una imagen, reemplaza el diseño generado automáticamente con los sellos.</p>
            </Field>

            {settings.wallet_strip_url && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)' }}>
                <p style={{ color:'#D97706', fontSize:12, margin:0 }}>⚠️ Con banda personalizada, los sellos no aparecerán en el diseño de la tarjeta. Usa el color de banda para el diseño automático con sellos.</p>
              </div>
            )}
          </div>

          {/* 3 diseños rápidos */}
          <div className="glass-strong rounded-2xl p-6">
            <h3 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:14, marginBottom:12 }}>Estilos predefinidos</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { name:'Clásico', strip:'#B5312A', bg:'#F0E8D8', fg:'#2A1008', label:'#B5312A' },
                { name:'Oscuro',  strip:'#1A1A1A', bg:'#121212', fg:'#F5F0EB', label:'#C8873A' },
                { name:'Ocean',   strip:'#1D4ED8', bg:'#EFF6FF', fg:'#1E3A5F', label:'#1D4ED8' },
                { name:'Verde',   strip:'#059669', bg:'#F0FDF4', fg:'#064E3B', label:'#059669' },
                { name:'Violeta', strip:'#7C3AED', bg:'#F5F3FF', fg:'#2E1065', label:'#7C3AED' },
                { name:'Dorado',  strip:'#92400E', bg:'#FFFBEB', fg:'#451A03', label:'#D97706' },
              ].map(preset => (
                <button key={preset.name}
                  onClick={() => {
                    set('wallet_strip_color', preset.strip)
                    set('wallet_bg_color', preset.bg)
                    set('wallet_fg_color', preset.fg)
                    set('wallet_label_color', preset.label)
                  }}
                  style={{ touchAction:'manipulation', padding:0, border:'1.5px solid var(--fi-border)', borderRadius:12, overflow:'hidden', cursor:'pointer', background:'none' }}>
                  <div style={{ height:24, background:`linear-gradient(90deg,${preset.strip},${preset.bg})` }} />
                  <div style={{ background:'var(--fi-glass)', padding:'5px 0', textAlign:'center' }}>
                    <span style={{ color:'var(--fi-text)', fontSize:11, fontWeight:500 }}>{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tema ── */}
      {activeTab === 'tema' && (
        <div className="space-y-6">
          <div className="glass-strong rounded-2xl p-6">
            <h2 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:16, marginBottom:4 }}>Modo visual</h2>
            <p style={{ color:'var(--fi-text-muted)', fontSize:13, marginBottom:20 }}>Base de colores de toda la aplicación</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {([['dark','Oscuro','Fondo negro, glass morphism',Moon],['light','Claro','Fondo blanco, limpio',Sun]] as const).map(([id, label, desc, Icon]) => (
                <button key={id} onClick={() => { set('custom_mode', id); applyBrandColors(currentAccent, id) }}
                  style={{ touchAction:'manipulation', padding:0, border: currentMode===id ? '2px solid var(--fi-accent)' : '2px solid var(--fi-border)', borderRadius:20, overflow:'hidden', cursor:'pointer', textAlign:'left', background:'none', position:'relative' }}>
                  <div style={{ height:100, background: id==='dark' ? '#0D0B09' : '#F4F4F7', display:'flex', gap:6, padding:10, position:'relative' }}>
                    <div style={{ width:32, background: id==='dark' ? '#0A0907' : '#FFFFFF', borderRadius:8, boxShadow: id==='light' ? '0 1px 4px rgba(0,0,0,0.08)' : undefined, display:'flex', flexDirection:'column', gap:5, padding:'6px 0', alignItems:'center' }}>
                      {[...Array(4)].map((_,i) => <div key={i} style={{ width:16, height:3, borderRadius:3, background: i===0 ? currentAccent : id==='dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />)}
                    </div>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                      <div style={{ height:6, width:'55%', borderRadius:3, background: id==='dark' ? '#F5F0EB' : '#1A1A1A', opacity:0.6 }} />
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                        {[...Array(4)].map((_,i) => (
                          <div key={i} style={{ height:26, borderRadius:6, background: id==='dark' ? 'rgba(255,255,255,0.05)' : '#FFFFFF', border: `1px solid ${id==='dark' ? 'rgba(255,255,255,0.07)' : '#E5E7EB'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <div style={{ width:10, height:3, borderRadius:2, background: i===0 ? currentAccent : id==='dark' ? '#F5F0EB' : '#1A1A1A', opacity: i===0 ? 1 : 0.22 }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {currentMode===id && <div style={{ position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', background:currentAccent, display:'flex', alignItems:'center', justifyContent:'center' }}><Check style={{ width:11, height:11, color:'#fff' }} /></div>}
                  </div>
                  <div style={{ padding:'10px 14px', background:'var(--fi-glass)', display:'flex', alignItems:'center', gap:8 }}>
                    <Icon style={{ width:14, height:14, color:'var(--fi-text-muted)' }} />
                    <div>
                      <p style={{ color:'var(--fi-text)', fontWeight:600, fontSize:13 }}>{label}</p>
                      <p style={{ color:'var(--fi-text-muted)', fontSize:11 }}>{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6">
            <h2 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:16, marginBottom:4 }}>Color de marca</h2>
            <p style={{ color:'var(--fi-text-muted)', fontSize:13, marginBottom:20 }}>Se aplica a toda la app: botones, tarjetas, enlaces y dashboard</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
              {PRESET_COLORS.map(({ color, name }) => {
                const active = currentAccent.toLowerCase() === color.toLowerCase()
                return (
                  <button key={color} title={name} onClick={() => { set('custom_accent', color); applyBrandColors(color, currentMode) }}
                    style={{ touchAction:'manipulation', width:42, height:42, borderRadius:'50%', background:color, border: active ? '3px solid var(--fi-text)' : '3px solid transparent', outline: active ? '2px solid var(--fi-text)' : '2px solid transparent', outlineOffset:2, cursor:'pointer', transition:'all 0.15s', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {active && <Check style={{ width:16, height:16, color:'#fff' }} />}
                  </button>
                )
              })}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:14, background:'var(--fi-glass)', border:'1px solid var(--fi-border)' }}>
              <div style={{ position:'relative', width:48, height:48, borderRadius:12, overflow:'hidden', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.2)', border:'2px solid var(--fi-border)' }}>
                <div style={{ width:'100%', height:'100%', background:currentAccent }} />
                <input type="color" value={currentAccent} onChange={e => { set('custom_accent', e.target.value); applyBrandColors(e.target.value, currentMode) }} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ color:'var(--fi-text)', fontWeight:600, fontSize:14, marginBottom:2 }}>Color personalizado</p>
                <p style={{ color:'var(--fi-text-muted)', fontSize:12 }}>Pulsa el cuadro para elegir cualquier color</p>
              </div>
              <span style={{ fontFamily:'monospace', fontSize:13, color:'var(--fi-text-muted)', background:'var(--fi-glass)', padding:'4px 10px', borderRadius:8, border:'1px solid var(--fi-border)' }}>{currentAccent.toUpperCase()}</span>
            </div>
            <div style={{ marginTop:20, padding:16, borderRadius:14, background:'var(--fi-accent-bg)', border:'1px solid var(--fi-accent-border)' }}>
              <p style={{ color:'var(--fi-text-muted)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Vista previa</p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ background:currentAccent, color:'#fff', padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:600 }}>Guardar</div>
                <div style={{ border:`1px solid ${currentAccent}`, color:currentAccent, padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:500 }}>Ver tarjeta</div>
                <div style={{ fontSize:22, fontWeight:700, color:currentAccent }}>250 pts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Geocatch ── */}
      {activeTab === 'geocatch' && (
        <div className="glass-strong rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:16 }}>Geocatch — Notificaciones de proximidad</h2>
              <p style={{ color:'var(--fi-text-muted)', fontSize:13, marginTop:4 }}>Cuando un cliente esté cerca, recibirá una notificación automática.</p>
            </div>
            <button onClick={() => set('geo_enabled', !settings.geo_enabled)}
              style={{ touchAction:'manipulation', width:48, height:28, borderRadius:14, background: settings.geo_enabled ? 'var(--fi-accent)' : 'var(--fi-border)', border:'none', cursor:'pointer', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:4, transition:'left 0.2s', left: settings.geo_enabled ? 24 : 4 }} />
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
              <button onClick={() => { if (!navigator.geolocation) { toast.error('Geolocalización no disponible'); return }; navigator.geolocation.getCurrentPosition(pos => { set('geo_lat', pos.coords.latitude); set('geo_lng', pos.coords.longitude); toast.success('Ubicación detectada') }) }}
                style={{ touchAction:'manipulation', padding:'8px 16px', borderRadius:10, border:'1px solid var(--fi-accent-border)', background:'var(--fi-accent-bg)', color:'var(--fi-accent)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                <MapPin style={{ width:14, height:14, display:'inline', marginRight:6 }} />Usar mi ubicación actual
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
          <h2 style={{ color:'var(--fi-text)', fontWeight:600, fontSize:16 }}>Datos de facturación</h2>
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
          <div className="rounded-xl p-4" style={{ background:'var(--fi-accent-bg)', border:'1px solid var(--fi-accent-border)' }}>
            <p style={{ color:'var(--fi-accent)', fontSize:13, fontWeight:500 }}>Plan Fidelapp Pro — €29/mes</p>
            <p style={{ color:'var(--fi-text-muted)', fontSize:12, marginTop:2 }}>Próxima factura: próximamente</p>
          </div>
        </div>
      )}

      {/* ── Enlace y QR ── */}
      {activeTab === 'enlace' && (
        <EnlaceTab ownerId={settings.id || ''} businessName={settings.business_name || 'Mi negocio'} />
      )}

      {/* Guardar — solo visible en tabs que lo necesitan */}
      {activeTab !== 'enlace' && (
        <button onClick={handleSave} disabled={saving}
          style={{ touchAction:'manipulation', width:'100%', height:48, borderRadius:14, background:'var(--fi-accent)', border:'none', color:'var(--fi-accent-text)', fontWeight:600, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: saving ? 0.7 : 1 }}>
          <Save style={{ width:18, height:18 }} />
          {saving ? 'Guardando...' : 'Guardar ajustes'}
        </button>
      )}

      <style>{`
        .fi-input { width:100%; background:var(--fi-glass); border:1px solid var(--fi-border); border-radius:12px; padding:10px 14px; font-size:14px; color:var(--fi-text); outline:none; transition:border-color 0.15s; font-family:inherit; }
        .fi-input:focus { border-color:var(--fi-accent); }
        .fi-input::placeholder { color:var(--fi-text-muted); }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  )
}

// ── EnlaceTab ─────────────────────────────────────────────────────────────────
function EnlaceTab({ ownerId, businessName }: { ownerId: string; businessName: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (ownerId) setUrl(`${window.location.origin}/registro?b=${ownerId}`)
  }, [ownerId])

  function copyUrl() {
    if (!url) return
    navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado'))
  }

  async function downloadQR() {
    if (!url) return
    try {
      const dataUrl = await QRCodeLib.toDataURL(url, { width: 600, margin: 2, color: { dark: '#0D0B09', light: '#FFFFFF' } })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `qr-registro-${businessName.toLowerCase().replace(/\s+/g, '-')}.png`
      a.click()
    } catch {
      toast.error('Error al generar el QR')
    }
  }

  if (!ownerId) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 14 }}>Guarda primero los ajustes para generar tu enlace.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="glass-strong rounded-2xl p-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
          </div>
          <div>
            <h2 style={{ color: 'var(--fi-text)', fontWeight: 700, fontSize: 16, margin: 0 }}>Tu enlace de registro</h2>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, margin: 0 }}>Compártelo o pon el QR en tu local</p>
          </div>
        </div>

        {/* URL box */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginTop: 16 }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', fontFamily: 'monospace', fontSize: 13, color: 'var(--fi-text)', wordBreak: 'break-all', lineHeight: 1.5 }}>
            {url || '…'}
          </div>
          <button onClick={copyUrl} title="Copiar enlace"
            style={{ touchAction: 'manipulation', padding: '0 16px', borderRadius: 12, background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', color: 'var(--fi-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 13, flexShrink: 0 }}>
            <Copy style={{ width: 14, height: 14 }} />
            Copiar
          </button>
        </div>

        <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: 10 }}>
          Cuando alguien abra este enlace, verá el formulario de registro vinculado exclusivamente a <strong style={{ color: 'var(--fi-text)' }}>{businessName}</strong>.
        </p>
      </div>

      {/* QR */}
      <div className="glass-strong rounded-2xl p-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 15, margin: 0 }}>Código QR descargable</h3>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: 4 }}>Imprime este QR y ponlo en la barra, en mesas o en el escaparate</p>
          </div>
          <button onClick={downloadQR}
            style={{ touchAction: 'manipulation', padding: '9px 16px', borderRadius: 12, background: 'var(--fi-accent)', border: 'none', color: 'var(--fi-accent-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
            <Download style={{ width: 14, height: 14 }} />
            Descargar PNG
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {url && <QRCode value={url} size={200} fgColor="#0D0B09" bgColor="#ffffff" />}
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0, textAlign: 'center', maxWidth: 200 }}>
              Escanea para unirte a{' '}
              <strong style={{ color: '#111827' }}>{businessName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Cómo usarlo</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { n: '1', t: 'Descarga el QR', d: 'Pulsa "Descargar PNG" y guarda la imagen en alta resolución.' },
            { n: '2', t: 'Imprímelo', d: 'Ponlo en la barra, mesas o escaparate del local. Vale un A5 plastificado.' },
            { n: '3', t: 'El cliente escanea', d: 'Con la cámara del móvil escanea el QR y llega directamente a tu formulario.' },
            { n: '4', t: 'Se registra', d: 'Rellena nombre, email y teléfono. Queda vinculado a tu negocio automáticamente.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'var(--fi-accent)', fontWeight: 700, fontSize: 13 }}>{step.n}</span>
              </div>
              <div>
                <p style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 13, margin: 0 }}>{step.t}</p>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, margin: '2px 0 0' }}>{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label style={{ display:'block', color:'var(--fi-text-muted)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</label>
      {children}
    </div>
  )
}

function ImageUploadBox({ url, onClear, onUpload, loading, label, hint }: { url?: string; onClear: () => void; onUpload: () => void; loading: boolean; label: string; hint?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:80, height:80, borderRadius:16, background:'var(--fi-glass)', border:'1px solid var(--fi-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', position:'relative' }}>
        {url ? (
          <>
            <img src={url} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain', padding:8 }} onError={(e: any) => e.target.style.display='none'} />
            <button onClick={onClear} style={{ touchAction:'manipulation', position:'absolute', top:4, right:4, width:18, height:18, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X style={{ width:10, height:10, color:'#fff' }} />
            </button>
          </>
        ) : (
          <Upload style={{ width:24, height:24, color:'var(--fi-text-muted)' }} />
        )}
      </div>
      <div style={{ flex:1 }}>
        <button onClick={onUpload} disabled={loading} style={{ touchAction:'manipulation', padding:'10px 18px', borderRadius:12, border:'1px solid var(--fi-accent-border)', background:'var(--fi-accent-bg)', color:'var(--fi-accent)', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:8, opacity: loading ? 0.6 : 1 }}>
          <Upload style={{ width:14, height:14 }} />
          {loading ? 'Subiendo...' : label}
        </button>
        {hint && <p style={{ color:'var(--fi-text-muted)', fontSize:11, marginTop:6 }}>{hint}</p>}
      </div>
    </div>
  )
}
