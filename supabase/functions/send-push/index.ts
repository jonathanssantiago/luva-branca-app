import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationPayload {
  to?: string | string[] // Specific token(s)
  userId?: string // Target user ID (will fetch their tokens)
  userIds?: string[] // Multiple user IDs
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | string
  badge?: number
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

interface ExpoMessage {
  to: string | string[]
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | string
  badge?: number
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

interface ExpoResponse {
  data: Array<{
    status: 'ok' | 'error'
    id?: string
    message?: string
    details?: any
  }>
}

interface PushResponse {
  success: boolean
  sentCount: number
  failedCount: number
  results: Array<{
    token: string
    status: 'success' | 'error'
    error?: string
  }>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    )

    // Get the user from the auth token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const payload: PushNotificationPayload = await req.json()

    // Validate required fields
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title and body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let targetTokens: string[] = []

    // Determine target tokens based on payload
    if (payload.to) {
      // Direct token(s) provided
      targetTokens = Array.isArray(payload.to) ? payload.to : [payload.to]
    } else if (payload.userId || payload.userIds) {
      // Fetch tokens for specific user(s)
      const targetUserIds =
        payload.userIds || (payload.userId ? [payload.userId] : [])

      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('user_push_tokens')
        .select('expo_token')
        .in('user_id', targetUserIds)
        .eq('is_active', true)

      if (tokenError) {
        console.error('Error fetching tokens:', tokenError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user tokens' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      targetTokens = tokenData.map((row) => row.expo_token)
    } else {
      return new Response(
        JSON.stringify({
          error: 'Must provide either "to", "userId", or "userIds"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sentCount: 0,
          failedCount: 0,
          results: [],
          message: 'No active tokens found for target users',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Prepare Expo message
    const expoMessage: ExpoMessage = {
      to: targetTokens,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      sound: payload.sound || 'default',
      priority: payload.priority || 'default',
    }

    if (payload.badge !== undefined) {
      expoMessage.badge = payload.badge
    }

    if (payload.channelId) {
      expoMessage.channelId = payload.channelId
    }

    // Send notification via Expo Push API
    console.log('Sending push notification:', expoMessage)

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoMessage),
    })

    if (!expoResponse.ok) {
      const errorText = await expoResponse.text()
      console.error('Expo API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send notification via Expo API' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const expoResult: ExpoResponse = await expoResponse.json()
    console.log('Expo API response:', expoResult)

    // Process results
    const results = expoResult.data.map((result, index) => ({
      token: Array.isArray(targetTokens)
        ? targetTokens[index]
        : targetTokens[0],
      status:
        result.status === 'ok' ? ('success' as const) : ('error' as const),
      error: result.status === 'error' ? result.message : undefined,
    }))

    const sentCount = results.filter((r) => r.status === 'success').length
    const failedCount = results.filter((r) => r.status === 'error').length

    // Optionally, log the notification to a table for audit purposes
    try {
      await supabaseClient.from('notification_logs').insert({
        sender_user_id: user.id,
        title: payload.title,
        body: payload.body,
        target_tokens: targetTokens,
        sent_count: sentCount,
        failed_count: failedCount,
        results: results,
      })
    } catch (logError) {
      console.warn('Failed to log notification:', logError)
      // Don't fail the request if logging fails
    }

    const response: PushResponse = {
      success: sentCount > 0,
      sentCount,
      failedCount,
      results,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
