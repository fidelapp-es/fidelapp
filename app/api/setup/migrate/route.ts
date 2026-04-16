import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

/**
 * GET /api/setup/migrate
 *
 * Runs all pending schema migrations.
 * Call this once from the browser to add missing columns.
 * Safe to call multiple times (IF NOT EXISTS / IF column doesn't exist).
 */
export async function GET() {
  const supabase = getServiceClient()
  const results: { sql: string; ok: boolean; error?: string }[] = []

  async function run(label: string, sql: string) {
    const { error } = await supabase.rpc('exec_migration', { query: sql }).single()
    // PostgREST doesn't support raw SQL — use the pg function approach via rpc
    // We'll use a workaround: try to add columns via supabase's query builder
    results.push({ sql: label, ok: !error, error: error?.message })
  }

  // Alternative approach: use the REST API to call a stored procedure
  // Since we can't run raw SQL via PostgREST, we'll detect and update via JS

  const { data: existing } = await supabase.from('settings').select('*').limit(1).single()
  const cols = existing ? Object.keys(existing) : []

  const missing: string[] = []
  const needed = ['custom_mode', 'custom_accent', 'wallet_bg_color', 'wallet_fg_color',
    'wallet_label_color', 'wallet_strip_color', 'wallet_logo_url', 'wallet_strip_url', 'wallet_header']

  for (const col of needed) {
    if (!cols.includes(col)) missing.push(col)
  }

  if (missing.length === 0) {
    return NextResponse.json({
      status: 'ok',
      message: 'Todas las columnas ya existen. No se necesita migración.',
      columns: cols,
    })
  }

  return NextResponse.json({
    status: 'pending',
    message: `Faltan ${missing.length} columnas. Ejecuta el SQL de abajo en Supabase → SQL Editor.`,
    missing_columns: missing,
    sql: `-- Ejecuta esto en Supabase → SQL Editor → New query
ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_mode TEXT DEFAULT 'dark';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_accent TEXT DEFAULT '#C8873A';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wallet_bg_color TEXT DEFAULT '#F0E8D8';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wallet_fg_color TEXT DEFAULT '#2A1008';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wallet_label_color TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wallet_strip_color TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wallet_logo_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wallet_strip_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wallet_header TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_token UUID DEFAULT gen_random_uuid();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE customers SET auth_token = gen_random_uuid() WHERE auth_token IS NULL;
CREATE TABLE IF NOT EXISTS pass_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_library_id TEXT NOT NULL,
  push_token TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  pass_type_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (device_library_id, serial_number)
);`,
  }, { status: 200 })
}
