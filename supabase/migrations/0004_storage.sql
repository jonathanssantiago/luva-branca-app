-- =============================================================================
-- 0004_storage.sql
-- Buckets do Supabase Storage e suas políticas RLS.
-- Ordem correta: criar bucket ANTES de criar as políticas.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Buckets públicos: avatars, images
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true,
  5242880, -- 5 MB
  ARRAY['image/png','image/jpeg','image/jpg','image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 'images', true,
  10485760, -- 10 MB
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Políticas: avatars
DROP POLICY IF EXISTS "avatars_select_public"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_auth"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_auth"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_auth"    ON storage.objects;

CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_update_auth" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_delete_auth" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Políticas: images
DROP POLICY IF EXISTS "images_select_public"  ON storage.objects;
DROP POLICY IF EXISTS "images_insert_auth"    ON storage.objects;
DROP POLICY IF EXISTS "images_update_auth"    ON storage.objects;
DROP POLICY IF EXISTS "images_delete_auth"    ON storage.objects;

CREATE POLICY "images_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "images_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "images_update_auth" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "images_delete_auth" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Buckets privados: audios, documentos, diary-photos
-- RLS: apenas o dono acessa (primeiro segmento do path = auth.uid())
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audios', 'audios', false,
  52428800, -- 50 MB
  ARRAY['audio/mpeg','audio/mp3','audio/mp4','audio/wav','audio/m4a','audio/aac']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos', 'documentos', false,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg','image/png','image/webp','image/heic','image/tiff',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diary-photos', 'diary-photos', false,
  10485760, -- 10 MB
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Helper: verifica que o primeiro segmento do path corresponde ao uid do usuário
-- Funciona tanto com storage.foldername() quanto com string_to_array(name, '/')
-- Usamos (storage.foldername(name))[1] que é a abordagem recomendada pelo Supabase.

-- Políticas: audios
DROP POLICY IF EXISTS "audios_select_own"  ON storage.objects;
DROP POLICY IF EXISTS "audios_insert_own"  ON storage.objects;
DROP POLICY IF EXISTS "audios_update_own"  ON storage.objects;
DROP POLICY IF EXISTS "audios_delete_own"  ON storage.objects;

CREATE POLICY "audios_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audios_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audios_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'audios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audios_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Políticas: documentos
DROP POLICY IF EXISTS "documentos_select_own"  ON storage.objects;
DROP POLICY IF EXISTS "documentos_insert_own"  ON storage.objects;
DROP POLICY IF EXISTS "documentos_update_own"  ON storage.objects;
DROP POLICY IF EXISTS "documentos_delete_own"  ON storage.objects;

CREATE POLICY "documentos_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documentos_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documentos_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documentos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Políticas: diary-photos
DROP POLICY IF EXISTS "diary_photos_select_own"  ON storage.objects;
DROP POLICY IF EXISTS "diary_photos_insert_own"  ON storage.objects;
DROP POLICY IF EXISTS "diary_photos_update_own"  ON storage.objects;
DROP POLICY IF EXISTS "diary_photos_delete_own"  ON storage.objects;

CREATE POLICY "diary_photos_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'diary-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "diary_photos_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'diary-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "diary_photos_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'diary-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "diary_photos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'diary-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
