'use client'

import { useState, useEffect } from 'react'
import { MapPin, Bell, BellOff, Navigation, Radio, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Settings {
  geo_lat: number | null
  geo_lng: number | null
  geo_radius_meters: number
  geo_message: string
  geo_enabled: boolean
  business_name: string
}

export default function GeocatchClient({ settings }: { settings: Settings | null }) {
  const [pushSupported, setPushSupported] = useState(false)
  const [pushGranted, setPushGranted] = useState(false)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [monitoring, setMonitoring] = useState(false)

  useEffect(() => {
    setPushSupported('Notification' in window)
    if ('Notification' in window) setPushGranted(Notification.permission === 'granted')
  }, [])

  async function requestPush() {
    const perm = await Notification.requestPermission()
    setPushGranted(perm === 'granted')
    if (perm === 'granted') toast.success('Notificaciones activadas')
    else toast.error('Permiso denegado')
  }

  function getUserLocation() {
    if (!navigator.geolocation) { toast.error('Geolocalización no disponible'); return }
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setUserPos({ lat, lng })
      if (settings?.geo_lat && settings?.geo_lng) {
        const d = haversine(lat, lng, settings.geo_lat, settings.geo_lng)
        setDistance(Math.round(d))
      }
      toast.success(`Ubicación detectada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }, () => toast.error('No se pudo obtener ubicación'))
  }

  function startMonitoring() {
    if (!navigator.geolocation) return
    setMonitoring(true)
    toast.info('Monitorizando proximidad...')
    const id = navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setUserPos({ lat, lng })
      if (settings?.geo_lat && settings?.geo_lng) {
        const d = haversine(lat, lng, settings.geo_lat, settings.geo_lng)
        const dm = Math.round(d)
        setDistance(dm)
        if (dm <= (settings.geo_radius_meters || 500) && pushGranted) {
          new Notification(`📍 ${settings.business_name || 'Fidelapp'}`, {
            body: settings.geo_message || '¡Estás cerca! Ven a visitarnos.',
            icon: '/icon-192.png',
          })
        }
      }
    })
    return () => navigator.geolocation.clearWatch(id)
  }

  const isNear = distance !== null && settings?.geo_radius_meters && distance <= settings.geo_radius_meters
  const enabled = settings?.geo_enabled

  return (
    <div className="space-y-5">
      {/* Estado del negocio */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: enabled ? 'rgba(16,185,129,0.1)' : 'var(--fi-glass)', border: `1px solid ${enabled ? 'rgba(16,185,129,0.3)' : 'var(--fi-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio style={{ width: 18, height: 18, color: enabled ? '#10B981' : 'var(--fi-text-muted)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 15 }}>Geocatch {enabled ? 'activo' : 'inactivo'}</p>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 13 }}>
              {enabled && settings?.geo_lat
                ? `Radio: ${settings.geo_radius_meters}m — ${settings.geo_lat?.toFixed(4)}, ${settings.geo_lng?.toFixed(4)}`
                : 'Configura la ubicación en Ajustes → Geocatch'
              }
            </p>
          </div>
        </div>
        {!enabled && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle style={{ width: 16, height: 16, color: '#F59E0B', flexShrink: 0 }} />
            <p style={{ color: '#F59E0B', fontSize: 13 }}>Activa Geocatch en <strong>Ajustes → Geocatch</strong> para empezar.</p>
          </div>
        )}
      </div>

      {/* Notificaciones push */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Notificaciones push</h3>
        {!pushSupported ? (
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 13 }}>Tu navegador no soporta notificaciones push.</p>
        ) : pushGranted ? (
          <div className="flex items-center gap-2">
            <Bell style={{ width: 18, height: 18, color: '#10B981' }} />
            <p style={{ color: '#10B981', fontSize: 14, fontWeight: 500 }}>Notificaciones activadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 13 }}>Activa las notificaciones para recibir alertas de proximidad.</p>
            <button onClick={requestPush} style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: 'var(--fi-accent)', border: 'none', color: 'var(--fi-text)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <Bell style={{ width: 16, height: 16 }} /> Activar notificaciones
            </button>
          </div>
        )}
      </div>

      {/* Test de proximidad */}
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 15 }}>Probar detección</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={getUserLocation} style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', color: 'var(--fi-accent)', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
            <Navigation style={{ width: 15, height: 15 }} /> Mi ubicación
          </button>
          {enabled && !monitoring && (
            <button onClick={startMonitoring} style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, background: 'var(--fi-accent)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
              <Radio style={{ width: 15, height: 15 }} /> Iniciar monitoreo
            </button>
          )}
        </div>

        {userPos && (
          <div style={{ padding: '14px', borderRadius: 14, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)' }}>
            <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginBottom: 6 }}>Tu posición</p>
            <p style={{ color: 'var(--fi-text)', fontSize: 14, fontWeight: 500 }}>{userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}</p>
            {distance !== null && (
              <div className="mt-3">
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, marginBottom: 4 }}>Distancia al negocio</p>
                <p style={{ color: isNear ? '#10B981' : 'var(--fi-accent)', fontWeight: 700, fontSize: 22 }}>
                  {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                </p>
                <p style={{ color: isNear ? '#10B981' : 'var(--fi-text-muted)', fontSize: 13, marginTop: 2 }}>
                  {isNear ? '✓ Dentro del radio — notificación activada' : `Fuera del radio (${settings?.geo_radius_meters}m)`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cómo funciona */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Cómo funciona</h3>
        <div className="space-y-3">
          {[
            { icon: MapPin, text: 'Defines la ubicación y radio de tu negocio en Ajustes → Geocatch' },
            { icon: Bell, text: 'El cliente tiene la app instalada y las notificaciones activadas' },
            { icon: Radio, text: 'Cuando entra en el radio definido, recibe automáticamente tu mensaje' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <step.icon style={{ width: 15, height: 15, color: 'var(--fi-accent)' }} />
              </div>
              <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
