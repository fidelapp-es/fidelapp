-- ═══════════════════════════════════════════════════════════════
-- FIDELAPP — Schema v2 (solo tablas nuevas, sin tocar customers)
-- ═══════════════════════════════════════════════════════════════

-- ── Settings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text DEFAULT 'Mi Negocio',
  business_description text DEFAULT '',
  business_address text DEFAULT '',
  business_phone text DEFAULT '',
  business_email text DEFAULT '',
  logo_url text DEFAULT '',
  card_type text DEFAULT 'points' CHECK (card_type IN ('points', 'cashback', 'stamps')),
  points_per_euro numeric DEFAULT 1,
  cashback_percent numeric DEFAULT 5,
  stamps_required int DEFAULT 10,
  stamps_reward text DEFAULT 'Producto gratis',
  geo_lat numeric,
  geo_lng numeric,
  geo_radius_meters int DEFAULT 500,
  geo_message text DEFAULT '¡Estás cerca! Ven a visitarnos.',
  geo_enabled boolean DEFAULT false,
  theme text DEFAULT 'dark',
  billing_name text DEFAULT '',
  billing_cif text DEFAULT '',
  billing_address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── Campaigns ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'push' CHECK (type IN ('push', 'email', 'sms')),
  segment text DEFAULT 'all' CHECK (segment IN ('all', 'vip', 'oro', 'new', 'inactive')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
  sent_count int DEFAULT 0,
  open_count int DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── RLS settings (borrar antes por si ya existen) ────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public_read" ON settings;
DROP POLICY IF EXISTS "settings_public_update" ON settings;
DROP POLICY IF EXISTS "settings_public_insert" ON settings;
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_public_update" ON settings FOR UPDATE USING (true);
CREATE POLICY "settings_public_insert" ON settings FOR INSERT WITH CHECK (true);

-- ── RLS campaigns ─────────────────────────────────────────────
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_public_all" ON campaigns;
CREATE POLICY "campaigns_public_all" ON campaigns FOR ALL USING (true);

-- ── Nuevas columnas en customers ──────────────────────────────
ALTER TABLE customers ADD COLUMN IF NOT EXISTS visits_count int DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cashback_balance numeric DEFAULT 0;

-- ── Función updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
