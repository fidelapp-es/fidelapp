import { PKPass } from 'passkit-generator'
import { readFileSync } from 'fs'
import { deflateSync } from 'zlib'
import path from 'path'
import sharp from 'sharp'
import { getServiceClient } from '@/lib/supabase'
import { parseThemeConfig } from '@/lib/themeConfig'

// ── Fallback PNG (solid color, no external deps) ──────────────────────────────
function crc32(buf: Buffer): number {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}
export function makeSolidPNG(w: number, h: number, hex: string): Buffer {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  const [r, g, b] = m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : [181, 49, 42]
  const row = Buffer.alloc(1 + w * 3); row[0] = 0
  for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b }
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflateSync(raw)),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function darken(hex: string, amount = 0.62): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  return (
    '#' +
    [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
      .map(v => Math.round(v * amount).toString(16).padStart(2, '0'))
      .join('')
  )
}
export function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? `rgb(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)})`
    : 'rgb(181,49,42)'
}
async function fetchWithTimeout(url: string, ms = 4000): Promise<Buffer | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), ms)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null
  } catch {
    return null
  }
}

// ── Strip SVG ─────────────────────────────────────────────────────────────────
function buildStripSVG(
  businessName: string,
  accent: string,
  accentDeep: string,
  cardType: string,
  stampsCollected: number,
  stampsRequired: number,
  primaryValue: string,
): string {
  const W = 750, H = 246

  const cup = `
    <g transform="translate(598,20) scale(1.8)" opacity="0.55">
      <path d="M4 8 L26 8 L22 34 L8 34 Z" fill="none" stroke="rgba(240,232,216,0.72)" stroke-width="1.3" stroke-linejoin="round"/>
      <rect x="3" y="5.5" width="24" height="4" rx="2" fill="rgba(240,232,216,0.15)" stroke="rgba(240,232,216,0.65)" stroke-width="1.2"/>
      <rect x="11" y="2" width="8" height="4.5" rx="1.5" fill="none" stroke="rgba(240,232,216,0.5)" stroke-width="1"/>
      <line x1="6.5" y1="17" x2="23.5" y2="17" stroke="rgba(240,232,216,0.22)" stroke-width="5" stroke-linecap="round"/>
    </g>`

  let stampsRow = ''
  if (cardType === 'stamps') {
    const cols = Math.min(stampsRequired, 10)
    const stampW = 36, gap = 8
    const startX = 40
    const startY = H - 68
    for (let i = 0; i < cols; i++) {
      const x = startX + i * (stampW + gap)
      const filled = i < stampsCollected
      stampsRow += `
        <rect x="${x}" y="${startY}" width="${stampW}" height="${stampW}" rx="7"
          fill="${filled ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}"
          stroke="${filled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'}"
          stroke-width="1.5"/>
        ${filled
          ? `<path d="M${x + 7} ${startY + 13} L${x + 29} ${startY + 13} L${x + 26} ${startY + 28} L${x + 10} ${startY + 28} Z"
              fill="none" stroke="rgba(240,232,216,0.9)" stroke-width="1.4" stroke-linejoin="round"/>
             <rect x="${x + 6}" y="${startY + 10}" width="24" height="5" rx="2.5"
              stroke="rgba(240,232,216,0.8)" stroke-width="1.2" fill="none"/>
             <rect x="${x + 13}" y="${startY + 5}" width="10" height="5" rx="1.5"
              stroke="rgba(240,232,216,0.55)" stroke-width="1" fill="none"/>`
          : `<path d="M${x + 7} ${startY + 13} L${x + 29} ${startY + 13} L${x + 26} ${startY + 28} L${x + 10} ${startY + 28} Z"
              fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.4" stroke-linejoin="round"/>
             <rect x="${x + 6}" y="${startY + 10}" width="24" height="5" rx="2.5"
              stroke="rgba(255,255,255,0.3)" stroke-width="1.2" fill="none"/>
             <rect x="${x + 13}" y="${startY + 5}" width="10" height="5" rx="1.5"
              stroke="rgba(255,255,255,0.2)" stroke-width="1" fill="none"/>`}
      `
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${accent}"/>
        <stop offset="100%" stop-color="${accentDeep}"/>
      </linearGradient>
      <radialGradient id="glow" cx="15%" cy="80%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <circle cx="${W + 60}" cy="-60" r="180" fill="rgba(255,255,255,0.05)"/>
    <circle cx="-60" cy="${H + 60}" r="160" fill="rgba(0,0,0,0.1)"/>
    <text x="40" y="66"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="52" font-weight="bold" letter-spacing="6"
      fill="rgba(240,232,216,0.92)">${businessName.toUpperCase().slice(0, 12)}</text>
    <text x="42" y="94"
      font-family="Arial, sans-serif"
      font-size="16" font-weight="300" letter-spacing="4"
      fill="rgba(240,232,216,0.5)">PROGRAMA DE FIDELIZACIÓN</text>
    <line x1="40" y1="110" x2="${cardType === 'stamps' ? 700 : 400}" y2="110"
      stroke="rgba(240,232,216,0.2)" stroke-width="1"/>
    ${cup}
    ${stampsRow}
    ${cardType === 'stamps'
      ? `<text x="40" y="${H - 18}"
          font-family="Arial, sans-serif" font-size="18" font-weight="300"
          fill="rgba(240,232,216,0.6)" letter-spacing="1">
          ${stampsCollected} de ${stampsRequired} cafés · ${Math.max(0, stampsRequired - stampsCollected)} para tu café gratis
        </text>`
      : `<text x="40" y="168"
          font-family="Georgia, serif" font-size="72" font-weight="bold"
          fill="rgba(240,232,216,0.95)">${primaryValue}</text>`}
  </svg>`
}

// ── Cert loader: env var (production) → filesystem (local dev) ───────────────
function loadCert(envVar: string, filename: string): Buffer {
  const b64 = process.env[envVar]
  if (b64) {
    console.log(`[loadCert] ${envVar} found in env (length=${b64.length})`)
    return Buffer.from(b64, 'base64')
  }
  console.warn(`[loadCert] ${envVar} NOT in env — falling back to filesystem (${filename})`)
  // Local development fallback
  const certsDir = path.join(process.cwd(), 'certs')
  return readFileSync(path.join(certsDir, filename))
}

// ── Main: generate a .pkpass buffer for a customer ────────────────────────────
export async function generatePassBuffer(customerId: string): Promise<Buffer> {
  const supabase = getServiceClient()

  const { data: customer, error: cErr } = await supabase
    .from('customers').select('*').eq('id', customerId).single()
  if (cErr || !customer) throw new Error('Cliente no encontrado')

  // owner_id may not exist on customers yet — just use the single settings row
  const { data: settings } = await supabase.from('settings').select('*').single()

  // auth_token may not exist yet (pre-migration schema)
  const authToken = customer.auth_token ?? customer.id

  const passTypeId   = process.env.PASS_TYPE_ID || 'pass.es.fidelapp.loyalty'
  const teamId       = process.env.PASS_TEAM_ID || ''
  const certPass     = process.env.PASS_CERT_PASSWORD || ''
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL || ''
  const businessName = settings?.business_name || 'Fidelapp'
  const cardUrl      = `${appUrl}/cliente/${customer.id}`
  const cardType     = settings?.card_type || 'stamps'

  // Read ALL visual config from `theme` JSON column — this is what the dashboard saves
  const themeConfig  = parseThemeConfig(settings?.theme)
  const accentHex    = themeConfig.wallet.strip_color || themeConfig.accent
  const bgHex        = themeConfig.wallet.bg_color
  const fgHex        = themeConfig.wallet.fg_color
  const labelHex     = themeConfig.wallet.label_color || accentHex
  const walletHeader = themeConfig.wallet.header || businessName
  const walletLogoUrl= themeConfig.wallet.logo_url || settings?.logo_url || null
  const walletStrip  = themeConfig.wallet.strip_url   // custom strip image overrides generated
  const accentDeep   = darken(accentHex, 0.62)

  const stampsRequired  = settings?.stamps_required || 10
  const stampsCollected = (customer.visits_count || 0) % stampsRequired

  let primaryValue = '', primaryLabel = ''
  if (cardType === 'points') {
    primaryValue = String(customer.points); primaryLabel = 'PUNTOS'
  } else if (cardType === 'cashback') {
    primaryValue = `${Number(customer.cashback_balance || 0).toFixed(2)}€`; primaryLabel = 'CASHBACK'
  } else {
    primaryValue = `${stampsCollected}/${stampsRequired}`; primaryLabel = 'SELLOS'
  }

  // Strip image: use custom uploaded image OR generate from SVG
  let strip1x: Buffer, strip2x: Buffer
  if (walletStrip) {
    // Use custom strip image uploaded by the user
    const customBuf = await fetchWithTimeout(walletStrip)
    if (customBuf) {
      try {
        strip2x = await sharp(customBuf).resize(750, 246, { fit: 'cover' }).png().toBuffer()
        strip1x = await sharp(customBuf).resize(375, 123, { fit: 'cover' }).png().toBuffer()
      } catch {
        strip2x = customBuf
        strip1x = customBuf
      }
    } else {
      strip1x = makeSolidPNG(375, 123, accentHex)
      strip2x = makeSolidPNG(750, 246, accentHex)
    }
  } else {
    // Auto-generate strip from SVG with design settings
    const svg = buildStripSVG(walletHeader, accentHex, accentDeep, cardType, stampsCollected, stampsRequired, primaryValue)
    try {
      strip2x = await sharp(Buffer.from(svg)).png().toBuffer()
      strip1x = await sharp(strip2x).resize(375, 123).png().toBuffer()
    } catch {
      strip1x = makeSolidPNG(375, 123, accentHex)
      strip2x = makeSolidPNG(750, 246, accentHex)
    }
  }

  const icon1x = makeSolidPNG(29, 29, accentHex)
  const icon2x = makeSolidPNG(58, 58, accentHex)
  const logoBuffer = walletLogoUrl
    ? (await fetchWithTimeout(walletLogoUrl)) ?? makeSolidPNG(160, 50, accentHex)
    : makeSolidPNG(160, 50, accentHex)

  const wwdr       = loadCert('APPLE_WWDR_CERT',   'wwdr.pem')
  const signerCert = loadCert('APPLE_SIGNER_CERT', 'signerCert.pem')
  const signerKey  = loadCert('APPLE_SIGNER_KEY',  'signerKey.pem')

  const pass = new PKPass(
    {
      'strip.png':    strip1x,
      'strip@2x.png': strip2x,
      'icon.png':     icon1x,
      'icon@2x.png':  icon2x,
      'logo.png':     logoBuffer,
      'logo@2x.png':  logoBuffer,
    },
    { wwdr, signerCert, signerKey, signerKeyPassphrase: certPass },
    {
      formatVersion:      1,
      passTypeIdentifier: passTypeId,
      teamIdentifier:     teamId,
      serialNumber:       customer.id,
      description:        `Tarjeta ${businessName}`,
      organizationName:   businessName,
      backgroundColor:    hexToRgb(bgHex),
      foregroundColor:    hexToRgb(fgHex),
      labelColor:         hexToRgb(labelHex),
      logoText:           walletHeader,
      // PassKit Web Service requires HTTPS — only include in production
      ...(appUrl.startsWith('https://')
        ? { webServiceURL: `${appUrl}/api/wallet/apple/`, authenticationToken: authToken }
        : {}),
    }
  )

  pass.type = 'storeCard'

  if (cardType === 'stamps') {
    pass.primaryFields.push({ key: 'stamps', label: 'SELLOS', value: primaryValue })
    pass.secondaryFields.push(
      { key: 'name',   label: 'CLIENTE',      value: customer.name },
      { key: 'visits', label: 'VISITAS',       value: String(customer.visits_count || 0) },
      { key: 'spent',  label: 'TOTAL GASTADO', value: `${Number(customer.total_spent).toFixed(2)}€` }
    )
  } else {
    pass.primaryFields.push({ key: 'metric', label: primaryLabel, value: primaryValue })
    pass.secondaryFields.push(
      { key: 'name',   label: 'CLIENTE',  value: customer.name },
      { key: 'visits', label: 'VISITAS',  value: String(customer.visits_count || 0) }
    )
    pass.auxiliaryFields.push(
      { key: 'spent', label: 'TOTAL GASTADO', value: `${Number(customer.total_spent).toFixed(2)}€` }
    )
  }

  pass.backFields.push(
    { key: 'info', label: 'Cómo funciona',     value: `Muestra el QR en cada visita para acumular ${cardType === 'points' ? 'puntos' : cardType === 'stamps' ? 'sellos' : 'cashback'}.` },
    { key: 'url',  label: 'Tu tarjeta digital', value: cardUrl }
  )

  pass.setBarcodes({ message: cardUrl, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' })

  return pass.getAsBuffer()
}
