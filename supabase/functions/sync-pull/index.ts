/**
 * Edge Function: sync-pull
 *
 * Retorna todos os dados do usuário autenticado modificados após `since`
 * (timestamp em milissegundos Unix). Também inclui o perfil atualizado.
 *
 * GET /functions/v1/sync-pull?since=<ms_timestamp>
 *
 * Resposta (PullSyncResponse):
 * {
 *   serverTime: number,
 *   profile: object | null,
 *   guardians: object[],
 *   diary_entries: object[],
 *   audio_recordings: object[],
 *   documents: object[],
 *   deleted_ids: {
 *     guardians: string[],
 *     diary_entries: string[]
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Autenticação
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Parâmetro ?since=<ms>
  const url = new URL(req.url)
  const sinceMs = parseInt(url.searchParams.get('since') ?? '0', 10)
  const sinceTs = new Date(sinceMs).toISOString()

  try {
    // Busca paralela de todas as entidades
    const [
      profileRes,
      guardiansRes,
      diaryRes,
      audioRes,
      docsRes,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase
        .from('guardians')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', sinceTs),
      supabase
        .from('safety_diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', sinceTs),
      supabase
        .from('audio_recordings')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', sinceTs),
      supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', sinceTs),
    ])

    if (guardiansRes.error) throw guardiansRes.error
    if (diaryRes.error) throw diaryRes.error
    if (audioRes.error) throw audioRes.error
    if (docsRes.error) throw docsRes.error

    // Registros marcados como deletados (soft-delete)
    const deletedGuardians = (guardiansRes.data ?? [])
      .filter((r: Record<string, unknown>) => r.is_deleted)
      .map((r: Record<string, unknown>) => r.id as string)

    const deletedDiary = (diaryRes.data ?? [])
      .filter((r: Record<string, unknown>) => r.is_deleted)
      .map((r: Record<string, unknown>) => r.id as string)

    const activeGuardians = (guardiansRes.data ?? []).filter(
      (r: Record<string, unknown>) => !r.is_deleted,
    )
    const activeDiary = (diaryRes.data ?? []).filter(
      (r: Record<string, unknown>) => !r.is_deleted,
    )
    const activeAudio = (audioRes.data ?? []).filter(
      (r: Record<string, unknown>) => !r.is_deleted,
    )
    const activeDocs = (docsRes.data ?? []).filter(
      (r: Record<string, unknown>) => !r.is_deleted,
    )

    const response = {
      serverTime: Date.now(),
      profile: profileRes.data ?? null,
      guardians: activeGuardians,
      diary_entries: activeDiary,
      audio_recordings: activeAudio,
      documents: activeDocs,
      deleted_ids: {
        guardians: deletedGuardians,
        diary_entries: deletedDiary,
      },
    }

    return json(response, 200)
  } catch (error) {
    console.error('[sync-pull] error:', error)
    return json({ error: 'Internal server error', details: (error as Error).message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
