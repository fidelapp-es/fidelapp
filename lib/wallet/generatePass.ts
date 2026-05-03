import { PKPass } from 'passkit-generator'
import { readFileSync } from 'fs'
import { deflateSync } from 'zlib'
import path from 'path'
import sharp from 'sharp'
import { getServiceClient } from '@/lib/supabase'
import { parseThemeConfig } from '@/lib/themeConfig'
import { getIcon } from '@/lib/walletIcons'

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
  iconKey: string = 'coffee',
  stampsCollected: number = 0,
  stampsRequired: number = 10,
): string {
  const W = 750, H = 246
  const iconPath = getIcon(iconKey).d

  // Stamp grid layout — cap at 15 for readability
  const n   = Math.min(stampsRequired, 15)
  const r   = n <= 8 ? 26 : n <= 10 ? 22 : n <= 12 ? 19 : 16
  const gap = n <= 8 ? 16 : n <= 10 ? 12 : 8
  const diam = r * 2
  const totalW = n * diam + (n - 1) * gap
  const startX = (W - totalW) / 2 + r
  const stampY = 192

  // Icon scale: corners must stay inside circle. icon is 24×24 → half=12.
  // corner dist from center = scale*12*√2 < r  →  scale < r/16.97
  // Use 55% of max to leave visible margin inside the circle.
  const iconScale = (r / 16.97 * 0.55).toFixed(3)

  const stamps = Array.from({ length: n }, (_, i) => {
    const filled = i < stampsCollected
    const cx     = startX + i * (diam + gap)
    const iconOp = filled ? '0.95' : '0.18'
    const circFill   = filled ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.05)'
    const circStroke = `rgba(255,255,255,${filled ? '0.55' : '0.18'})`
    return `
      <circle cx="${cx}" cy="${stampY}" r="${r}" fill="${circFill}" stroke="${circStroke}" stroke-width="1.5"/>
      <g transform="translate(${cx},${stampY}) scale(${iconScale}) translate(-12,-12)">
        <path d="${iconPath}" fill="rgba(255,255,255,${iconOp})"/>
      </g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${accent}"/>
        <stop offset="100%" stop-color="${accentDeep}"/>
      </linearGradient>
      <radialGradient id="glow" cx="15%" cy="80%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <circle cx="${W + 60}" cy="-60" r="180" fill="rgba(255,255,255,0.04)"/>
    <g transform="translate(672, 14) scale(1.8)" opacity="0.25">
      <path d="${iconPath}" fill="rgba(240,232,216,1)"/>
    </g>
    <text x="40" y="108"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="44" font-weight="bold" letter-spacing="5"
      fill="rgba(240,232,216,0.92)">${businessName.toUpperCase().slice(0, 14)}</text>
    <text x="42" y="136"
      font-family="Arial, sans-serif"
      font-size="15" font-weight="300" letter-spacing="4"
      fill="rgba(240,232,216,0.45)">PROGRAMA DE FIDELIZACIÓN</text>
    ${stamps}
  </svg>`
}

// ── Stamp overlay SVG (transparent bg — composited on top of custom strip) ───
function buildStampsOverlaySVG(
  iconKey: string,
  stampsCollected: number,
  stampsRequired: number,
  W = 750, H = 246,
): string {
  const iconPath = getIcon(iconKey).d
  const n    = Math.min(stampsRequired, 15)
  const r    = n <= 8 ? 26 : n <= 10 ? 22 : n <= 12 ? 19 : 16
  const gap  = n <= 8 ? 16 : n <= 10 ? 12 : 8
  const diam = r * 2
  const totalW = n * diam + (n - 1) * gap
  const startX = (W - totalW) / 2 + r
  const stampY = 192

  const iconScale = (r / 16.97 * 0.55).toFixed(3)

  const stamps = Array.from({ length: n }, (_, i) => {
    const filled = i < stampsCollected
    const cx     = startX + i * (diam + gap)
    const circFill   = filled ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)'
    const circStroke = `rgba(255,255,255,${filled ? '0.7' : '0.3'})`
    const iconOp = filled ? '0.95' : '0.25'
    return `
      <circle cx="${cx}" cy="${stampY}" r="${r}" fill="${circFill}" stroke="${circStroke}" stroke-width="1.5"/>
      <g transform="translate(${cx},${stampY}) scale(${iconScale}) translate(-12,-12)">
        <path d="${iconPath}" fill="rgba(255,255,255,${iconOp})"/>
      </g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${stamps}</svg>`
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

  const { data: settings } = await supabase
    .from('settings').select('*').eq('id', customer.owner_id).maybeSingle()

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
  const walletIcon   = themeConfig.wallet.icon_key || 'coffee'
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

  // Compute stamp fill for strip (shared by both paths)
  const stripFilled = cardType === 'stamps'
    ? stampsCollected
    : cardType === 'points'
      ? (customer.points || 0) % stampsRequired
      : Math.floor(customer.cashback_balance || 0) % stampsRequired

  // Strip image: use custom uploaded image OR generate from SVG
  let strip1x: Buffer, strip2x: Buffer
  if (walletStrip) {
    // Use custom strip image uploaded by the user, then composite stamps on top
    const customBuf = await fetchWithTimeout(walletStrip)
    if (customBuf) {
      try {
        const base2x = await sharp(customBuf).resize(750, 246, { fit: 'cover' }).png().toBuffer()
        const overlaySvg = buildStampsOverlaySVG(walletIcon, stripFilled, stampsRequired, 750, 246)
        strip2x = await sharp(base2x)
          .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
          .png().toBuffer()
        strip1x = await sharp(strip2x).resize(375, 123).png().toBuffer()
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
    const svg = buildStripSVG(walletHeader, accentHex, accentDeep, walletIcon, stripFilled, stampsRequired)
    try {
      strip2x = await sharp(Buffer.from(svg)).png().toBuffer()
      strip1x = await sharp(strip2x).resize(375, 123).png().toBuffer()
    } catch {
      strip1x = makeSolidPNG(375, 123, accentHex)
      strip2x = makeSolidPNG(750, 246, accentHex)
    }
  }

  const logoBuffer = walletLogoUrl
    ? (await fetchWithTimeout(walletLogoUrl)) ?? makeSolidPNG(160, 50, accentHex)
    : makeSolidPNG(160, 50, accentHex)

  // Use the business logo as the pass icon (shown in notifications and lock screen)
  // Resize to square with accent background so it looks clean at small sizes
  let icon1x: Buffer, icon2x: Buffer
  if (walletLogoUrl && logoBuffer.length > 100) {
    try {
      icon2x = await sharp(logoBuffer)
        .resize(58, 58, { fit: 'contain', background: accentHex })
        .png().toBuffer()
      icon1x = await sharp(logoBuffer)
        .resize(29, 29, { fit: 'contain', background: accentHex })
        .png().toBuffer()
    } catch {
      icon1x = makeSolidPNG(29, 29, accentHex)
      icon2x = makeSolidPNG(58, 58, accentHex)
    }
  } else {
    icon1x = makeSolidPNG(29, 29, accentHex)
    icon2x = makeSolidPNG(58, 58, accentHex)
  }

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

  // primaryFields render as huge text overlaid ON the strip image (Apple Wallet behavior),
  // which would cover the custom stamp-box design. We avoid them entirely and put all data
  // in secondary/auxiliary fields that appear cleanly below the strip.
  if (cardType === 'stamps') {
    pass.secondaryFields.push(
      { key: 'sellos',  label: 'SELLOS',        value: primaryValue },
      { key: 'name',    label: 'CLIENTE',        value: customer.name },
      { key: 'visits',  label: 'VISITAS',        value: String(customer.visits_count || 0) },
    )
    pass.auxiliaryFields.push(
      { key: 'spent',  label: 'TOTAL GASTADO', value: `${Number(customer.total_spent).toFixed(2)}€` },
    )
  } else {
    pass.secondaryFields.push(
      { key: 'metric', label: primaryLabel,    value: primaryValue },
      { key: 'name',   label: 'CLIENTE',       value: customer.name },
      { key: 'visits', label: 'VISITAS',       value: String(customer.visits_count || 0) },
    )
    pass.auxiliaryFields.push(
      { key: 'spent', label: 'TOTAL GASTADO', value: `${Number(customer.total_spent).toFixed(2)}€` },
    )
  }

  pass.backFields.push(
    { key: 'info', label: 'Cómo funciona',     value: `Muestra el QR en cada visita para acumular ${cardType === 'points' ? 'puntos' : cardType === 'stamps' ? 'sellos' : 'cashback'}.` },
    { key: 'url',  label: 'Tu tarjeta digital', value: cardUrl }
  )

  // Campaign promo message — when set, iOS shows a visible notification on the lock screen
  if (customer.last_promo_message) {
    pass.backFields.push({
      key:           'promo',
      label:         'Mensaje de tu tienda',
      value:         customer.last_promo_message,
      changeMessage: '%@',
    })
  }

  pass.setBarcodes({ message: cardUrl, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' })

  // Native Apple Wallet location alert — fires automatically when customer is nearby
  if (settings?.geo_enabled && settings?.geo_lat && settings?.geo_lng) {
    pass.setLocations({
      latitude:     Number(settings.geo_lat),
      longitude:    Number(settings.geo_lng),
      relevantText: settings.geo_message || `¡Estás cerca de ${businessName}! Muestra tu tarjeta.`,
    })
  }

  return pass.getAsBuffer()
}
