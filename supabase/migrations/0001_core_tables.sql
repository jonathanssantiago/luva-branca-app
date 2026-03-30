-- =============================================================================
-- 0001_core_tables.sql
-- Todas as tabelas da aplicação + função utilitária handle_updated_at
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Função utilitária: atualiza updated_at em qualquer tabela
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  cpf         VARCHAR(14) UNIQUE,
  phone       TEXT,
  birth_date  DATE,
  gender      TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf   ON public.profiles(cpf);

COMMENT ON COLUMN public.profiles.cpf IS 'CPF do usuário no formato xxx.xxx.xxx-xx';

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- guardians
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guardians (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL CHECK (char_length(name) >= 2),
  phone        TEXT        NOT NULL CHECK (char_length(phone) >= 10),
  relationship TEXT        NOT NULL CHECK (char_length(relationship) >= 2),
  is_active    BOOLEAN     DEFAULT true,
  is_deleted   BOOLEAN     DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT phone_format    CHECK (phone ~ '^[\+]?[0-9\(\)\-\s]+$'),
  CONSTRAINT unique_user_phone UNIQUE (user_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_guardians_user_id     ON public.guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_user_active ON public.guardians(user_id, is_active);

COMMENT ON TABLE public.guardians IS 'Contatos de emergência dos usuários';

DROP TRIGGER IF EXISTS handle_guardians_updated_at ON public.guardians;
CREATE TRIGGER handle_guardians_updated_at
  BEFORE UPDATE ON public.guardians
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Limite: máximo de 5 guardiões ativos por usuário
CREATE OR REPLACE FUNCTION public.validate_guardians_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.guardians
    WHERE user_id = NEW.user_id AND is_active = true AND is_deleted = false
  ) >= 5 THEN
    RAISE EXCEPTION 'Usuário não pode ter mais de 5 guardiões ativos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_guardians_limit_trigger ON public.guardians;
CREATE TRIGGER validate_guardians_limit_trigger
  BEFORE INSERT ON public.guardians
  FOR EACH ROW EXECUTE FUNCTION public.validate_guardians_limit();

-- ---------------------------------------------------------------------------
-- safety_diary_entries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safety_diary_entries (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content     TEXT        NOT NULL CHECK (char_length(content) >= 1),
  location    TEXT,
  entry_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emotion     TEXT        CHECK (emotion IN (
                'happy','sad','angry','fearful','anxious','calm','worried','hopeful'
              )),
  tags        JSONB       DEFAULT '[]',
  images      JSONB       DEFAULT '[]',
  is_private  BOOLEAN     DEFAULT true,
  is_deleted  BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diary_user_id   ON public.safety_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_user_date ON public.safety_diary_entries(user_id, entry_date DESC);

COMMENT ON TABLE public.safety_diary_entries IS 'Diário de segurança — dados confidenciais';

DROP TRIGGER IF EXISTS handle_safety_diary_entries_updated_at ON public.safety_diary_entries;
CREATE TRIGGER handle_safety_diary_entries_updated_at
  BEFORE UPDATE ON public.safety_diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ---------------------------------------------------------------------------
-- audio_recordings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audio_recordings (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename   TEXT        NOT NULL,
  remote_url TEXT,
  duration   INTEGER     DEFAULT 0,
  is_deleted BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON public.audio_recordings(user_id);

COMMENT ON TABLE public.audio_recordings IS 'Metadados de gravações de áudio do usuário';

DROP TRIGGER IF EXISTS handle_audio_recordings_updated_at ON public.audio_recordings;
CREATE TRIGGER handle_audio_recordings_updated_at
  BEFORE UPDATE ON public.audio_recordings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename   TEXT        NOT NULL,
  remote_url TEXT,
  mime_type  TEXT        NOT NULL DEFAULT '',
  size       BIGINT      DEFAULT 0,
  is_deleted BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

COMMENT ON TABLE public.documents IS 'Metadados de documentos pessoais do usuário';

DROP TRIGGER IF EXISTS handle_documents_updated_at ON public.documents;
CREATE TRIGGER handle_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- emergency_alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message              TEXT        NOT NULL,
  location_lat         DOUBLE PRECISION,
  location_lng         DOUBLE PRECISION,
  guardians_json       JSONB       DEFAULT '[]',
  is_police_emergency  BOOLEAN     DEFAULT false,
  sent_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON public.emergency_alerts(user_id);

COMMENT ON TABLE public.emergency_alerts IS 'Alertas de emergência — append-only';

DROP TRIGGER IF EXISTS handle_emergency_alerts_updated_at ON public.emergency_alerts;
CREATE TRIGGER handle_emergency_alerts_updated_at
  BEFORE UPDATE ON public.emergency_alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- user_push_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_token  TEXT        NOT NULL,
  device_info JSONB       DEFAULT '{}',
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,

  UNIQUE (user_id, expo_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active  ON public.user_push_tokens(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS handle_user_push_tokens_updated_at ON public.user_push_tokens;
CREATE TRIGGER handle_user_push_tokens_updated_at
  BEFORE UPDATE ON public.user_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT ALL ON public.user_push_tokens TO authenticated;

-- ---------------------------------------------------------------------------
-- notification_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  target_tokens   TEXT[]      NOT NULL DEFAULT '{}',
  sent_count      INTEGER     DEFAULT 0,
  failed_count    INTEGER     DEFAULT 0,
  results         JSONB       DEFAULT '[]',
  metadata        JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sender     ON public.notification_logs(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);

GRANT INSERT, SELECT ON public.notification_logs TO authenticated;
