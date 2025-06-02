-- Edge Function: validate-sensitive-data
-- Função para validar dados sensíveis antes de salvar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  data: any
  type: 'profile' | 'payment' | 'document'
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: any
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
    const { data, type }: RequestBody = await req.json()

    if (!data || !type) {
      return new Response(
        JSON.stringify({ error: 'Dados e tipo são obrigatórios' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result: ValidationResult = await validateData(data, type)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.isValid ? 200 : 400,
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

async function validateData(data: any, type: string): Promise<ValidationResult> {
  const errors: string[] = []
  let sanitizedData = { ...data }

  switch (type) {
    case 'profile':
      if (data.username && data.username.length < 3) {
        errors.push('Username deve ter pelo menos 3 caracteres')
      }
      if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
        errors.push('Username deve conter apenas letras, números e underscore')
      }
      if (data.bio && data.bio.length > 500) {
        errors.push('Bio não pode ter mais de 500 caracteres')
      }
      if (data.website && !isValidUrl(data.website)) {
        errors.push('URL do website inválida')
      }
      
      // Sanitizar dados
      if (sanitizedData.username) {
        sanitizedData.username = sanitizedData.username.toLowerCase().trim()
      }
      if (sanitizedData.bio) {
        sanitizedData.bio = sanitizedData.bio.trim()
      }
      break

    case 'payment':
      if (!data.amount || data.amount <= 0) {
        errors.push('Valor deve ser maior que zero')
      }
      if (!data.currency || !['BRL', 'USD', 'EUR'].includes(data.currency)) {
        errors.push('Moeda inválida')
      }
      break

    case 'document':
      if (!data.content || data.content.trim().length === 0) {
        errors.push('Conteúdo do documento não pode estar vazio')
      }
      if (data.content && data.content.length > 10000) {
        errors.push('Documento muito grande (máximo 10.000 caracteres)')
      }
      break

    default:
      errors.push('Tipo de validação não suportado')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  }
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
}
