-- Edge Function: process-payment
-- Função para processar pagamentos de forma segura

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PaymentRequest {
  amount: number
  currency: string
  paymentMethod: string
  description?: string
  metadata?: Record<string, any>
}

interface PaymentResponse {
  success: boolean
  transactionId?: string
  error?: string
  status: 'pending' | 'completed' | 'failed'
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
    // Verificar autenticação
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

    const { amount, currency, paymentMethod, description, metadata }: PaymentRequest = await req.json()

    // Validações básicas
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valor inválido' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!currency || !['BRL', 'USD', 'EUR'].includes(currency)) {
      return new Response(
        JSON.stringify({ error: 'Moeda não suportada' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Método de pagamento obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Simular processamento de pagamento
    const result = await processPayment({
      amount,
      currency,
      paymentMethod,
      description,
      metadata
    })

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400,
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

async function processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Simular diferentes cenários de pagamento
  const random = Math.random()
  
  if (random < 0.1) {
    // 10% de chance de falha
    return {
      success: false,
      error: 'Falha no processamento do pagamento',
      status: 'failed'
    }
  } else if (random < 0.3) {
    // 20% de chance de ficar pendente
    return {
      success: true,
      transactionId: generateTransactionId(),
      status: 'pending'
    }
  } else {
    // 70% de chance de sucesso
    return {
      success: true,
      transactionId: generateTransactionId(),
      status: 'completed'
    }
  }
}

function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
