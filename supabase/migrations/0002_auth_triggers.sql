-- =============================================================================
-- 0002_auth_triggers.sql
-- Triggers de autenticação: criação automática de perfil e cópia de telefone
-- =============================================================================

-- ---------------------------------------------------------------------------
-- handle_new_user
-- Popula public.profiles no INSERT de auth.users.
-- Detecta CPF duplicado com erro descritivo.
-- Usa ON CONFLICT (id) DO UPDATE para ser idempotente.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_id UUID;
BEGIN
  -- Verifica se o CPF já está em uso por outro usuário
  IF NEW.raw_user_meta_data->>'cpf' IS NOT NULL THEN
    SELECT id INTO existing_id
    FROM public.profiles
    WHERE cpf = NEW.raw_user_meta_data->>'cpf'
      AND id <> NEW.id;

    IF FOUND THEN
      RAISE EXCEPTION 'cpf_already_registered'
        USING HINT = 'Este CPF já está cadastrado no sistema.';
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    birth_date,
    gender,
    cpf
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    CASE
      WHEN NEW.raw_user_meta_data->>'birth_date' ~ '^\d{4}-\d{2}-\d{2}$'
        THEN (NEW.raw_user_meta_data->>'birth_date')::DATE
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'cpf'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name,  profiles.full_name),
    email      = COALESCE(EXCLUDED.email,      profiles.email),
    phone      = COALESCE(EXCLUDED.phone,      profiles.phone),
    birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
    gender     = COALESCE(EXCLUDED.gender,     profiles.gender),
    cpf        = COALESCE(EXCLUDED.cpf,        profiles.cpf),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN
    -- Re-lança exceções customizadas (cpf_already_registered, etc.)
    RAISE;
  WHEN unique_violation THEN
    RAISE EXCEPTION 'profile_unique_violation'
      USING HINT = 'Já existe um cadastro com esses dados.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- auth_set_phone_from_metadata
-- Copia phone de raw_user_meta_data para auth.users.phone no cadastro por e-mail,
-- onde o Supabase Auth não preenche auth.users.phone automaticamente.
-- Criada no schema public pois migrações da CLI não têm permissão no schema auth.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_set_phone_from_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.phone IS NULL OR NEW.phone = '')
     AND NEW.raw_user_meta_data->>'phone' IS NOT NULL
     AND NEW.raw_user_meta_data->>'phone' <> ''
  THEN
    NEW.phone := NEW.raw_user_meta_data->>'phone';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_insert_set_phone ON auth.users;
CREATE TRIGGER before_insert_set_phone
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auth_set_phone_from_metadata();
