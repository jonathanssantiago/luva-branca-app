-- Criação completa da tabela de perfis para cadastro de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  cpf VARCHAR(14) UNIQUE,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- Comentários
COMMENT ON COLUMN public.profiles.cpf IS 'CPF do usuário no formato xxx.xxx.xxx-xx';
COMMENT ON COLUMN public.profiles.email IS 'Email do usuário';

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Perfis são visíveis publicamente" ON public.profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Usuários podem deletar seu próprio perfil" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
