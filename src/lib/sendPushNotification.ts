import { supabase } from '../../lib/supabase'

export interface SendPushNotificationOptions {
  to?: string | string[] // Specific token(s)
  userId?: string // Target user ID
  userIds?: string[] // Multiple user IDs
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | string
  badge?: number
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

export interface PushNotificationResult {
  success: boolean
  sentCount: number
  failedCount: number
  results: Array<{
    token: string
    status: 'success' | 'error'
    error?: string
  }>
}

/**
 * Envia uma push notification via Supabase Edge Function
 */
export const sendPushNotification = async (
  options: SendPushNotificationOptions,
): Promise<PushNotificationResult> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase.functions.invoke('send-push', {
      body: options,
    })

    if (error) {
      console.error('Erro ao enviar push notification:', error)
      throw error
    }

    return data as PushNotificationResult
  } catch (error) {
    console.error('Erro ao enviar push notification:', error)
    throw error
  }
}

/**
 * Envia notificação para um usuário específico
 */
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<boolean> => {
  try {
    const result = await sendPushNotification({
      userId,
      title,
      body,
      data,
    })

    return result.success && result.sentCount > 0
  } catch (error) {
    console.error('Erro ao enviar notificação para usuário:', error)
    return false
  }
}

/**
 * Envia notificação para múltiplos usuários
 */
export const sendNotificationToUsers = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<PushNotificationResult> => {
  try {
    return await sendPushNotification({
      userIds,
      title,
      body,
      data,
    })
  } catch (error) {
    console.error('Erro ao enviar notificação para usuários:', error)
    throw error
  }
}

/**
 * Envia notificação de emergência (alta prioridade)
 */
export const sendEmergencyNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<boolean> => {
  try {
    const result = await sendPushNotification({
      userId,
      title,
      body,
      data: {
        ...data,
        type: 'emergency',
      },
      priority: 'high',
      sound: 'default',
    })

    return result.success && result.sentCount > 0
  } catch (error) {
    console.error('Erro ao enviar notificação de emergência:', error)
    return false
  }
}

/**
 * Envia notificação de segurança
 */
export const sendSecurityAlert = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<boolean> => {
  try {
    const result = await sendPushNotification({
      userId,
      title,
      body,
      data: {
        ...data,
        type: 'security_alert',
      },
      priority: 'high',
      sound: 'default',
    })

    return result.success && result.sentCount > 0
  } catch (error) {
    console.error('Erro ao enviar alerta de segurança:', error)
    return false
  }
}

/**
 * Registra o token do dispositivo atual no Supabase
 */
export const registerPushToken = async (
  expoPushToken: string,
): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase.from('user_push_tokens').upsert(
      {
        user_id: user.id,
        expo_token: expoPushToken,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,expo_token',
      },
    )

    if (error) {
      console.error('Erro ao registrar token:', error)
      return false
    }

    console.log('Token registrado com sucesso')
    return true
  } catch (error) {
    console.error('Erro ao registrar token:', error)
    return false
  }
}

/**
 * Remove o token do dispositivo atual do Supabase
 */
export const unregisterPushToken = async (
  expoPushToken: string,
): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('user_push_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('expo_token', expoPushToken)

    if (error) {
      console.error('Erro ao desregistrar token:', error)
      return false
    }

    console.log('Token desregistrado com sucesso')
    return true
  } catch (error) {
    console.error('Erro ao desregistrar token:', error)
    return false
  }
}
