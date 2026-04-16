'use client'

import { useState } from 'react'
import { Customer } from '@/lib/types'
import { Search, Star, ExternalLink, Pencil, Trash2, X, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ClientesTable({ customers: initial }: { customers: Customer[] }) {
  const [customers, setCustomers] = useState(initial)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Customer>>({})

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  function getLevel(points: number) {
    if (points >= 200) return { label: 'VIP', color: '#FBBF24' }
    if (points >= 100) return { label: 'Oro', color: '#F59E0B' }
    if (points >= 50) return { label: 'Plata', color: '#94A3B8' }
    return { label: 'Nuevo', color: '#60A5FA' }
  }

  function openEdit(c: Customer) {
    setForm({ name: c.name, email: c.email, phone: c.phone, points: c.points, total_spent: c.total_spent })
    setEditing(c)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/clientes/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomers(prev => prev.map(c => c.id === editing.id ? { ...c, ...data } : c))
      setEditing(null)
      toast.success('Cliente actualizado')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setSaving(true)
    try {
      const res = await fetch(`/api/clientes/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setCustomers(prev => prev.filter(c => c.id !== deleting.id))
      setDeleting(null)
      toast.success('Cliente eliminado')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {/* Búsqueda */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--fi-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--fi-text-muted)' }} />
            <input
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 12, fontSize: 14, color: 'var(--fi-text)', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Vista móvil */}
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--fi-text-muted)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>No se encontraron clientes</p>
          ) : filtered.map((customer, i) => {
            const level = getLevel(customer.points)
            return (
              <div key={customer.id} style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: i < filtered.length - 1 ? '1px solid var(--fi-border)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ color: 'var(--fi-text)', fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.name}</p>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: level.color, background: `${level.color}18`, border: `1px solid ${level.color}30`, flexShrink: 0 }}>{level.label}</span>
                  </div>
                  <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{customer.email}</p>
                  <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{customer.phone}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <Star style={{ width: 14, height: 14, color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                      <span style={{ color: 'var(--fi-accent)', fontWeight: 700, fontSize: 14 }}>{customer.points}</span>
                    </div>
                    <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{Number(customer.total_spent).toFixed(2)}€</p>
                  </div>
                  <button onClick={() => openEdit(customer)} style={{ touchAction: 'manipulation', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', color: 'var(--fi-accent)', cursor: 'pointer' }}>
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                  <Link href={`/cliente/${customer.id}`} target="_blank" style={{ touchAction: 'manipulation', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', color: 'var(--fi-text-muted)' }}>
                    <ExternalLink style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Vista desktop */}
        <div className="hidden md:block" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--fi-border)' }}>
                {['Cliente', 'Teléfono', 'Puntos', 'Gasto total', 'Nivel', 'Registro', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--fi-text-muted)', padding: '48px 0' }}>No se encontraron clientes</td></tr>
              ) : filtered.map(customer => {
                const level = getLevel(customer.points)
                return (
                  <tr key={customer.id} style={{ borderBottom: '1px solid var(--fi-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ color: 'var(--fi-text)', fontWeight: 500 }}>{customer.name}</p>
                      <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{customer.email}</p>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--fi-text-muted)' }}>{customer.phone}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--fi-accent)', fontWeight: 700 }}>
                        <Star style={{ width: 14, height: 14, fill: 'var(--fi-accent)' }} />{customer.points}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--fi-text-muted)' }}>{Number(customer.total_spent).toFixed(2)}€</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: level.color, background: `${level.color}18`, border: `1px solid ${level.color}30` }}>{level.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--fi-text-muted)', fontSize: 12 }}>
                      {new Date(customer.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => openEdit(customer)} style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', color: 'var(--fi-accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                          <Pencil style={{ width: 12, height: 12 }} /> Editar
                        </button>
                        <Link href={`/cliente/${customer.id}`} target="_blank" style={{ color: 'var(--fi-text-muted)', display: 'flex' }}>
                          <ExternalLink style={{ width: 14, height: 14 }} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal editar */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setEditing(null) }}>
          <div className="glass-strong" style={{ borderRadius: 24, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: 'var(--fi-text)', fontWeight: 700, fontSize: 18, margin: 0 }}>Editar cliente</h2>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, marginTop: 2 }}>{editing.name}</p>
              </div>
              <button onClick={() => setEditing(null)} style={{ touchAction: 'manipulation', width: 36, height: 36, borderRadius: '50%', background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fi-text-muted)' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ModalField label="Nombre completo">
                <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
              </ModalField>
              <ModalField label="Email">
                <input type="email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
              </ModalField>
              <ModalField label="Teléfono">
                <input value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
              </ModalField>

              <div style={{ height: 1, background: 'var(--fi-border)', margin: '4px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ModalField label="Puntos">
                  <input type="number" min="0" value={form.points ?? 0} onChange={e => setForm(p => ({ ...p, points: Number(e.target.value) }))} style={inputStyle} />
                </ModalField>
                <ModalField label="Total gastado (€)">
                  <input type="number" min="0" step="0.01" value={form.total_spent ?? 0} onChange={e => setForm(p => ({ ...p, total_spent: Number(e.target.value) }))} style={inputStyle} />
                </ModalField>
              </div>

              <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginTop: -8 }}>
                Puedes ajustar los puntos manualmente si necesitas corregir algún error.
              </p>

              <div style={{ height: 1, background: 'var(--fi-border)', margin: '4px 0' }} />

              {/* Zona peligrosa */}
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Zona de peligro</p>
                <button
                  onClick={() => { setEditing(null); setDeleting(editing) }}
                  style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} /> Eliminar cliente
                </button>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button onClick={() => setEditing(null)} style={{ touchAction: 'manipulation', flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--fi-border)', background: 'transparent', color: 'var(--fi-text-muted)', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} style={{ touchAction: 'manipulation', flex: 2, height: 44, borderRadius: 12, background: 'var(--fi-accent)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                  <Save style={{ width: 16, height: 16 }} />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="glass-strong" style={{ borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertTriangle style={{ width: 26, height: 26, color: '#EF4444' }} />
            </div>
            <h2 style={{ color: 'var(--fi-text)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>¿Eliminar cliente?</h2>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Se eliminará <strong style={{ color: 'var(--fi-text)' }}>{deleting.name}</strong> y todo su historial. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleting(null)} style={{ touchAction: 'manipulation', flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--fi-border)', background: 'transparent', color: 'var(--fi-text-muted)', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={saving} style={{ touchAction: 'manipulation', flex: 1, height: 44, borderRadius: 12, background: '#EF4444', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--fi-glass)',
  border: '1px solid var(--fi-border)',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  color: 'var(--fi-text)',
  outline: 'none',
  fontFamily: 'inherit',
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
