-- Crear bucket para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede leer (para mostrar el logo)
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Política: cualquiera puede subir (app sin auth de usuario)
DROP POLICY IF EXISTS "logos_public_insert" ON storage.objects;
CREATE POLICY "logos_public_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos');

-- Política: cualquiera puede actualizar
DROP POLICY IF EXISTS "logos_public_update" ON storage.objects;
CREATE POLICY "logos_public_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos');

-- Política: cualquiera puede borrar
DROP POLICY IF EXISTS "logos_public_delete" ON storage.objects;
CREATE POLICY "logos_public_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos');
