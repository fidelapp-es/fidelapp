import http2 from 'node:http2'
import { readFileSync } from 'fs'
import path from 'path'
import { getServiceClient } from '@/lib/supabase'

function loadCert(envVar: string, filename: string): Buffer {
  const b64 = process.env[envVar]
  if (b64) return Buffer.from(b64, 'base64')
  return readFileSync(path.join(process.cwd(), 'certs', filename))
}

/**
 * Sends an APNs silent push to all devices that have a customer's pass installed.
 * iOS receives the push and calls our PassKit web service to fetch the updated pass.
 */
export async function pushPassUpdate(customerId: string): Promise<void> {
  const supabase   = getServiceClient()
  const passTypeId = process.env.PASS_TYPE_ID || 'pass.es.fidelapp.loyalty'
  const certPass   = process.env.PASS_CERT_PASSWORD || ''

  const { data: registrations } = await supabase
    .from('pass_registrations')
    .select('push_token')
    .eq('serial_number', customerId)
    .eq('pass_type_id', passTypeId)

  if (!registrations || registrations.length === 0) return

  let cert: Buffer, key: Buffer
  try {
    cert = loadCert('APPLE_SIGNER_CERT', 'signerCert.pem')
    key  = loadCert('APPLE_SIGNER_KEY',  'signerKey.pem')
  } catch (e: any) {
    console.error('[APNs] Could not load certs — push skipped:', e.message)
    return
  }

  const client = http2.connect('https://api.push.apple.com', {
    cert,
    key,
    passphrase: certPass || undefined,
  })

  client.on('error', (err) => console.error('[APNs] Connection error:', err.message))

  const pushPromises = registrations.map(({ push_token }) =>
    new Promise<void>((resolve) => {
      const body = Buffer.from('{}')
      const req = client.request({
        ':method':        'POST',
        ':path':          `/3/device/${push_token}`,
        'apns-topic':     passTypeId,
        'apns-push-type': 'background',
        'apns-priority':  '5',
        'content-type':   'application/json',
        'content-length': body.length,
      })
      req.write(body)
      req.end()
      req.on('response', (headers) => {
        const status = headers[':status'] as number
        if (status !== 200) {
          let errBody = ''
          req.on('data', (c: Buffer) => { errBody += c.toString() })
          req.on('end', () => { console.error(`[APNs] Push failed ${push_token}: ${status} ${errBody}`); resolve() })
        } else {
          resolve()
        }
      })
      req.on('error', (err) => { console.error(`[APNs] Request error ${push_token}:`, err.message); resolve() })
    })
  )

  await Promise.all(pushPromises)
  client.close()
}
