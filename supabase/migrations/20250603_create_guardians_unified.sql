-- Criação da tabela de guardiões (versão simplificada)
-- Esta tabela armazena os contatos de emergência dos usuários
-- Estrutura simplificada: apenas nome, telefone/WhatsApp e parentesco

CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  phone TEXT NOT NULL CHECK (char_length(phone) >= 10),
  relationship TEXT NOT NULL CHECK (char_length(relationship) >= 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT phone_format CHECK (phone ~ '^[\+]?[0-9\(\)\-\s]+$'),
  CONSTRAINT unique_user_phone UNIQUE(user_id, phone)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON public.guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_user_active ON public.guardians(user_id, is_active);

-- Comentários
COMMENT ON TABLE public.guardians IS 'Contatos de emergência dos usuários - estrutura simplificada';
COMMENT ON COLUMN public.guardians.user_id IS 'ID do usuário proprietário do guardião';
COMMENT ON COLUMN public.guardians.name IS 'Nome completo do guardião';
COMMENT ON COLUMN public.guardians.phone IS 'Telefone/WhatsApp do guardião (mesmo número para ambos)';
COMMENT ON COLUMN public.guardians.relationship IS 'Relação com o usuário (mãe, pai, amiga, etc.) - obrigatório';
COMMENT ON COLUMN public.guardians.is_active IS 'Se o guardião está ativo para receber alertas';

-- Função para atualizar updated_at (assumindo que já existe no sistema)
CREATE TRIGGER handle_guardians_updated_at
  BEFORE UPDATE ON public.guardians
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuários podem ver seus próprios guardiões" ON public.guardians;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios guardiões" ON public.guardians;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios guardiões" ON public.guardians;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios guardiões" ON public.guardians;

-- Policies
CREATE POLICY "Usuários podem ver seus próprios guardiões" 
  ON public.guardians FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios guardiões" 
  ON public.guardians FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios guardiões" 
  ON public.guardians FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios guardiões" 
  ON public.guardians FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para validar limite de guardiões (máximo 5 por usuário)
CREATE OR REPLACE FUNCTION public.validate_guardians_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o usuário já tem 5 guardiões ativos
  IF (SELECT COUNT(*) FROM public.guardians 
      WHERE user_id = NEW.user_id 
      AND is_active = true) >= 5 THEN
    RAISE EXCEPTION 'Usuário não pode ter mais de 5 guardiões ativos';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar limite antes de inserir
CREATE TRIGGER validate_guardians_limit_trigger
  BEFORE INSERT ON public.guardians
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_guardians_limit();
