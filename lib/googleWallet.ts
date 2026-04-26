import jwt from 'jsonwebtoken'

const ISSUER_ID = '3388000000023115382'
const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1'
const OAUTH_URL  = 'https://oauth2.googleapis.com/token'
const SCOPE      = 'https://www.googleapis.com/auth/wallet_object.issuer'

export interface GoogleCreds {
  private_key: string
  client_email: string
}

export function loadGoogleCreds(): GoogleCreds {
  const raw = process.env.GOOGLE_WALLET_CREDENTIALS_JSON
  if (!raw) throw new Error('GOOGLE_WALLET_CREDENTIALS_JSON no está configurada')
  return JSON.parse(raw)
}

// ── OAuth2 access token using service account ─────────────────────────────────
export async function getAccessToken(creds: GoogleCreds): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const assertion = jwt.sign(
    { iss: creds.client_email, scope: SCOPE, aud: OAUTH_URL, iat: now, exp: now + 3600 },
    creds.private_key,
    { algorithm: 'RS256' }
  )
  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${assertion}`,
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Google OAuth error: ${JSON.stringify(data)}`)
  return data.access_token
}

// ── Build stable IDs ──────────────────────────────────────────────────────────
export function classId(ownerId: string)    { return `${ISSUER_ID}.owner_${ownerId.replace(/-/g, '_')}` }
export function objectId(customerId: string) { return `${ISSUER_ID}.cust_${customerId.replace(/-/g, '_')}` }

// ── Build class payload from business settings ────────────────────────────────
export function buildClassPayload(
  id: string,
  businessName: string,
  accentHex: string,
  logoUrl: string | null,
) {
  return {
    id,
    issuerName: businessName,
    programName: businessName,
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: accentHex,
    countryCode: 'ES',
    ...(logoUrl ? {
      programLogo: {
        sourceUri: { uri: logoUrl },
        contentDescription: { defaultValue: { language: 'es-ES', value: businessName } },
      },
    } : {}),
  }
}

// ── Build object payload from customer data ───────────────────────────────────
export function buildObjectPayload(
  id: string,
  cId: string,
  customer: any,
  cardType: string,
  stampsRequired: number,
  cardUrl: string,
) {
  const stampsCollected = (customer.visits_count || 0) % stampsRequired

  let pointsLabel = 'Puntos'
  let pointsValue = ''
  if (cardType === 'points') {
    pointsLabel = 'Puntos'; pointsValue = String(customer.points || 0)
  } else if (cardType === 'cashback') {
    pointsLabel = 'Cashback'; pointsValue = `${Number(customer.cashback_balance || 0).toFixed(2)}€`
  } else {
    pointsLabel = 'Sellos'; pointsValue = `${stampsCollected}/${stampsRequired}`
  }

  return {
    id,
    classId: cId,
    state: 'ACTIVE',
    accountId: customer.id.slice(0, 8).toUpperCase(),
    accountName: customer.name,
    loyaltyPoints: { balance: { string: pointsValue }, label: pointsLabel },
    barcode: { type: 'QR_CODE', value: cardUrl, alternateText: customer.name },
    textModulesData: [
      { header: 'VISITAS',       body: String(customer.visits_count || 0),                          id: 'visitas'  },
      { header: 'TOTAL GASTADO', body: `${Number(customer.total_spent || 0).toFixed(2)}€`,          id: 'gastado'  },
    ],
  }
}

// ── Generic upsert (GET → create or patch) ────────────────────────────────────
async function upsert(
  resource: string,
  id: string,
  payload: object,
  token: string,
) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const encodedId = encodeURIComponent(id)

  const getRes = await fetch(`${WALLET_API}/${resource}/${encodedId}`, { headers })

  if (getRes.status === 404) {
    const createRes = await fetch(`${WALLET_API}/${resource}`, {
      method: 'POST', headers, body: JSON.stringify(payload),
    })
    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Google Wallet create ${resource} failed: ${err}`)
    }
    return
  }

  if (!getRes.ok) {
    const err = await getRes.text()
    throw new Error(`Google Wallet get ${resource} failed: ${err}`)
  }

  const patchRes = await fetch(`${WALLET_API}/${resource}/${encodedId}`, {
    method: 'PATCH', headers, body: JSON.stringify(payload),
  })
  if (!patchRes.ok) {
    const err = await patchRes.text()
    throw new Error(`Google Wallet patch ${resource} failed: ${err}`)
  }
}

export async function upsertLoyaltyClass(payload: object, token: string) {
  await upsert('loyaltyClass', (payload as any).id, payload, token)
}

export async function upsertLoyaltyObject(payload: object, token: string) {
  await upsert('loyaltyObject', (payload as any).id, payload, token)
}

// ── Generate signed "save to wallet" JWT referencing API-managed objects ──────
export function buildSaveJwt(creds: GoogleCreds, custObjectId: string): string {
  const payload = {
    iss: creds.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: { loyaltyObjects: [{ id: custObjectId }] },
  }
  return jwt.sign(payload, creds.private_key, { algorithm: 'RS256' })
}
