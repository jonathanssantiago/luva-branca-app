import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  email: string
  username?: string
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, username }: RequestBody = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Aqui você pode integrar com um serviço de email como SendGrid, Mailgun, etc.
    // Por enquanto, vamos apenas simular o envio
    console.log(`Enviando email de boas-vindas para: ${email}`)
    console.log(`Username: ${username || 'Não informado'}`)

    // Simular delay de envio de email
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de boas-vindas enviado com sucesso',
        sentTo: email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
