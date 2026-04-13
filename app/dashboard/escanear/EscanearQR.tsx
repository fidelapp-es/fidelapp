'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, QrCode, Star, RotateCcw, Camera, Search, User } from 'lucide-react'

interface ScanResult {
  customer: { name: string; points: number }
  points_earned: number
  card_type?: string
  display?: { label: string; value: string; total: string }
}

type Step = 'idle' | 'scanning' | 'form' | 'result' | 'search'
type Mode = 'camera' | 'file' | 'manual'

interface CustomerMatch {
  id: string
  name: string
  email: string
  points: number
}

export default function EscanearQR() {
  const [step, setStep] = useState<Step>('idle')
  const [mode, setMode] = useState<Mode>('camera')
  const [scanned, setScanned] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CustomerMatch[]>([])
  const [searching, setSearching] = useState(false)
  const scannerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  function extractFromScanned(text: string): { qr_code?: string; customer_id?: string } {
    const match = text.match(/\/cliente\/([0-9a-f-]{36})/i)
    if (match) return { customer_id: match[1] }
    // UUID directo
    if (/^[0-9a-f-]{36}$/i.test(text)) return { customer_id: text }
    return { qr_code: text }
  }

  // ── Escáner en vivo ──────────────────────────────────────────
  useEffect(() => {
    if (step !== 'scanning' || mode !== 'camera') return
    let stopped = false

    async function startCamera() {
      const { Html5Qrcode } = await import('html5-qrcode')
      const el = document.getElementById('qr-reader')
      if (!el) return

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      const config = { fps: 15, qrbox: { width: 250, height: 250 } }

      const attempts = [
        { facingMode: { exact: 'environment' } },
        { facingMode: 'environment' },
        { facingMode: 'user' },
        {},
      ]

      let started = false
      for (const constraint of attempts) {
        if (stopped || started) break
        try {
          await scanner.start(constraint, config, onScan, () => {})
          started = true
        } catch { }
      }

      if (!started && !stopped) {
        setCameraError('No se pudo acceder a la cámara en vivo.')
        setStep('idle')
      }

      function onScan(text: string) {
        stopped = true
        scanner.stop().catch(() => {})
        setScanned(text)
        setStep('form')
      }
    }

    startCamera()
    return () => {
      stopped = true
      if (scannerRef.current) try { scannerRef.current.stop().catch(() => {}) } catch {}
    }
  }, [step, mode])

  // ── Escanear foto con jsQR (para iOS) ───────────────────────
  async function handleFileCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      // Intentar BarcodeDetector nativo primero (iOS 17+, Chrome Android)
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const bitmap = await createImageBitmap(file)
        const barcodes = await detector.detect(bitmap)
        if (barcodes.length > 0) {
          setScanned(barcodes[0].rawValue)
          setStep('form')
          return
        }
      }

      // Fallback: jsQR via canvas
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = URL.createObjectURL(file)
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const jsQR = (await import('jsqr')).default
      const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })
      if (qrResult) {
        setScanned(qrResult.data)
        setStep('form')
      } else {
        toast.error('No se detectó el QR. Prueba a buscar el cliente por nombre.')
      }
    } catch {
      toast.error('Error al leer la imagen.')
    }
  }

  // ── Búsqueda manual ──────────────────────────────────────────
  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(Array.isArray(data) ? data.slice(0, 5) : [])
    } finally { setSearching(false) }
  }

  function selectCustomer(c: CustomerMatch) {
    setCustomerId(c.id)
    setScanned(`/cliente/${c.id}`)
    setSearchQuery('')
    setSearchResults([])
    setStep('form')
  }

  // ── Registrar visita ──────────────────────────────────────────
  async function handleRegistrar() {
    if ((!scanned && !customerId) || !amount) { toast.error('Introduce el importe'); return }
    setLoading(true)
    try {
      const payload = scanned
        ? { ...extractFromScanned(scanned), amount_spent: Number(amount), notes }
        : { customer_id: customerId, amount_spent: Number(amount), notes }

      const res = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Cliente no encontrado'); return }
      setResult(data)
      setStep('result')
    } finally { setLoading(false) }
  }

  function reset() {
    setScanned(null); setCustomerId(null); setAmount(''); setNotes('')
    setResult(null); setCameraError(''); setSearchQuery(''); setSearchResults([])
    setStep('idle')
  }

  // ── Resultado ─────────────────────────────────────────────────
  if (step === 'result' && result) return (
    <div className="glass-strong rounded-3xl p-8 text-center">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle style={{ width: 32, height: 32, color: '#10B981' }} />
        </div>
      </div>
      <h2 style={{ color: 'var(--fi-text)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>¡Visita registrada!</h2>
      <p style={{ color: 'var(--fi-text-muted)', marginBottom: 28 }}>{result.customer.name}</p>
      <div className="glass-amber" style={{ borderRadius: 16, padding: 24, marginBottom: 28, border: '1px solid var(--fi-accent-border)' }}>
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          {result.display?.label || 'Ganado hoy'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Star style={{ width: 20, height: 20, fill: 'var(--fi-accent)', color: 'var(--fi-accent)' }} />
          <span style={{ fontSize: 48, fontWeight: 700, color: 'var(--fi-accent)', lineHeight: 1 }}>
            {result.display?.value || `+${result.points_earned}`}
          </span>
        </div>
        {result.display?.total && (
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginTop: 12 }}>
            Total: <span style={{ color: 'var(--fi-accent)', fontWeight: 700 }}>{result.display.total}</span>
          </p>
        )}
      </div>
      <button onClick={reset} style={{ touchAction: 'manipulation', width: '100%', background: 'var(--fi-accent)', color: 'var(--fi-bg)', fontWeight: 600, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
        <RotateCcw style={{ width: 16, height: 16 }} /> Escanear otro cliente
      </button>
    </div>
  )

  // ── Formulario de importe ──────────────────────────────────────
  if (step === 'form') return (
    <div className="glass-strong rounded-3xl p-7">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--fi-border)' }}>
        <div className="glass-amber" style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--fi-accent-border)' }}>
          <QrCode style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
        </div>
        <div>
          <p style={{ color: 'var(--fi-text)', fontSize: 14, fontWeight: 500 }}>Cliente identificado ✓</p>
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>Introduce el importe de la compra</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Importe (€)</label>
          <input
            type="number" step="0.01" min="0.01"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" autoFocus
            style={{ width: '100%', background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 12, padding: '14px 16px', fontSize: 28, fontWeight: 700, color: 'var(--fi-text)', outline: 'none', fontFamily: 'inherit' }}
          />
          {amount && (
            <p style={{ color: 'var(--fi-accent)', fontSize: 14, fontWeight: 500, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star style={{ width: 14, height: 14, fill: 'var(--fi-accent)' }} />+{Math.floor(Number(amount))} puntos
            </p>
          )}
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--fi-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Notas (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Café + tostada..." rows={2}
            style={{ width: '100%', background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: 'var(--fi-text)', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={reset} style={{ touchAction: 'manipulation', flex: 1, border: '1px solid var(--fi-border)', background: 'transparent', color: 'var(--fi-text-muted)', borderRadius: 12, height: 48, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleRegistrar} disabled={loading || !amount}
            style={{ touchAction: 'manipulation', flex: 1, background: 'var(--fi-accent)', border: 'none', color: 'var(--fi-bg)', fontWeight: 600, borderRadius: 12, height: 48, fontSize: 14, cursor: 'pointer', opacity: loading || !amount ? 0.5 : 1 }}>
            {loading ? 'Registrando...' : 'Sumar puntos'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Escáner en vivo ───────────────────────────────────────────
  if (step === 'scanning') return (
    <div className="glass-strong rounded-3xl overflow-hidden">
      <div style={{ padding: 16, borderBottom: '1px solid var(--fi-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Camera style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
          <p style={{ color: 'var(--fi-text-muted)', fontSize: 14 }}>Apunta al QR del cliente</p>
        </div>
        <button onClick={reset} style={{ touchAction: 'manipulation', color: 'var(--fi-text-muted)', fontSize: 12, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
      <div id="qr-reader" style={{ width: '100%', minHeight: 320 }} />
    </div>
  )

  // ── Búsqueda manual ───────────────────────────────────────────
  if (step === 'search') return (
    <div className="glass-strong rounded-3xl p-6">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: 'var(--fi-text)', fontWeight: 600, fontSize: 16 }}>Buscar cliente</h2>
        <button onClick={reset} style={{ touchAction: 'manipulation', color: 'var(--fi-text-muted)', background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--fi-text-muted)' }} />
        <input
          autoFocus
          placeholder="Nombre, email o teléfono..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 12, paddingBottom: 12, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 12, fontSize: 15, color: 'var(--fi-text)', outline: 'none', fontFamily: 'inherit' }}
        />
      </div>
      {searching && <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, textAlign: 'center', padding: 12 }}>Buscando...</p>}
      {searchResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {searchResults.map(c => (
            <button key={c.id} onClick={() => selectCustomer(c)}
              style={{ touchAction: 'manipulation', display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--fi-glass)', border: '1px solid var(--fi-border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--fi-accent-bg)', border: '1px solid var(--fi-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User style={{ width: 16, height: 16, color: 'var(--fi-accent)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--fi-text)', fontWeight: 500, fontSize: 14 }}>{c.name}</p>
                <p style={{ color: 'var(--fi-text-muted)', fontSize: 12 }}>{c.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star style={{ width: 12, height: 12, color: 'var(--fi-accent)', fill: 'var(--fi-accent)' }} />
                <span style={{ color: 'var(--fi-accent)', fontWeight: 700, fontSize: 13 }}>{c.points}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
        <p style={{ color: 'var(--fi-text-muted)', fontSize: 13, textAlign: 'center', padding: 12 }}>No se encontraron clientes</p>
      )}
    </div>
  )

  // ── Idle ──────────────────────────────────────────────────────
  return (
    <div className="glass-strong rounded-3xl p-8 text-center">
      {/* Input oculto para iOS */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileCapture} style={{ display: 'none' }} />

      <div className="glass-amber" style={{ width: 80, height: 80, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--fi-accent-border)' }}>
        <QrCode style={{ width: 36, height: 36, color: 'var(--fi-accent)' }} />
      </div>
      <h2 style={{ color: 'var(--fi-text)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Escanear cliente</h2>
      <p style={{ color: 'var(--fi-text-muted)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        Identifica al cliente para registrar su visita y sumar puntos
      </p>

      {cameraError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 12, marginBottom: 16, color: '#EF4444', fontSize: 13, textAlign: 'left' }}>
          {cameraError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* iOS: foto del QR */}
        {isIOS ? (
          <button onClick={() => fileInputRef.current?.click()}
            style={{ touchAction: 'manipulation', width: '100%', background: 'var(--fi-accent)', border: 'none', color: 'var(--fi-bg)', fontWeight: 600, height: 56, borderRadius: 16, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Camera style={{ width: 20, height: 20 }} /> Fotografiar QR del cliente
          </button>
        ) : (
          <button onClick={() => { setCameraError(''); setStep('scanning') }}
            style={{ touchAction: 'manipulation', width: '100%', background: 'var(--fi-accent)', border: 'none', color: 'var(--fi-bg)', fontWeight: 600, height: 56, borderRadius: 16, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Camera style={{ width: 20, height: 20 }} /> Abrir cámara
          </button>
        )}

        {/* Siempre disponible: buscar por nombre */}
        <button onClick={() => setStep('search')}
          style={{ touchAction: 'manipulation', width: '100%', background: 'transparent', border: '1px solid var(--fi-border)', color: 'var(--fi-text-muted)', fontWeight: 500, height: 48, borderRadius: 14, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Search style={{ width: 16, height: 16 }} /> Buscar cliente por nombre
        </button>
      </div>
    </div>
  )
}
