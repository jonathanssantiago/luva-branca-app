-- Criar bucket de áudios para gravações de emergência
-- Esta migração cria o bucket necessário para armazenar gravações de áudio dos usuários

-- Inserir bucket de audios se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audios',
  'audios',
  false, -- Privado para maior segurança
  52428800, -- 50MB em bytes (gravações podem ser maiores)
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/m4a', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas específicas para áudios de emergência
-- Usuários podem visualizar apenas seus próprios áudios
CREATE POLICY "Users can view their own audios" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audios' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Usuários podem fazer upload apenas em suas próprias pastas
CREATE POLICY "Users can upload their own audios" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audios' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Usuários podem atualizar apenas seus próprios áudios
CREATE POLICY "Users can update their own audios" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audios' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Usuários podem deletar apenas seus próprios áudios
CREATE POLICY "Users can delete their own audios" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audios' 
  AND auth.role() = 'authenticated'
  AND (SELECT auth.uid()::text) = (string_to_array(name, '/'))[1]
);

-- Verificar se o bucket foi criado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'audios') THEN
    RAISE EXCEPTION 'Falha ao criar bucket audios';
  END IF;
  
  RAISE NOTICE 'Bucket de áudios criado com sucesso: audios';
END $$; 