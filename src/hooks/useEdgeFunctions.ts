import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'

export interface EdgeFunctionResult<T = any> {
  data: T | null
  error: string | null
  loading: boolean
}

export const useEdgeFunctions = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // Função genérica para invocar Edge Functions
  const invokeFunction = async <T = any>(
    functionName: string,
    body?: any,
    options?: {
      headers?: Record<string, string>
      method?: 'POST' | 'GET' | 'PUT' | 'DELETE'
    },
  ): Promise<EdgeFunctionResult<T>> => {
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: body || {},
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        method: options?.method || 'POST',
      })

      if (error) {
        throw error
      }

      return {
        data: data as T,
        error: null,
        loading: false,
      }
    } catch (err: any) {
      console.error(`Erro ao invocar função ${functionName}:`, err)
      return {
        data: null,
        error: err.message || `Erro ao executar função ${functionName}`,
        loading: false,
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para enviar email de boas-vindas
  const sendWelcomeEmail = async (userEmail: string, userName?: string) => {
    return await invokeFunction('send-welcome', {
      email: userEmail,
      name: userName,
      user_id: user?.id,
    })
  }

  // Função para validar dados sensíveis
  const validateSensitiveData = async (data: any) => {
    return await invokeFunction('validate-data', {
      data,
      user_id: user?.id,
    })
  }

  // Função para processar pagamentos (exemplo com Stripe)
  const processPayment = async (paymentData: {
    amount: number
    currency: string
    description?: string
  }) => {
    return await invokeFunction('process-payment', {
      ...paymentData,
      user_id: user?.id,
    })
  }

  // Função para enviar notificações
  const sendNotification = async (notificationData: {
    title: string
    message: string
    recipients: string[]
    type?: 'email' | 'push' | 'sms'
  }) => {
    return await invokeFunction('send-notification', {
      ...notificationData,
      sender_id: user?.id,
    })
  }

  // Função para gerar relatórios
  const generateReport = async (reportType: string, filters?: any) => {
    return await invokeFunction('generate-report', {
      type: reportType,
      filters,
      user_id: user?.id,
    })
  }

  // Função para integração com WhatsApp
  const sendWhatsAppMessage = async (data: {
    phone: string
    message: string
    template?: string
  }) => {
    return await invokeFunction('whatsapp-send', {
      ...data,
      user_id: user?.id,
    })
  }

  // Função para backup de dados
  const backupUserData = async () => {
    return await invokeFunction('backup-user-data', {
      user_id: user?.id,
    })
  }

  // Função para análise de dados com IA
  const analyzeData = async (analysisType: string, data: any) => {
    return await invokeFunction('ai-analysis', {
      type: analysisType,
      data,
      user_id: user?.id,
    })
  }

  // Função para limpar dados antigos
  const cleanupOldData = async (daysOld: number = 30) => {
    return await invokeFunction('cleanup-data', {
      days_old: daysOld,
      user_id: user?.id,
    })
  }

  return {
    loading,
    invokeFunction,
    sendWelcomeEmail,
    validateSensitiveData,
    processPayment,
    sendNotification,
    generateReport,
    sendWhatsAppMessage,
    backupUserData,
    analyzeData,
    cleanupOldData,
  }
}

// Hook específico para funções de autenticação
export const useAuthFunctions = () => {
  const edgeFunctions = useEdgeFunctions()

  const sendWelcomeEmailOnSignup = async (email: string, username?: string) => {
    return await edgeFunctions.sendWelcomeEmail(email, username)
  }

  const validateAccountData = async (accountData: any) => {
    return await edgeFunctions.validateSensitiveData(accountData)
  }

  const setupUserPreferences = async (preferences: any) => {
    return await edgeFunctions.invokeFunction('setup-user-preferences', {
      preferences,
    })
  }

  return {
    sendWelcomeEmailOnSignup,
    validateAccountData,
    setupUserPreferences,
    ...edgeFunctions,
  }
}
