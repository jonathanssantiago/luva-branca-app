/**
 * Edge Function: sync-push
 *
 * Processa uma operação de escrita (create / update / delete) para uma entidade
 * da fila de sincronização local (WatermelonDB sync_queue).
 *
 * POST /functions/v1/sync-push
 * Body: { entityType, operation, payload, remoteId? }
 *
 * entityType | operations suportadas
 * -----------|-------------------------------------
 * guardians        | create, update, delete (soft)
 * diary-entries    | create, update, delete (soft)
 * profiles         | create (upsert)
 * audio-recordings | create, delete
 * documents        | create, delete
 * emergency-alerts | create
 *
 * Resposta de sucesso: { id, ...camposDoRegistro }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncPushBody {
  entityType: string
  operation: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  remoteId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
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

  let body: SyncPushBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { entityType, operation, payload, remoteId } = body

  if (!entityType || !operation || !payload) {
    return json({ error: 'entityType, operation and payload are required' }, 400)
  }

  // Garante que o payload sempre carrega o user_id do token autenticado
  const safePayload = { ...payload, user_id: user.id }

  try {
    switch (entityType) {
      case 'guardians':
        return await handleGuardians(supabase, operation, safePayload, remoteId)

      case 'diary-entries':
        return await handleDiaryEntries(supabase, operation, safePayload, remoteId)

      case 'profiles':
        return await handleProfiles(supabase, user.id, safePayload)

      case 'audio-recordings':
        return await handleAudioRecordings(supabase, operation, safePayload, remoteId)

      case 'documents':
        return await handleDocuments(supabase, operation, safePayload, remoteId)

      case 'emergency-alerts':
        return await handleEmergencyAlerts(supabase, safePayload)

      default:
        return json({ error: `Unknown entityType: ${entityType}` }, 400)
    }
  } catch (error) {
    console.error(`[sync-push] ${entityType}/${operation} error:`, error)
    return json({ error: 'Internal server error', details: (error as Error).message }, 500)
  }
})

// ---------------------------------------------------------------------------
// Handlers por entidade
// ---------------------------------------------------------------------------

async function handleGuardians(
  supabase: ReturnType<typeof createClient>,
  operation: string,
  payload: Record<string, unknown>,
  remoteId?: string,
) {
  if (operation === 'create') {
    const { data, error } = await supabase
      .from('guardians')
      .insert({
        user_id:      payload.user_id,
        name:         payload.name,
        phone:        payload.phone,
        relationship: payload.relationship,
        is_active:    payload.is_active ?? true,
        is_deleted:   false,
      })
      .select()
      .single()
    if (error) throw error
    return json(data, 201)
  }

  if (operation === 'update') {
    if (!remoteId) return json({ error: 'remoteId required for update' }, 400)
    const { data, error } = await supabase
      .from('guardians')
      .update({
        name:         payload.name,
        phone:        payload.phone,
        relationship: payload.relationship,
        is_active:    payload.is_active,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', remoteId)
      .eq('user_id', payload.user_id)
      .select()
      .single()
    if (error) throw error
    return json(data)
  }

  if (operation === 'delete') {
    if (!remoteId) return json({ error: 'remoteId required for delete' }, 400)
    // Soft-delete para preservar histórico
    const { data, error } = await supabase
      .from('guardians')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', remoteId)
      .eq('user_id', payload.user_id)
      .select()
      .single()
    if (error) throw error
    return json(data)
  }

  return json({ error: `Unsupported operation: ${operation}` }, 400)
}

async function handleDiaryEntries(
  supabase: ReturnType<typeof createClient>,
  operation: string,
  payload: Record<string, unknown>,
  remoteId?: string,
) {
  if (operation === 'create') {
    const { data, error } = await supabase
      .from('safety_diary_entries')
      .insert({
        user_id:    payload.user_id,
        title:      payload.title,
        content:    payload.content,
        location:   payload.location ?? null,
        entry_date: payload.entry_date,
        emotion:    payload.emotion ?? null,
        tags:       payload.tags ?? [],
        images:     payload.images ?? [],
        is_private: payload.is_private ?? true,
        is_deleted: false,
      })
      .select()
      .single()
    if (error) throw error
    return json(data, 201)
  }

  if (operation === 'update') {
    if (!remoteId) return json({ error: 'remoteId required for update' }, 400)
    const { data, error } = await supabase
      .from('safety_diary_entries')
      .update({
        title:      payload.title,
        content:    payload.content,
        location:   payload.location ?? null,
        entry_date: payload.entry_date,
        emotion:    payload.emotion ?? null,
        tags:       payload.tags ?? [],
        images:     payload.images ?? [],
        is_private: payload.is_private,
        updated_at: new Date().toISOString(),
      })
      .eq('id', remoteId)
      .eq('user_id', payload.user_id)
      .select()
      .single()
    if (error) throw error
    return json(data)
  }

  if (operation === 'delete') {
    if (!remoteId) return json({ error: 'remoteId required for delete' }, 400)
    const { data, error } = await supabase
      .from('safety_diary_entries')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', remoteId)
      .eq('user_id', payload.user_id)
      .select()
      .single()
    if (error) throw error
    return json(data)
  }

  return json({ error: `Unsupported operation: ${operation}` }, 400)
}

async function handleProfiles(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id:         userId,
        full_name:  payload.full_name ?? null,
        email:      payload.email ?? null,
        cpf:        payload.cpf ?? null,
        phone:      payload.phone ?? null,
        birth_date: payload.birth_date ?? null,
        gender:     payload.gender ?? null,
        avatar_url: payload.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select()
    .single()
  if (error) throw error
  return json(data)
}

async function handleAudioRecordings(
  supabase: ReturnType<typeof createClient>,
  operation: string,
  payload: Record<string, unknown>,
  remoteId?: string,
) {
  if (operation === 'create') {
    const { data, error } = await supabase
      .from('audio_recordings')
      .insert({
        user_id:    payload.user_id,
        filename:   payload.filename,
        remote_url: payload.remote_url ?? null,
        duration:   payload.duration ?? 0,
        is_deleted: false,
      })
      .select()
      .single()
    if (error) throw error
    return json(data, 201)
  }

  if (operation === 'delete') {
    if (!remoteId) return json({ error: 'remoteId required for delete' }, 400)
    const { error } = await supabase
      .from('audio_recordings')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', remoteId)
      .eq('user_id', payload.user_id)
    if (error) throw error
    return json({ id: remoteId, deleted: true })
  }

  return json({ error: `Unsupported operation: ${operation}` }, 400)
}

async function handleDocuments(
  supabase: ReturnType<typeof createClient>,
  operation: string,
  payload: Record<string, unknown>,
  remoteId?: string,
) {
  if (operation === 'create') {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id:    payload.user_id,
        filename:   payload.filename,
        remote_url: payload.remote_url ?? null,
        mime_type:  payload.mime_type ?? '',
        size:       payload.size ?? 0,
        is_deleted: false,
      })
      .select()
      .single()
    if (error) throw error
    return json(data, 201)
  }

  if (operation === 'delete') {
    if (!remoteId) return json({ error: 'remoteId required for delete' }, 400)
    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', remoteId)
      .eq('user_id', payload.user_id)
    if (error) throw error
    return json({ id: remoteId, deleted: true })
  }

  return json({ error: `Unsupported operation: ${operation}` }, 400)
}

async function handleEmergencyAlerts(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('emergency_alerts')
    .insert({
      user_id:             payload.user_id,
      message:             payload.message,
      location_lat:        payload.locationLat ?? payload.location_lat ?? null,
      location_lng:        payload.locationLng ?? payload.location_lng ?? null,
      guardians_json:      payload.guardiansJson ?? payload.guardians_json ?? [],
      is_police_emergency: payload.isPoliceEmergency ?? payload.is_police_emergency ?? false,
      sent_at:             new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return json(data, 201)
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
