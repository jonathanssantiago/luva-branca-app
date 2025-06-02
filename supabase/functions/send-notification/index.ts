-- Edge Function: send-notification
-- Função para enviar notificações push e em tempo real

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationRequest {
  userId?: string
  userIds?: string[]
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  data?: Record<string, any>
  channels: ('push' | 'realtime' | 'email')[]
}

interface NotificationResponse {
  success: boolean
  sentCount: number
  failedCount: number
  errors?: string[]
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { 
      userId, 
      userIds, 
      title, 
      message, 
      type, 
      data, 
      channels 
    }: NotificationRequest = await req.json()

    // Validações
    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Título e mensagem são obrigatórios' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!userId && !userIds) {
      return new Response(
        JSON.stringify({ error: 'userId ou userIds deve ser fornecido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Pelo menos um canal de notificação deve ser especificado' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Preparar lista de usuários
    const targetUsers = userId ? [userId] : userIds!

    const result = await sendNotifications({
      userIds: targetUsers,
      title,
      message,
      type: type || 'info',
      data,
      channels
    })

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function sendNotifications(params: {
  userIds: string[]
  title: string
  message: string
  type: string
  data?: Record<string, any>
  channels: string[]
}): Promise<NotificationResponse> {
  let sentCount = 0
  let failedCount = 0
  const errors: string[] = []

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  for (const userId of params.userIds) {
    try {
      // Enviar notificação em tempo real via Supabase Realtime
      if (params.channels.includes('realtime')) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: params.title,
            message: params.message,
            type: params.type,
            data: params.data,
            created_at: new Date().toISOString()
          })
      }

      // Simular envio de push notification
      if (params.channels.includes('push')) {
        console.log(`Enviando push notification para usuário ${userId}`)
        // Aqui você integraria com um serviço como Firebase Cloud Messaging
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Simular envio de email
      if (params.channels.includes('email')) {
        console.log(`Enviando email notification para usuário ${userId}`)
        // Aqui você integraria com um serviço de email
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      sentCount++
    } catch (error) {
      failedCount++
      errors.push(`Falha ao enviar para ${userId}: ${error.message}`)
    }
  }

  return {
    success: sentCount > 0,
    sentCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined
  }
}
