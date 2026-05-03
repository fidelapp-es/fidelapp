'use client'
import { useState, useRef } from 'react'
import { parseThemeConfig, serializeThemeConfig } from '@/lib/themeConfig'

const SWATCHES = [
  '#005840', '#D1F843', '#FF6B5B', '#3B82F6', '#8B5CF6',
  '#F59E0B', '#EF4444', '#10B981', '#C8873A', '#1A1A1A',
]

interface Props {
  data: Record<string, any>
  onNext: (d: Record<string, any>) => void
  onBack: () => void
  saving: boolean
}

export default function Step3Branding({ data, onNext, onBack, saving }: Props) {
  const cfg = parseThemeConfig(data.theme)
  const [logoUrl, setLogoUrl] = useState<string>(data.logo_url || '')
  const [primaryColor, setPrimaryColor] = useState(cfg.accent || '#005840')
  const [secondaryColor, setSecondaryColor] = useState(data.secondary_color || '#D1F843')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) setLogoUrl(json.url)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) uploadFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const theme = serializeThemeConfig({ ...cfg, accent: primaryColor })
    onNext({ logo_url: logoUrl, secondary_color: secondaryColor, theme })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={h2}>Identidad visual</h2>
      <p style={subtitle}>Personaliza cómo aparecerá tu negocio en las tarjetas de fidelización.</p>

      {/* Subida de logo */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Logotipo</label>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? '#005840' : '#dde5e3'}`,
            borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer',
            background: dragging ? '#f0f8f5' : '#fafafa', transition: 'all 0.2s',
          }}
        >
          {logoUrl ? (
            <div>
              <img src={logoUrl} alt="Logo" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: '#005840', margin: 0 }}>Haz clic para cambiar</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{uploading ? '⏳' : '📷'}</div>
              <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
                {uploading ? 'Subiendo...' : 'Arrastra tu logo aquí o haz clic'}
              </p>
              <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>PNG, JPG, SVG — máx 2MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Color principal */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Color principal</label>
        <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
      </div>

      {/* Color secundario */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Color secundario</label>
        <ColorPicker value={secondaryColor} onChange={setSecondaryColor} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={onBack} style={btnSecondary}>← Volver</button>
        <button type="submit" style={btnPrimary} disabled={saving || uploading}>
          {saving ? 'Guardando...' : 'Continuar →'}
        </button>
      </div>
    </form>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {SWATCHES.map(c => (
          <div
            key={c}
            onClick={() => onChange(c)}
            style={{
              width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
              border: value === c ? '3px solid #005840' : '2px solid transparent',
              outline: value === c ? '2px solid white' : 'none',
              transition: 'transform 0.15s',
              transform: value === c ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 42, height: 42, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }}
        />
        <input
          type="text" value={value}
          onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ ...textInput, width: 110 }}
          placeholder="#005840"
        />
        <div style={{ width: 42, height: 42, borderRadius: 8, background: value, border: '1.5px solid #dde5e3' }} />
      </div>
    </div>
  )
}

const h2: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }
const subtitle: React.CSSProperties = { color: '#666', fontSize: 15, margin: '0 0 28px' }
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#005840',
  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
}
const textInput: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, border: '1.5px solid #dde5e3',
  fontSize: 15, background: '#fff', fontFamily: 'inherit', color: '#1a1a2e', outline: 'none',
}
const btnPrimary: React.CSSProperties = {
  flex: 1, padding: '14px', borderRadius: 12,
  background: '#D1F843', color: '#005840', fontWeight: 700, fontSize: 16,
  border: 'none', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '14px 20px', borderRadius: 12,
  background: 'transparent', color: '#005840', fontWeight: 600, fontSize: 15,
  border: '1.5px solid #005840', cursor: 'pointer',
}
