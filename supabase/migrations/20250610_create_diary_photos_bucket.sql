-- Criar bucket de fotos do diário de segurança
-- Este bucket armazena fotos de evidência de situações descritas no diário

-- Inserir bucket de diary-photos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diary-photos',
  'diary-photos',
  false, -- Privado para máxima segurança
  10485760, -- 10MB em bytes por imagem
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas específicas para fotos do diário
-- Usuárias podem visualizar apenas suas próprias fotos
CREATE POLICY "Users can view their own diary photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'diary-photos' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Usuárias podem fazer upload apenas em suas próprias pastas
CREATE POLICY "Users can upload their own diary photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'diary-photos' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Usuárias podem atualizar apenas suas próprias fotos
CREATE POLICY "Users can update their own diary photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'diary-photos' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Usuárias podem deletar apenas suas próprias fotos
CREATE POLICY "Users can delete their own diary photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'diary-photos' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Verificar se o bucket foi criado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'diary-photos') THEN
    RAISE EXCEPTION 'Falha ao criar bucket diary-photos';
  END IF;
  
  RAISE NOTICE 'Bucket diary-photos criado com sucesso';
END $$;
