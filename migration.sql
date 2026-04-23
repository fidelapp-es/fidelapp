-- ============================================================
-- MIGRACIÓN: Añadir owner_id a tablas y ajustar settings
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Tabla customers: añadir owner_id
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Tabla visits: añadir owner_id
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Tabla promotions: añadir owner_id (puede que ya exista)
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Tabla settings: asegurarse de que el id puede ser el UUID del usuario de auth
--    (normalmente ya es UUID, esto solo garantiza que no haya restricción extra)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Índices para que las búsquedas por owner_id sean rápidas
CREATE INDEX IF NOT EXISTS idx_customers_owner_id  ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_visits_owner_id     ON visits(owner_id);
CREATE INDEX IF NOT EXISTS idx_promotions_owner_id ON promotions(owner_id);
CREATE INDEX IF NOT EXISTS idx_settings_owner_id   ON settings(owner_id);
