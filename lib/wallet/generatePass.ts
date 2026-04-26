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
): string {
  const W = 750, H = 246
  const iconPath = getIcon(iconKey).d

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
    <g transform="translate(685, 18) scale(2.0)" opacity="0.5">
      <path d="${iconPath}" fill="rgba(240,232,216,0.9)"/>
    </g>
    <text x="40" y="148"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="52" font-weight="bold" letter-spacing="6"
      fill="rgba(240,232,216,0.92)">${businessName.toUpperCase().slice(0, 12)}</text>
    <text x="42" y="180"
      font-family="Arial, sans-serif"
      font-size="16" font-weight="300" letter-spacing="4"
      fill="rgba(240,232,216,0.5)">PROGRAMA DE FIDELIZACIÓN</text>
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
    const svg = buildStripSVG(walletHeader, accentHex, accentDeep, walletIcon)
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
