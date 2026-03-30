/**
 * Edge Function: send-notification
 *
 * Envia notificações via push (Expo) e/ou email (Supabase Auth Admin)
 * para um ou mais usuários.
 *
 * POST /functions/v1/send-notification
 * Body:
 * {
 *   userId?:  string,
 *   userIds?: string[],
 *   title:    string,
 *   message:  string,
 *   type?:    'info' | 'success' | 'warning' | 'error',
 *   data?:    Record<string, any>,
 *   channels: ('push' | 'email')[]
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface NotificationRequest {
  userId?:  string
  userIds?: string[]
  title:    string
  message:  string
  type?:    'info' | 'success' | 'warning' | 'error'
  data?:    Record<string, unknown>
  channels: ('push' | 'email')[]
}

interface ChannelResult {
  channel: 'push' | 'email'
  sentCount: number
  failedCount: number
  errors: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  // Cliente com anon key (usa o token do chamador para validar identidade)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  // Cliente com service_role key para operações admin (email, busca de tokens)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // Valida identidade do chamador
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let body: NotificationRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { userId, userIds, title, message, type = 'info', data = {}, channels } = body

  if (!title || !message) {
    return json({ error: 'title and message are required' }, 400)
  }
  if (!userId && (!userIds || userIds.length === 0)) {
    return json({ error: 'userId or userIds must be provided' }, 400)
  }
  if (!channels || channels.length === 0) {
    return json({ error: 'At least one channel must be specified' }, 400)
  }

  const targetUserIds = userIds ?? (userId ? [userId] : [])

  const results: ChannelResult[] = []

  // ----- Canal: push -------------------------------------------------------
  if (channels.includes('push')) {
    const pushResult = await sendPush(supabaseAdmin, targetUserIds, title, message, type, data)
    results.push(pushResult)
  }

  // ----- Canal: email -------------------------------------------------------
  if (channels.includes('email')) {
    const emailResult = await sendEmail(supabaseAdmin, targetUserIds, title, message)
    results.push(emailResult)
  }

  const totalSent   = results.reduce((s, r) => s + r.sentCount, 0)
  const totalFailed = results.reduce((s, r) => s + r.failedCount, 0)

  return json({
    success:     totalSent > 0,
    sentCount:   totalSent,
    failedCount: totalFailed,
    results,
  })
})

// ---------------------------------------------------------------------------
// Push via Expo Push API
// ---------------------------------------------------------------------------
async function sendPush(
  supabaseAdmin: ReturnType<typeof createClient>,
  userIds: string[],
  title: string,
  body: string,
  type: string,
  data: Record<string, unknown>,
): Promise<ChannelResult> {
  const result: ChannelResult = { channel: 'push', sentCount: 0, failedCount: 0, errors: [] }

  // Busca tokens ativos dos usuários-alvo
  const { data: tokenRows, error: tokenError } = await supabaseAdmin
    .from('user_push_tokens')
    .select('expo_token, user_id')
    .in('user_id', userIds)
    .eq('is_active', true)

  if (tokenError) {
    result.errors.push(`Failed to fetch tokens: ${tokenError.message}`)
    result.failedCount = userIds.length
    return result
  }

  if (!tokenRows || tokenRows.length === 0) {
    return result
  }

  const tokens = tokenRows.map((r: Record<string, unknown>) => r.expo_token as string)

  const expoMessage = {
    to:       tokens,
    title,
    body,
    data:     { ...data, type },
    sound:    'default',
    priority: type === 'error' ? 'high' : 'default',
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoMessage),
    })

    if (!res.ok) {
      const text = await res.text()
      result.errors.push(`Expo API error: ${text}`)
      result.failedCount = tokens.length
      return result
    }

    const expoResult: { data: Array<{ status: string; message?: string }> } = await res.json()
    for (const item of expoResult.data ?? []) {
      if (item.status === 'ok') {
        result.sentCount++
      } else {
        result.failedCount++
        if (item.message) result.errors.push(item.message)
      }
    }
  } catch (err) {
    result.errors.push(`Push send failed: ${(err as Error).message}`)
    result.failedCount = tokens.length
  }

  return result
}

// ---------------------------------------------------------------------------
// Email via Supabase Auth Admin (magic link / custom email)
// ---------------------------------------------------------------------------
async function sendEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  userIds: string[],
  title: string,
  message: string,
): Promise<ChannelResult> {
  const result: ChannelResult = { channel: 'email', sentCount: 0, failedCount: 0, errors: [] }

  for (const uid of userIds) {
    try {
      // Busca o email do usuário via Admin API
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(uid)
      if (userError || !userData?.user?.email) {
        result.failedCount++
        result.errors.push(`User ${uid}: ${userError?.message ?? 'no email found'}`)
        continue
      }

      // Envia um e-mail de "magic link" customizado como canal de notificação.
      // Para emails transacionais customizados com template próprio, configure
      // SMTP customizado no painel Supabase e use generateLink + seu serviço SMTP.
      const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type:  'magiclink',
        email: userData.user.email,
        options: {
          data: { notification_title: title, notification_body: message },
        },
      })

      if (linkError) {
        result.failedCount++
        result.errors.push(`User ${uid} email: ${linkError.message}`)
      } else {
        result.sentCount++
      }
    } catch (err) {
      result.failedCount++
      result.errors.push(`User ${uid}: ${(err as Error).message}`)
    }
  }

  return result
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
