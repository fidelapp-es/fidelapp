'use client'

import { useState } from 'react'
import { Product } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const emptyForm = { name: '', price: '', category: 'Bebidas', active: true }
const CATEGORIAS = ['Bebidas', 'Comida', 'Desayunos', 'Postres', 'Otros']

export default function ProductosManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(field: string, value: string | boolean) { setForm(prev => ({ ...prev, [field]: value })) }
  function openNew() { setForm(emptyForm); setEditing(null); setOpen(true) }
  function openEdit(product: Product) {
    setForm({ name: product.name, price: String(product.price), category: product.category, active: product.active })
    setEditing(product.id); setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error('Rellena nombre y precio'); return }
    setLoading(true)
    try {
      const payload = { name: form.name, price: Number(form.price), category: form.category, active: form.active }
      if (editing) {
        const res = await fetch(`/api/productos/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const updated = await res.json()
        setProducts(prev => prev.map(p => p.id === editing ? updated : p))
        toast.success('Producto actualizado')
      } else {
        const res = await fetch('/api/productos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const created = await res.json()
        setProducts(prev => [...prev, created])
        toast.success('Producto añadido')
      }
      setOpen(false)
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Eliminado')
  }

  async function toggleActive(product: Product) {
    const res = await fetch(`/api/productos/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !product.active }) })
    const updated = await res.json()
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p))
  }

  const inputStyle = { width: '100%', background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: 'var(--fi-text)', outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          onClick={openNew}
          style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--fi-accent)', color: 'var(--fi-bg)', fontWeight: 600, borderRadius: 12, padding: '10px 18px', fontSize: 14, border: 'none', cursor: 'pointer' }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Añadir producto
        </button>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 384, background: 'var(--fi-bg)', border: '1px solid var(--fi-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setOpen(false)} style={{ touchAction: 'manipulation', color: 'var(--fi-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nombre</label>
              <input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Café con leche" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Precio (€)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => handleChange('price', e.target.value)} placeholder="1.80" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Categoría</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)} style={inputStyle}>
                {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="active-prod" checked={form.active as boolean} onChange={e => handleChange('active', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--fi-accent)' }} />
              <label htmlFor="active-prod" style={{ color: 'var(--fi-text-muted)', fontSize: 14 }}>Disponible</label>
            </div>
            <button onClick={handleSave} disabled={loading} style={{ touchAction: 'manipulation', width: '100%', background: 'var(--fi-accent)', color: 'var(--fi-bg)', fontWeight: 600, borderRadius: 12, height: 44, fontSize: 14, border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {/* Mobile: tarjetas */}
        <div className="md:hidden">
          {products.length === 0 ? (
            <p style={{ color: 'var(--fi-text-muted)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>No hay productos. Añade el primero.</p>
          ) : products.map((product, i) => (
            <div key={product.id} style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: i < products.length - 1 ? '1px solid var(--fi-border)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--fi-text)', fontWeight: 500, fontSize: 14 }}>{product.name}</p>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{product.category}</p>
              </div>
              <span style={{ color: 'var(--fi-accent)', fontWeight: 700, fontSize: 15 }}>{Number(product.price).toFixed(2)}€</span>
              <button onClick={() => toggleActive(product)} style={{ touchAction: 'manipulation', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, border: product.active ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--fi-border)', background: product.active ? 'rgba(16,185,129,0.1)' : 'transparent', color: product.active ? '#10B981' : 'var(--fi-text-muted)', cursor: 'pointer' }}>
                {product.active ? 'Activo' : 'Off'}
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(product)} style={{ touchAction: 'manipulation', padding: 8, color: 'var(--fi-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                  <Pencil style={{ width: 14, height: 14 }} />
                </button>
                <button onClick={() => handleDelete(product.id)} style={{ touchAction: 'manipulation', padding: 8, color: 'rgba(239,68,68,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden md:block" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--fi-border)' }}>
                {['Nombre', 'Categoría', 'Precio', 'Estado', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--fi-text-muted)', padding: '48px 0' }}>No hay productos. Añade el primero.</td></tr>
              ) : products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--fi-border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--fi-text)', fontWeight: 500 }}>{product.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: 'var(--fi-glass)', color: 'var(--fi-text-muted)', fontSize: 12, padding: '2px 10px', borderRadius: 20, border: '1px solid var(--fi-border)' }}>{product.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--fi-accent)', fontWeight: 700 }}>{Number(product.price).toFixed(2)}€</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(product)} style={{ touchAction: 'manipulation', fontSize: 12, padding: '2px 10px', borderRadius: 20, fontWeight: 500, border: product.active ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--fi-border)', background: product.active ? 'rgba(16,185,129,0.1)' : 'transparent', color: product.active ? '#10B981' : 'var(--fi-text-muted)', cursor: 'pointer' }}>
                      {product.active ? 'Disponible' : 'No disponible'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(product)} style={{ touchAction: 'manipulation', padding: 8, color: 'var(--fi-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                        <Pencil style={{ width: 14, height: 14 }} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} style={{ touchAction: 'manipulation', padding: 8, color: 'rgba(239,68,68,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
