'use client'
import { useState } from 'react'

const CATEGORIES = [
  'Hostelería', 'Retail', 'Belleza y estética', 'Salud y bienestar',
  'Deporte', 'Alimentación', 'Otro',
]

interface Props {
  data: Record<string, any>
  onNext: (d: Record<string, any>) => void
  saving: boolean
}

export default function Step1Business({ data, onNext, saving }: Props) {
  const [form, setForm] = useState({
    business_name:        data.business_name        || '',
    business_category:    data.business_category    || '',
    business_address:     data.business_address     || '',
    business_city:        data.business_city        || '',
    business_postal_code: data.business_postal_code || '',
    business_phone:       data.business_phone       || '',
    business_website:     data.business_website     || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.business_name.trim()) e.business_name = 'El nombre es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onNext(form)
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={h2}>Cuéntanos sobre tu negocio</h2>
      <p style={subtitle}>Esta información aparecerá en tu tarjeta de fidelización.</p>

      <Field label="Nombre del negocio *" error={errors.business_name}>
        <input style={inputStyle} value={form.business_name} onChange={set('business_name')} placeholder="Ej: Cafetería Plasér" />
      </Field>

      <Field label="Categoría">
        <select style={inputStyle} value={form.business_category} onChange={set('business_category')}>
          <option value="">Selecciona una categoría</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Dirección">
        <input style={inputStyle} value={form.business_address} onChange={set('business_address')} placeholder="Calle, número, piso..." />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Ciudad">
          <input style={inputStyle} value={form.business_city} onChange={set('business_city')} placeholder="Madrid" />
        </Field>
        <Field label="Código postal">
          <input style={inputStyle} value={form.business_postal_code} onChange={set('business_postal_code')} placeholder="28001" />
        </Field>
      </div>

      <Field label="Teléfono">
        <input style={inputStyle} value={form.business_phone} onChange={set('business_phone')} placeholder="+34 600 000 000" />
      </Field>

      <Field label="Web (opcional)">
        <input style={inputStyle} value={form.business_website} onChange={set('business_website')} placeholder="https://tutienda.com" />
      </Field>

      <button type="submit" style={btnPrimary} disabled={saving}>
        {saving ? 'Guardando...' : 'Continuar →'}
      </button>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#005840', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const h2: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }
const subtitle: React.CSSProperties = { color: '#666', fontSize: 15, margin: '0 0 28px' }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
  border: '1.5px solid #dde5e3', fontSize: 15, background: '#fff', outline: 'none',
  fontFamily: 'inherit', color: '#1a1a2e',
}
const btnPrimary: React.CSSProperties = {
  marginTop: 24, width: '100%', padding: '14px', borderRadius: 12,
  background: '#D1F843', color: '#005840', fontWeight: 700, fontSize: 16,
  border: 'none', cursor: 'pointer',
}
