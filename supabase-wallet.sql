-- ── Apple Wallet: PassKit Web Service ──────────────────────────────────────────
-- Ejecuta este script en Supabase → SQL Editor

-- ── 1. Columnas que faltan en customers ───────────────────────────────────────

-- auth_token: token único por cliente para autenticar llamadas del PassKit Web Service
-- (iOS lo incluye en la cabecera "Authorization: ApplePass <token>" al registrar el dispositivo)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS auth_token UUID DEFAULT gen_random_uuid();

UPDATE customers SET auth_token = gen_random_uuid() WHERE auth_token IS NULL;

-- updated_at: timestamp para saber qué passes han cambiado desde la última sync de iOS
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger para actualizar updated_at automáticamente al modificar el cliente
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_customer_updated_at();

-- ── 2. Columnas que faltan en settings ────────────────────────────────────────

-- custom_mode y custom_accent: tema visual por negocio (sincronizado entre dispositivos)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS custom_mode   TEXT DEFAULT 'dark';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS custom_accent TEXT DEFAULT '#C8873A';

-- Diseño del Apple Wallet pass
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS wallet_bg_color    TEXT DEFAULT '#F0E8D8';  -- cuerpo de la tarjeta (beige)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS wallet_fg_color    TEXT DEFAULT '#2A1008';  -- texto principal (marrón oscuro)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS wallet_label_color TEXT;                     -- color etiquetas (null = usar accent)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS wallet_strip_color TEXT;                     -- color banda superior (null = usar accent)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS wallet_logo_url    TEXT;                     -- logo para la wallet (null = usar logo_url)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS wallet_strip_url   TEXT;                     -- imagen banner personalizada (sobreescribe la generada)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS wallet_header      TEXT;                     -- texto en la banda (null = business_name)

-- ── 3. Tabla pass_registrations ───────────────────────────────────────────────
-- Almacena los dispositivos iOS que tienen instalada la tarjeta de un cliente.
-- Apple llama a nuestro endpoint con el push_token de APNs al añadir la tarjeta.
-- Nosotros usamos ese push_token para avisar a iOS cuando cambian los sellos/puntos.

CREATE TABLE IF NOT EXISTS pass_registrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_library_id TEXT NOT NULL,
  push_token        TEXT NOT NULL,
  serial_number     TEXT NOT NULL,   -- = customer.id
  pass_type_id      TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (device_library_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_pass_reg_serial
  ON pass_registrations (serial_number);

CREATE INDEX IF NOT EXISTS idx_pass_reg_device
  ON pass_registrations (device_library_id, pass_type_id);
