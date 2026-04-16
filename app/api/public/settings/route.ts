import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { parseThemeConfig } from '@/lib/themeConfig'

export async function GET() {
  const sb = getServiceClient()
  const { data, error } = await sb
    .from('settings')
    .select('business_name, logo_url, card_type, theme, stamps_required, stamps_reward, points_per_euro, cashback_percent')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  }

  const cfg = parseThemeConfig(data.theme)

  return NextResponse.json({
    business_name:    data.business_name || 'Fidelapp',
    logo_url:         data.logo_url || null,
    card_type:        data.card_type || 'points',
    theme:            data.theme,           // raw JSON for client-side parseThemeConfig
    custom_accent:    cfg.accent,           // convenience shortcut
    custom_mode:      cfg.mode,             // convenience shortcut
    stamps_required:  data.stamps_required || 10,
    stamps_reward:    data.stamps_reward   || '',
    points_per_euro:  data.points_per_euro || 1,
    cashback_percent: data.cashback_percent || 5,
  })
}
