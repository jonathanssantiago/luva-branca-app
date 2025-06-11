-- Criar tabela de entradas do diário de segurança
-- Esta tabela armazena entradas confidenciais de situações de risco da usuária

CREATE TABLE IF NOT EXISTS public.safety_diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) >= 1),
  location TEXT,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  emotion TEXT CHECK (emotion IN ('happy', 'sad', 'angry', 'fearful', 'anxious', 'calm', 'worried', 'hopeful')),
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}', -- URLs das imagens no storage
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_tags_length CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10),
  CONSTRAINT valid_images_length CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_safety_diary_entries_user_id ON public.safety_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_diary_entries_user_date ON public.safety_diary_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_safety_diary_entries_user_private ON public.safety_diary_entries(user_id, is_private);

-- Comentários
COMMENT ON TABLE public.safety_diary_entries IS 'Entradas do diário de segurança das usuárias - dados confidenciais';
COMMENT ON COLUMN public.safety_diary_entries.user_id IS 'ID da usuária proprietária da entrada';
COMMENT ON COLUMN public.safety_diary_entries.title IS 'Título da entrada do diário';
COMMENT ON COLUMN public.safety_diary_entries.content IS 'Relato detalhado da situação';
COMMENT ON COLUMN public.safety_diary_entries.location IS 'Local onde ocorreu a situação (opcional)';
COMMENT ON COLUMN public.safety_diary_entries.entry_date IS 'Data e hora da situação descrita';
COMMENT ON COLUMN public.safety_diary_entries.emotion IS 'Emoção sentida durante a situação';
COMMENT ON COLUMN public.safety_diary_entries.tags IS 'Tags para categorização (máx 10)';
COMMENT ON COLUMN public.safety_diary_entries.images IS 'URLs das imagens de evidência (máx 5)';
COMMENT ON COLUMN public.safety_diary_entries.is_private IS 'Se a entrada é privada (padrão: true)';

-- Função para atualizar updated_at
CREATE TRIGGER handle_safety_diary_entries_updated_at
  BEFORE UPDATE ON public.safety_diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS (Row Level Security) - segurança máxima
ALTER TABLE public.safety_diary_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuárias podem ver apenas suas próprias entradas" ON public.safety_diary_entries;
DROP POLICY IF EXISTS "Usuárias podem inserir suas próprias entradas" ON public.safety_diary_entries;
DROP POLICY IF EXISTS "Usuárias podem atualizar suas próprias entradas" ON public.safety_diary_entries;
DROP POLICY IF EXISTS "Usuárias podem deletar suas próprias entradas" ON public.safety_diary_entries;

-- Políticas de segurança restritivas
CREATE POLICY "Usuárias podem ver apenas suas próprias entradas" 
  ON public.safety_diary_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuárias podem inserir suas próprias entradas" 
  ON public.safety_diary_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuárias podem atualizar suas próprias entradas" 
  ON public.safety_diary_entries FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuárias podem deletar suas próprias entradas" 
  ON public.safety_diary_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para validar limite de entradas por usuária (máximo 100 entradas)
CREATE OR REPLACE FUNCTION public.validate_diary_entries_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a usuária já tem 100 entradas
  IF (SELECT COUNT(*) FROM public.safety_diary_entries 
      WHERE user_id = NEW.user_id) >= 100 THEN
    RAISE EXCEPTION 'Usuária não pode ter mais de 100 entradas no diário';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar limite antes de inserir
CREATE TRIGGER validate_diary_entries_limit_trigger
  BEFORE INSERT ON public.safety_diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_diary_entries_limit();

-- Verificar se a tabela foi criada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'safety_diary_entries') THEN
    RAISE EXCEPTION 'Falha ao criar tabela safety_diary_entries';
  END IF;
  
  RAISE NOTICE 'Tabela safety_diary_entries criada com sucesso';
END $$;
