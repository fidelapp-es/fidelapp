import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { pushPassUpdate } from '@/lib/wallet/apns'
import { Resend } from 'resend'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  if (body.status === 'sent') {
    // Get full campaign to know its type and message
    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).single()
    const segment = body.segment || campaign?.segment || 'all'
    const type    = campaign?.type || 'push'

    const customers = await getSegmentCustomers(supabase, segment)
    body.sent_count = customers.length
    body.sent_at    = new Date().toISOString()

    if (type === 'push') {
      // Write campaign message to each customer's last_promo_message so iOS shows
      // a visible lock-screen notification when the pass field changes
      ;(async () => {
        const ids = customers.map(c => c.id)
        await supabase
          .from('customers')
          .update({ last_promo_message: campaign?.message, updated_at: new Date().toISOString() })
          .in('id', ids)

        const results = await Promise.allSettled(customers.map(c => pushPassUpdate(c.id)))
        const ok  = results.filter(r => r.status === 'fulfilled').length
        const err = results.filter(r => r.status === 'rejected').length
        console.log(`[Campaign push] Sent: ${ok}, Failed: ${err}`)
      })()
    } else if (type === 'email') {
      const apiKey = process.env.RESEND_API_KEY
      if (apiKey) {
        const { data: settings } = await supabase
          .from('settings').select('business_name, business_email').eq('id', user.id).maybeSingle()
        const fromName  = settings?.business_name || 'Fidelapp'
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@fidelapp.es'

        ;(async () => {
          const resend = new Resend(apiKey)
          const withEmail = customers.filter(c => c.email)
          const results = await Promise.allSettled(withEmail.map(c =>
            resend.emails.send({
              from: `${fromName} <${fromEmail}>`,
              to:   c.email,
              subject: campaign?.title || 'Mensaje de tu tarjeta de fidelización',
              html: buildEmailHtml(c.name, campaign?.message || '', fromName),
            })
          ))
          const ok  = results.filter(r => r.status === 'fulfilled').length
          const err = results.filter(r => r.status === 'rejected').length
          console.log(`[Campaign email] Sent: ${ok}, Failed: ${err}`)
        })()

        body.sent_count = customers.filter(c => c.email).length
      } else {
        console.warn('[Campaign email] RESEND_API_KEY not configured')
      }
    }
  }

  const { data, error } = await supabase.from('campaigns').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await supabase.from('campaigns').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

async function getSegmentCustomers(supabase: any, segment: string): Promise<{ id: string; email: string; name: string }[]> {
  let q = supabase.from('customers').select('id, email, name')
  if (segment === 'vip')      q = q.gte('points', 200)
  else if (segment === 'oro') q = q.gte('points', 100).lt('points', 200)
  else if (segment === 'new') q = q.lt('points', 20)
  else if (segment === 'inactive') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    q = q.lt('updated_at', cutoff)
  }
  const { data } = await q
  return data ?? []
}

function buildEmailHtml(name: string, message: string, businessName: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto">
    <tr><td style="background:#1a1a2e;border-radius:20px 20px 0 0;padding:32px 32px 24px;text-align:center">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0">${businessName}</p>
      <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:4px 0 0">Tarjeta de fidelización</p>
    </td></tr>
    <tr><td style="background:#fff;padding:32px">
      <p style="color:#1a1a2e;font-size:16px;font-weight:600;margin:0 0 12px">Hola ${name},</p>
      <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px">${message}</p>
      <p style="color:#888;font-size:12px;margin:0">Has recibido este mensaje porque tienes una tarjeta de fidelización de <strong>${businessName}</strong>.</p>
    </td></tr>
    <tr><td style="background:#f5f5f7;border-radius:0 0 20px 20px;padding:20px;text-align:center">
      <p style="color:#aaa;font-size:11px;margin:0">Powered by Fidelapp</p>
    </td></tr>
  </table>
</body>
</html>`
}
