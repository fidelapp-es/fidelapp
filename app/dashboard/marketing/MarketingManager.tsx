'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Send, Trash2, Users, Crown, Star, Clock, X, Megaphone, BarChart2, CheckCircle } from 'lucide-react'
import { useThemeApp } from '../ThemeProvider'

interface Campaign {
  id: string
  title: string
  message: string
  type: string
  segment: string
  status: string
  sent_count: number
  open_count: number
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

interface Props {
  initialCampaigns: Campaign[]
  customerCounts: { all: number; vip: number; oro: number; new: number; inactive: number }
}

const SEGMENTS = [
  { id: 'all', label: 'Todos los clientes', icon: Users, color: '#6366F1' },
  { id: 'vip', label: 'Clientes VIP (200+ pts)', icon: Crown, color: '#F59E0B' },
  { id: 'oro', label: 'Clientes Oro (100-199 pts)', icon: Star, color: '#C8873A' },
  { id: 'new', label: 'Clientes nuevos (<20 pts)', icon: Users, color: '#10B981' },
  { id: 'inactive', label: 'Inactivos (+30 días)', icon: Clock, color: '#6B7280' },
]

const TYPES = [
  { id: 'push', label: 'Notificación Push', emoji: '🔔' },
  { id: 'email', label: 'Email', emoji: '📧' },
  { id: 'sms', label: 'SMS', emoji: '💬' },
]

const TEMPLATES = [
  { title: '¡Oferta especial!', message: 'Tenemos una oferta exclusiva para ti hoy. ¡Ven a visitarnos y disfruta de tu descuento!' },
  { title: 'Te echamos de menos', message: 'Hace tiempo que no te vemos. ¡Vuelve y gana el doble de puntos esta semana!' },
  { title: 'Nuevo producto', message: 'Acabamos de añadir nuevos productos que te van a encantar. ¡Pásate a verlos!' },
  { title: 'Puntos a punto de expirar', message: 'Tienes puntos que caducan pronto. ¡Canjéalos antes de perderlos!' },
]

export default function MarketingManager({ initialCampaigns, customerCounts }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const { theme } = useThemeApp()

  const accentText = theme === 'dark' ? '#0D0B09' : '#FFFFFF'

  const [form, setForm] = useState({
    title: '', message: '', type: 'push', segment: 'all',
  })

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setForm(prev => ({ ...prev, title: t.title, message: t.message }))
  }

  async function handleCreate() {
    if (!form.title || !form.message) { toast.error('Rellena título y mensaje'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'draft' }),
      })
      const created = await res.json()
      setCampaigns(prev => [created, ...prev])
      setShowForm(false)
      setForm({ title: '', message: '', type: 'push', segment: 'all' })
      toast.success('Campaña creada')
    } finally { setLoading(false) }
  }

  async function handleSend(campaign: Campaign) {
    setSending(campaign.id)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent', segment: campaign.segment }),
      })
      const updated = await res.json()
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? updated : c))
      toast.success(`Campaña enviada a ${updated.sent_count} clientes`)
    } finally { setSending(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta campaña?')) return
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    setCampaigns(prev => prev.filter(c => c.id !== id))
    toast.success('Eliminada')
  }

  const segCount = (id: string) => customerCounts[id as keyof typeof customerCounts] ?? 0

  return (
    <div className="space-y-6">
      {/* Stats de audiencia */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {SEGMENTS.map(seg => (
          <div key={seg.id} className="glass-strong rounded-2xl p-4 text-center">
            <p style={{ color: seg.color, fontWeight: 700, fontSize: 24 }}>{segCount(seg.id)}</p>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, marginTop: 2 }}>{seg.label.split(' ')[0]} {seg.label.split(' ')[1]}</p>
          </div>
        ))}
      </div>

      {/* Botón nueva campaña */}
      <div className="flex justify-between items-center">
        <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>Campañas</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12, background: 'var(--fi-accent)', border: 'none', color: accentText, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          <Plus style={{ width: 16, height: 16 }} /> Nueva campaña
        </button>
      </div>

      {/* Modal nueva campaña */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ touchAction: 'manipulation' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl p-6 space-y-5" style={{ background: 'var(--fi-glass-strong)', border: '1px solid var(--fi-border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between">
              <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>Nueva campaña</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fi-text-muted)' }}><X style={{ width: 18, height: 18 }} /></button>
            </div>

            {/* Templates */}
            <div>
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Plantillas rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.title} onClick={() => applyTemplate(t)} style={{ touchAction: 'manipulation', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--fi-border)', background: 'var(--fi-glass)', cursor: 'pointer', textAlign: 'left', color: 'var(--fi-text)', fontSize: 12, fontWeight: 500 }}>{t.title}</button>
                ))}
              </div>
            </div>

            <FiField label="Título de la campaña">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="¡Oferta especial este fin de semana!" className="fi-input" />
            </FiField>

            <FiField label="Mensaje">
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Escribe el mensaje que recibirán tus clientes..." rows={4} className="fi-input resize-none" />
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 11, marginTop: 4 }}>{form.message.length}/160 caracteres</p>
            </FiField>

            <div className="grid grid-cols-2 gap-4">
              <FiField label="Canal">
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="fi-input">
                  {TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                </select>
              </FiField>
              <FiField label="Audiencia">
                <select value={form.segment} onChange={e => setForm(p => ({ ...p, segment: e.target.value }))} className="fi-input">
                  {SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label} ({segCount(s.id)})</option>)}
                </select>
              </FiField>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} style={{ touchAction: 'manipulation', flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--fi-border)', background: 'var(--fi-glass)', color: 'var(--fi-text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Cancelar</button>
              <button onClick={handleCreate} disabled={loading} style={{ touchAction: 'manipulation', flex: 2, height: 44, borderRadius: 12, background: 'var(--fi-accent)', border: 'none', color: accentText, fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Guardando...' : 'Guardar campaña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de campañas */}
      {campaigns.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <Megaphone style={{ width: 40, height: 40, color: 'var(--fi-text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 14 }}>No hay campañas. Crea la primera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => {
            const seg = SEGMENTS.find(s => s.id === campaign.segment)
            const type = TYPES.find(t => t.id === campaign.type)
            const isSent = campaign.status === 'sent'
            return (
              <div key={campaign.id} className="glass-strong rounded-2xl p-5" style={{ border: isSent ? '1px solid var(--fi-accent-border)' : '1px solid var(--fi-border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 16 }}>{type?.emoji}</span>
                      <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 14 }}>{campaign.title}</h3>
                      {isSent ? (
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 11, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>Enviada</span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: 'var(--fi-accent-bg)', color: 'var(--fi-accent)', fontSize: 11, fontWeight: 600, border: '1px solid var(--fi-accent-border)' }}>Borrador</span>
                      )}
                    </div>
                    <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>{campaign.message}</p>
                    <div className="flex flex-wrap gap-3">
                      <span style={{ color: seg?.color, fontSize: 12, fontWeight: 500 }}>{seg?.label}</span>
                      {isSent && (
                        <>
                          <span style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>
                            <BarChart2 style={{ width: 12, height: 12, display: 'inline', marginRight: 3 }} />
                            {campaign.sent_count} enviados
                          </span>
                          {campaign.sent_at && (
                            <span style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>
                              {new Date(campaign.sent_at).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!isSent && (
                      <button
                        onClick={() => handleSend(campaign)}
                        disabled={sending === campaign.id}
                        style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'var(--fi-accent)', border: 'none', color: accentText, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: sending === campaign.id ? 0.7 : 1 }}
                      >
                        <Send style={{ width: 13, height: 13 }} />
                        {sending === campaign.id ? 'Enviando...' : 'Enviar'}
                      </button>
                    )}
                    {isSent && <CheckCircle style={{ width: 20, height: 20, color: '#10B981', marginTop: 4 }} />}
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      style={{ touchAction: 'manipulation', padding: '7px', borderRadius: 10, border: '1px solid var(--fi-border)', background: 'transparent', color: '#EF4444', cursor: 'pointer', opacity: 0.6 }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

function FiField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
