import http2 from 'node:http2'
import { readFileSync } from 'fs'
import path from 'path'
import { getServiceClient } from '@/lib/supabase'

/**
 * Sends an APNs push notification to all devices that have a customer's pass installed.
 * iOS receives the push, then calls our PassKit web service to fetch the updated pass.
 *
 * The Pass Type ID certificate is also valid for sending APNs pushes for that pass type.
 */
export async function pushPassUpdate(customerId: string): Promise<void> {
  const supabase = getServiceClient()
  const passTypeId = process.env.PASS_TYPE_ID || 'pass.es.fidelapp.loyalty'
  const certsDir   = path.join(process.cwd(), 'certs')
  const certPass   = process.env.PASS_CERT_PASSWORD || ''

  // Get all registered devices for this customer
  const { data: registrations } = await supabase
    .from('pass_registrations')
    .select('push_token')
    .eq('serial_number', customerId)
    .eq('pass_type_id', passTypeId)

  if (!registrations || registrations.length === 0) return

  let cert: Buffer, key: Buffer
  try {
    cert = readFileSync(path.join(certsDir, 'signerCert.pem'))
    key  = readFileSync(path.join(certsDir, 'signerKey.pem'))
  } catch {
    console.error('[APNs] Could not load certs — push skipped')
    return
  }

  // Use APNs production endpoint (use api.development.push.apple.com for dev certs)
  const apnsHost = 'https://api.push.apple.com'

  const client = http2.connect(apnsHost, {
    cert,
    key,
    passphrase: certPass || undefined,
  })

  client.on('error', (err) => {
    console.error('[APNs] Connection error:', err.message)
  })

  const pushPromises = registrations.map(({ push_token }) =>
    new Promise<void>((resolve) => {
      const body = Buffer.from('{}')
      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${push_token}`,
        'apns-topic': passTypeId,
        'apns-push-type': 'background',
        'apns-priority': '5',
        'content-type': 'application/json',
        'content-length': body.length,
      })

      req.write(body)
      req.end()

      req.on('response', (headers) => {
        const status = headers[':status'] as number
        if (status !== 200) {
          let errBody = ''
          req.on('data', (chunk: Buffer) => { errBody += chunk.toString() })
          req.on('end', () => {
            console.error(`[APNs] Push failed for ${push_token}: ${status} ${errBody}`)
            resolve()
          })
        } else {
          resolve()
        }
      })

      req.on('error', (err) => {
        console.error(`[APNs] Request error for ${push_token}:`, err.message)
        resolve()
      })
    })
  )

  await Promise.all(pushPromises)
  client.close()
}
