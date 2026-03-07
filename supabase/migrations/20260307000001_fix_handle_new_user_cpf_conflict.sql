-- Fix: tornar o trigger handle_new_user resiliente a violações de unicidade do CPF.
-- Quando o CPF já existe em outro perfil, o trigger levanta uma exceção
-- descritiva em vez de um erro genérico 500.

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
    -- Re-lançar exceções customizadas (cpf_already_registered, etc.)
    RAISE;
  WHEN unique_violation THEN
    RAISE EXCEPTION 'profile_unique_violation'
      USING HINT = 'Já existe um cadastro com esses dados.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
