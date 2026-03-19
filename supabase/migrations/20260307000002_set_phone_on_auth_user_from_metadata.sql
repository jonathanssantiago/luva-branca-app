-- Garante que o campo phone da tabela auth.users seja preenchido
-- a partir de raw_user_meta_data->>'phone' quando o cadastro é feito por e-mail.
-- Isso ocorre porque o Supabase Auth só define auth.users.phone quando o fluxo
-- de cadastro é por SMS/telefone; no fluxo por e-mail o campo fica NULL.
--
-- NOTA: A função é criada no schema public (não em auth) porque migrações
-- executadas pela CLI não possuem permissão para criar objetos no schema auth.

CREATE OR REPLACE FUNCTION public.auth_set_phone_from_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Só preenche se phone não veio definido no sign-up e está presente nos metadados
  IF (NEW.phone IS NULL OR NEW.phone = '')
     AND NEW.raw_user_meta_data->>'phone' IS NOT NULL
     AND NEW.raw_user_meta_data->>'phone' <> ''
  THEN
    NEW.phone := NEW.raw_user_meta_data->>'phone';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger caso já exista para permitir recriação sem erro
DROP TRIGGER IF EXISTS before_insert_set_phone ON auth.users;

CREATE TRIGGER before_insert_set_phone
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auth_set_phone_from_metadata();
