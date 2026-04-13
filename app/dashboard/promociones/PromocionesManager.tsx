'use client'

import { useState } from 'react'
import { Promotion } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Tag, Star, X } from 'lucide-react'

const emptyForm = { title: '', description: '', points_required: '', discount_type: 'fixed', discount_value: '', active: true }

export default function PromocionesManager({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [promotions, setPromotions] = useState(initialPromotions)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(field: string, value: string | boolean | null) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function openNew() { setForm(emptyForm); setEditing(null); setOpen(true) }
  function openEdit(promo: Promotion) {
    setForm({ title: promo.title, description: promo.description, points_required: String(promo.points_required), discount_type: promo.discount_type, discount_value: String(promo.discount_value), active: promo.active })
    setEditing(promo.id); setOpen(true)
  }

  async function handleSave() {
    if (!form.title || !form.points_required || !form.discount_value) { toast.error('Rellena todos los campos'); return }
    setLoading(true)
    try {
      const payload = { title: form.title, description: form.description, points_required: Number(form.points_required), discount_type: form.discount_type, discount_value: Number(form.discount_value), active: form.active }
      if (editing) {
        const res = await fetch(`/api/promociones/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const updated = await res.json()
        setPromotions(prev => prev.map(p => p.id === editing ? updated : p))
        toast.success('Promoción actualizada')
      } else {
        const res = await fetch('/api/promociones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const created = await res.json()
        setPromotions(prev => [created, ...prev])
        toast.success('Promoción creada')
      }
      setOpen(false)
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta promoción?')) return
    await fetch(`/api/promociones/${id}`, { method: 'DELETE' })
    setPromotions(prev => prev.filter(p => p.id !== id))
    toast.success('Eliminada')
  }

  async function toggleActive(promo: Promotion) {
    const res = await fetch(`/api/promociones/${promo.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !promo.active }) })
    const updated = await res.json()
    setPromotions(prev => prev.map(p => p.id === promo.id ? updated : p))
  }

  const inputStyle = { width: '100%', background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: 'var(--fi-text)', outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          onClick={openNew}
          style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--fi-accent)', color: 'var(--fi-bg)', fontWeight: 600, borderRadius: 12, padding: '10px 18px', fontSize: 14, border: 'none', cursor: 'pointer' }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Nueva promoción
        </button>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 448, background: 'var(--fi-bg)', border: '1px solid var(--fi-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>{editing ? 'Editar promoción' : 'Nueva promoción'}</h2>
              <button onClick={() => setOpen(false)} style={{ touchAction: 'manipulation', color: 'var(--fi-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Título</label>
              <input value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Café gratis" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Descripción</label>
              <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Descripción..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Puntos requeridos</label>
              <input type="number" value={form.points_required} onChange={e => handleChange('points_required', e.target.value)} placeholder="50" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tipo</label>
                <select value={form.discount_type} onChange={e => handleChange('discount_type', e.target.value)} style={{ ...inputStyle }}>
                  <option value="fixed">Importe fijo (€)</option>
                  <option value="percentage">Porcentaje (%)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Valor</label>
                <input type="number" value={form.discount_value} onChange={e => handleChange('discount_value', e.target.value)} placeholder="2.50" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="active-promo" checked={form.active as boolean} onChange={e => handleChange('active', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--fi-accent)' }} />
              <label htmlFor="active-promo" style={{ color: 'var(--fi-text-muted)', fontSize: 14 }}>Activa</label>
            </div>
            <button onClick={handleSave} disabled={loading} style={{ touchAction: 'manipulation', width: '100%', background: 'var(--fi-accent)', color: 'var(--fi-bg)', fontWeight: 600, borderRadius: 12, height: 44, fontSize: 14, border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {promotions.map(promo => (
          <div key={promo.id} className="glass" style={{ borderRadius: 16, padding: 20, border: promo.active ? '1px solid var(--fi-accent-border)' : '1px solid var(--fi-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
                <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 14 }}>{promo.title}</h3>
              </div>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 500, background: promo.active ? 'rgba(16,185,129,0.1)' : 'var(--fi-glass)', color: promo.active ? '#10B981' : 'var(--fi-text-muted)', border: promo.active ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--fi-border)' }}>
                {promo.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginBottom: 16 }}>{promo.description}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className="glass-amber" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--fi-accent)', fontSize: 12, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--fi-accent-border)', fontWeight: 500 }}>
                <Star style={{ width: 12, height: 12, fill: 'var(--fi-accent)' }} />{promo.points_required} pts
              </span>
              <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)', fontWeight: 500 }}>
                {promo.discount_type === 'fixed' ? `${promo.discount_value}€` : `${promo.discount_value}%`} dto.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(promo)} style={{ touchAction: 'manipulation', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: '1px solid var(--fi-border)', background: 'transparent', color: 'var(--fi-text-muted)', borderRadius: 10, padding: '6px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                <Pencil style={{ width: 12, height: 12 }} /> Editar
              </button>
              <button onClick={() => toggleActive(promo)} style={{ touchAction: 'manipulation', flex: 1, border: '1px solid var(--fi-border)', background: 'transparent', color: 'var(--fi-text-muted)', borderRadius: 10, padding: '6px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {promo.active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => handleDelete(promo.id)} style={{ touchAction: 'manipulation', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: 'rgba(239,68,68,0.6)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}>
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, textAlign: 'center', padding: '48px 0', gridColumn: '1 / -1' }}>No hay promociones. Crea la primera.</p>
        )}
      </div>
    </div>
  )
}
