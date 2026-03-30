-- =============================================================================
-- 0003_rls.sql
-- Row-Level Security para todas as tabelas públicas.
-- Padrão: usuário só acessa suas próprias linhas.
-- Exceção: profiles.SELECT é público (permite exibição de nomes/avatares).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"     ON public.profiles;

CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- guardians
-- ---------------------------------------------------------------------------
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guardians_select_own"  ON public.guardians;
DROP POLICY IF EXISTS "guardians_insert_own"  ON public.guardians;
DROP POLICY IF EXISTS "guardians_update_own"  ON public.guardians;
DROP POLICY IF EXISTS "guardians_delete_own"  ON public.guardians;

CREATE POLICY "guardians_select_own" ON public.guardians
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "guardians_insert_own" ON public.guardians
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guardians_update_own" ON public.guardians
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "guardians_delete_own" ON public.guardians
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- safety_diary_entries
-- ---------------------------------------------------------------------------
ALTER TABLE public.safety_diary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diary_select_own"  ON public.safety_diary_entries;
DROP POLICY IF EXISTS "diary_insert_own"  ON public.safety_diary_entries;
DROP POLICY IF EXISTS "diary_update_own"  ON public.safety_diary_entries;
DROP POLICY IF EXISTS "diary_delete_own"  ON public.safety_diary_entries;

CREATE POLICY "diary_select_own" ON public.safety_diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "diary_insert_own" ON public.safety_diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "diary_update_own" ON public.safety_diary_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "diary_delete_own" ON public.safety_diary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- audio_recordings
-- ---------------------------------------------------------------------------
ALTER TABLE public.audio_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audio_select_own"  ON public.audio_recordings;
DROP POLICY IF EXISTS "audio_insert_own"  ON public.audio_recordings;
DROP POLICY IF EXISTS "audio_update_own"  ON public.audio_recordings;
DROP POLICY IF EXISTS "audio_delete_own"  ON public.audio_recordings;

CREATE POLICY "audio_select_own" ON public.audio_recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "audio_insert_own" ON public.audio_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audio_update_own" ON public.audio_recordings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audio_delete_own" ON public.audio_recordings
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs_select_own"  ON public.documents;
DROP POLICY IF EXISTS "docs_insert_own"  ON public.documents;
DROP POLICY IF EXISTS "docs_update_own"  ON public.documents;
DROP POLICY IF EXISTS "docs_delete_own"  ON public.documents;

CREATE POLICY "docs_select_own" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "docs_insert_own" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "docs_update_own" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "docs_delete_own" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- emergency_alerts (append-only para o usuário dono)
-- ---------------------------------------------------------------------------
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts_select_own"  ON public.emergency_alerts;
DROP POLICY IF EXISTS "alerts_insert_own"  ON public.emergency_alerts;

CREATE POLICY "alerts_select_own" ON public.emergency_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alerts_insert_own" ON public.emergency_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_push_tokens
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_select_own"  ON public.user_push_tokens;
DROP POLICY IF EXISTS "push_tokens_insert_own"  ON public.user_push_tokens;
DROP POLICY IF EXISTS "push_tokens_update_own"  ON public.user_push_tokens;
DROP POLICY IF EXISTS "push_tokens_delete_own"  ON public.user_push_tokens;

CREATE POLICY "push_tokens_select_own" ON public.user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_insert_own" ON public.user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_update_own" ON public.user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_delete_own" ON public.user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notification_logs
-- ---------------------------------------------------------------------------
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_logs_insert_auth"   ON public.notification_logs;
DROP POLICY IF EXISTS "notif_logs_select_own"    ON public.notification_logs;

-- Edge functions inserem logs em nome de qualquer usuário autenticado
CREATE POLICY "notif_logs_insert_auth" ON public.notification_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notif_logs_select_own" ON public.notification_logs
  FOR SELECT USING (auth.uid() = sender_user_id);
