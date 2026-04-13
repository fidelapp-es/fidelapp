'use client'

import { useState } from 'react'
import { Customer } from '@/lib/types'
import { Search, Star, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ClientesTable({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')

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

  return (
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

      {/* Vista móvil: tarjetas */}
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
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.email}</p>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{customer.phone}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <Star style={{ width: 14, height: 14, color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                    <span style={{ color: 'var(--fi-accent)', fontWeight: 700, fontSize: 14 }}>{customer.points}</span>
                  </div>
                  <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{Number(customer.total_spent).toFixed(2)}€</p>
                </div>
                <Link
                  href={`/cliente/${customer.id}`}
                  target="_blank"
                  style={{ touchAction: 'manipulation', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', color: 'var(--fi-text-muted)' }}
                >
                  <ExternalLink style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Vista desktop: tabla */}
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
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--fi-text-muted)', padding: '48px 0' }}>No se encontraron clientes</td>
              </tr>
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
                    <Link href={`/cliente/${customer.id}`} target="_blank" style={{ color: 'var(--fi-text-muted)' }}>
                      <ExternalLink style={{ width: 14, height: 14 }} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
