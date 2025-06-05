-- Criar buckets de storage para o aplicativo Luva Branca
-- Esta migração cria os buckets necessários para armazenar imagens dos usuários

-- Inserir bucket de avatars se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Inserir bucket de images se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB em bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se os buckets foram criados
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE EXCEPTION 'Falha ao criar bucket avatars';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'images') THEN
    RAISE EXCEPTION 'Falha ao criar bucket images';
  END IF;
  
  RAISE NOTICE 'Buckets de storage criados com sucesso: avatars, images';
END $$;
