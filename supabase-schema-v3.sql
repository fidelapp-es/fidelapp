-- ═══════════════════════════════════════════════════════════════════
-- FIDELAPP — Schema v3: Multi-tenant (owner_id + RLS)
-- Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Columnas owner_id en todas las tablas ──────────────────────
ALTER TABLE customers  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE visits     ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE products   ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE campaigns  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE settings   ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 2. Columnas de color personalizadas (si aún no existen) ───────
ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_accent text DEFAULT '#C8873A';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_mode   text DEFAULT 'dark';

-- ── 3. Índices para rendimiento ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_owner  ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_visits_owner     ON visits(owner_id);
CREATE INDEX IF NOT EXISTS idx_promotions_owner ON promotions(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_owner   ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner  ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_settings_owner   ON settings(owner_id);

-- ── 4. Eliminar políticas públicas antiguas ───────────────────────
DROP POLICY IF EXISTS "customers_public_all"    ON customers;
DROP POLICY IF EXISTS "settings_public_read"    ON settings;
DROP POLICY IF EXISTS "settings_public_update"  ON settings;
DROP POLICY IF EXISTS "settings_public_insert"  ON settings;
DROP POLICY IF EXISTS "campaigns_public_all"    ON campaigns;

-- ── 5. Activar RLS en todas las tablas ───────────────────────────
ALTER TABLE customers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings   ENABLE ROW LEVEL SECURITY;

-- ── 6. Políticas RLS: dashboard autenticado ───────────────────────
-- Customers: el dueño gestiona sus clientes
DROP POLICY IF EXISTS "owner_select_customers" ON customers;
DROP POLICY IF EXISTS "owner_insert_customers" ON customers;
DROP POLICY IF EXISTS "owner_update_customers" ON customers;
DROP POLICY IF EXISTS "owner_delete_customers" ON customers;
CREATE POLICY "owner_select_customers" ON customers FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "owner_insert_customers" ON customers FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_update_customers" ON customers FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "owner_delete_customers" ON customers FOR DELETE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "owner_all_visits"     ON visits;
DROP POLICY IF EXISTS "owner_all_promotions" ON promotions;
DROP POLICY IF EXISTS "owner_all_products"   ON products;
DROP POLICY IF EXISTS "owner_all_campaigns"  ON campaigns;
DROP POLICY IF EXISTS "owner_all_settings"   ON settings;
CREATE POLICY "owner_all_visits"     ON visits     FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner_all_promotions" ON promotions FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner_all_products"   ON products   FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner_all_campaigns"  ON campaigns  FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner_all_settings"   ON settings   FOR ALL USING (owner_id = auth.uid());

-- ── 7. Política SERVICE KEY: páginas públicas (/cliente, /registro)
-- Las páginas públicas usan service role key (bypass RLS automático).
-- No se necesitan políticas adicionales — el service key las omite.

-- ── 8. MIGRACIÓN DE DATOS EXISTENTES ─────────────────────────────
-- IMPORTANTE: Después de registrarte como PYME en /register,
-- copia tu user ID de Supabase Auth → Authentication → Users
-- y ejecuta este bloque reemplazando 'TU_USER_ID':
--
-- UPDATE customers  SET owner_id = 'TU_USER_ID' WHERE owner_id IS NULL;
-- UPDATE visits     SET owner_id = 'TU_USER_ID' WHERE owner_id IS NULL;
-- UPDATE promotions SET owner_id = 'TU_USER_ID' WHERE owner_id IS NULL;
-- UPDATE products   SET owner_id = 'TU_USER_ID' WHERE owner_id IS NULL;
-- UPDATE campaigns  SET owner_id = 'TU_USER_ID' WHERE owner_id IS NULL;
-- UPDATE settings   SET owner_id = 'TU_USER_ID' WHERE owner_id IS NULL;
