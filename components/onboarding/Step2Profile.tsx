'use client'
import { useState } from 'react'

const ROLES = [
  'Propietario/a', 'Gerente', 'Director/a de marketing',
  'Responsable de operaciones', 'Otro',
]

interface Props {
  data: Record<string, any>
  onNext: (d: Record<string, any>) => void
  onBack: () => void
  saving: boolean
}

export default function Step2Profile({ data, onNext, onBack, saving }: Props) {
  const [form, setForm] = useState({
    contact_name:  data.contact_name  || '',
    contact_role:  data.contact_role  || '',
    contact_phone: data.contact_phone || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.contact_name.trim()) e.contact_name = 'El nombre es obligatorio'
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
      <h2 style={h2}>Tu perfil</h2>
      <p style={subtitle}>¿Quién gestiona este programa de fidelización?</p>

      <Field label="Nombre completo *" error={errors.contact_name}>
        <input style={inputStyle} value={form.contact_name} onChange={set('contact_name')} placeholder="Ana García" />
      </Field>

      <Field label="Cargo en el negocio">
        <select style={inputStyle} value={form.contact_role} onChange={set('contact_role')}>
          <option value="">Selecciona tu cargo</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>

      <Field label="Teléfono de contacto">
        <input style={inputStyle} value={form.contact_phone} onChange={set('contact_phone')} placeholder="+34 600 000 000" />
      </Field>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button type="button" onClick={onBack} style={btnSecondary}>← Volver</button>
        <button type="submit" style={btnPrimary} disabled={saving}>
          {saving ? 'Guardando...' : 'Continuar →'}
        </button>
      </div>
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
  flex: 1, padding: '14px', borderRadius: 12,
  background: '#D1F843', color: '#005840', fontWeight: 700, fontSize: 16,
  border: 'none', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '14px 20px', borderRadius: 12,
  background: 'transparent', color: '#005840', fontWeight: 600, fontSize: 15,
  border: '1.5px solid #005840', cursor: 'pointer',
}
