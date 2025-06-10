/**
 * Utilitários para Login Silencioso do Modo Disfarçado
 *
 * Este arquivo contém funções auxiliares para integrar o sistema de login silencioso
 * do modo disfarçado com outras partes do aplicativo Luva Branca.
 */

import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { supabase } from '@/lib/supabase'

/**
 * Chaves utilizadas no SecureStore para persistir dados de autenticação
 */
export const DISGUISED_MODE_STORAGE_KEYS = {
  LAST_LOGIN: 'luva_branca_last_login',
  USER_EMAIL: 'luva_branca_user_email',
  USER_PHONE: 'luva_branca_user_phone',
  USER_PASSWORD: 'luva_branca_user_password',
  SESSION_TOKEN: 'luva_branca_session_token',
  REFRESH_TOKEN: 'luva_branca_refresh_token',
  BIOMETRIC_ENABLED: 'luva_branca_biometric_enabled',
  AUTH_TYPE: 'luva_branca_auth_type', // 'email' ou 'phone'
} as const

/**
 * Verifica se o usuário pode acessar o app offline
 * Baseado no último login e configuração de biometria
 *
 * @returns Promise<boolean> - true se pode liberar acesso offline
 */
export const checkOfflineAccess = async (): Promise<boolean> => {
  try {
    // 1. Verificar se há credenciais salvas
    const hasCredentials = await hasDisguisedModeCredentials()
    if (!hasCredentials) {
      return false
    }

    // 2. Verificar último login (permitir até 24h offline)
    const { isRecent } = await getLastLoginInfo()
    if (!isRecent) {
      // Se passou mais de 24h, verificar biometria
      const biometricEnabled = await SecureStore.getItemAsync(
        DISGUISED_MODE_STORAGE_KEYS.BIOMETRIC_ENABLED,
      )

      if (biometricEnabled === 'true') {
        // Verificar se o dispositivo tem biometria configurada
        const hasHardware = await LocalAuthentication.hasHardwareAsync()
        const isEnrolled = await LocalAuthentication.isEnrolledAsync()

        if (hasHardware && isEnrolled) {
          // Solicitar autenticação biométrica
          const biometricResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Autentique-se para acessar o modo seguro',
            fallbackLabel: 'Usar código',
            cancelLabel: 'Cancelar',
          })

          return biometricResult.success
        }
      }

      return false
    }

    return true
  } catch (error) {
    console.error('❌ Erro ao verificar acesso offline:', error)
    return false
  }
}

/**
 * Função para tentar login biométrico
 * Deve ser usada como fallback quando o login silencioso falha
 *
 * @returns Promise<{ success: boolean, error?: string }>
 */
export const attemptBiometricLogin = async (): Promise<{
  success: boolean
  error?: string
}> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()

    if (!hasHardware) {
      return {
        success: false,
        error: 'Dispositivo não possui hardware biométrico',
      }
    }

    if (!isEnrolled) {
      return {
        success: false,
        error: 'Nenhuma biometria cadastrada no dispositivo',
      }
    }

    const biometricResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique-se para acessar o aplicativo',
      fallbackLabel: 'Usar senha',
      cancelLabel: 'Cancelar',
    })

    if (biometricResult.success) {
      // Atualizar último login se biometria foi bem-sucedida
      await updateLastLogin()
      return { success: true }
    }

    return {
      success: false,
      error: biometricResult.error || 'Autenticação biométrica cancelada',
    }
  } catch (error) {
    console.error('❌ Erro na autenticação biométrica:', error)
    return {
      success: false,
      error: 'Erro inesperado na autenticação biométrica',
    }
  }
}

/**
 * Habilita ou desabilita a autenticação biométrica
 *
 * @param enabled - Se deve habilitar a biometria
 * @returns Promise<boolean> - true se foi configurado com sucesso
 */
export const setBiometricEnabled = async (
  enabled: boolean,
): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.BIOMETRIC_ENABLED,
      enabled.toString(),
    )
    return true
  } catch (error) {
    console.error('❌ Erro ao configurar biometria:', error)
    return false
  }
}

/**
 * Verifica se a biometria está habilitada
 *
 * @returns Promise<boolean> - true se biometria está habilitada
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.BIOMETRIC_ENABLED,
    )
    return enabled === 'true'
  } catch (error) {
    console.error('❌ Erro ao verificar configuração de biometria:', error)
    return false
  }
}

/**
 * Função para restaurar sessão automaticamente
 * Deve ser chamada no início do app para verificar se há sessão válida
 *
 * @returns Promise<{ success: boolean, user?: any, error?: string }>
 */
export const restoreSession = async (): Promise<{
  success: boolean
  user?: any
  error?: string
}> => {
  try {
    // Primeiro verificar se há sessão ativa no Supabase
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (!error && session) {
      return { success: true, user: session.user }
    }

    // Se não há sessão ativa, tentar restaurar com tokens salvos
    const [sessionToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN),
    ])

    if (sessionToken && refreshToken) {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: sessionToken,
        refresh_token: refreshToken,
      })

      if (!sessionError && data.session) {
        // Atualizar tokens se foram renovados
        if (data.session.access_token !== sessionToken) {
          await Promise.all([
            SecureStore.setItemAsync(
              DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN,
              data.session.access_token,
            ),
            SecureStore.setItemAsync(
              DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN,
              data.session.refresh_token,
            ),
          ])
        }

        await updateLastLogin()
        return { success: true, user: data.session.user }
      }
    }

    return { success: false, error: 'Nenhuma sessão válida encontrada' }
  } catch (error) {
    console.error('❌ Erro ao restaurar sessão:', error)
    return { success: false, error: 'Erro inesperado ao restaurar sessão' }
  }
}

/**
 * Salva as credenciais de login para uso no modo disfarçado
 *
 * DEVE ser chamada após um login manual bem-sucedido
 *
 * @param identifier - Email ou telefone do usuário
 * @param password - Senha do usuário
 * @param authType - Tipo de autenticação: 'email' ou 'phone'
 * @returns Promise<boolean> - true se salvou com sucesso, false caso contrário
 */
export const saveDisguisedModeCredentials = async (
  identifier: string,
  password: string,
  authType: 'email' | 'phone' = 'email',
): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn('Nenhuma sessão ativa encontrada para salvar credenciais')
      return false
    }

    const now = new Date().getTime()

    // Preparar array de promises para salvar dados
    const savePromises = [
      SecureStore.setItemAsync(
        DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD,
        password,
      ),
      SecureStore.setItemAsync(
        DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN,
        session.access_token,
      ),
      SecureStore.setItemAsync(
        DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN,
        session.refresh_token,
      ),
      SecureStore.setItemAsync(
        DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN,
        now.toString(),
      ),
      SecureStore.setItemAsync(DISGUISED_MODE_STORAGE_KEYS.AUTH_TYPE, authType),
    ]

    // Salvar email ou telefone baseado no tipo de autenticação
    if (authType === 'email') {
      savePromises.push(
        SecureStore.setItemAsync(
          DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL,
          identifier,
        ),
      )
      // Limpar telefone se existir
      savePromises.push(
        SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PHONE),
      )
    } else {
      savePromises.push(
        SecureStore.setItemAsync(
          DISGUISED_MODE_STORAGE_KEYS.USER_PHONE,
          identifier,
        ),
      )
      // Limpar email se existir
      savePromises.push(
        SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL),
      )
    }

    await Promise.all(savePromises)

    console.log(
      `✅ Credenciais do modo disfarçado salvas com sucesso (${authType})`,
    )
    return true
  } catch (error) {
    console.error('❌ Erro ao salvar credenciais do modo disfarçado:', error)
    return false
  }
}

/**
 * Limpa todas as credenciais armazenadas do modo disfarçado
 *
 * DEVE ser chamada durante o logout do usuário
 *
 * @returns Promise<boolean> - true se limpou com sucesso, false caso contrário
 */
export const clearDisguisedModeCredentials = async (): Promise<boolean> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PHONE),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN),
      SecureStore.deleteItemAsync(
        DISGUISED_MODE_STORAGE_KEYS.BIOMETRIC_ENABLED,
      ),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.AUTH_TYPE),
    ])

    console.log('🧹 Credenciais do modo disfarçado limpas com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro ao limpar credenciais do modo disfarçado:', error)
    return false
  }
}

/**
 * Verifica se existem credenciais salvas para o modo disfarçado
 *
 * @returns Promise<boolean> - true se existem credenciais, false caso contrário
 */
export const hasDisguisedModeCredentials = async (): Promise<boolean> => {
  try {
    const [email, phone, password, authType] = await Promise.all([
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PHONE),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.AUTH_TYPE),
    ])

    // Verifica se tem senha e pelo menos um identificador (email ou telefone)
    const hasIdentifier = authType === 'phone' ? !!phone : !!email
    return !!(hasIdentifier && password)
  } catch (error) {
    console.error('❌ Erro ao verificar credenciais do modo disfarçado:', error)
    return false
  }
}

/**
 * Verifica quando foi o último login realizado
 *
 * @returns Promise<{ lastLogin: Date | null, isRecent: boolean }>
 */
export const getLastLoginInfo = async (): Promise<{
  lastLogin: Date | null
  isRecent: boolean
}> => {
  try {
    const lastLoginStr = await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN,
    )

    if (!lastLoginStr) {
      return { lastLogin: null, isRecent: false }
    }

    const lastLogin = new Date(parseInt(lastLoginStr))
    const now = new Date()
    const timeDiff = now.getTime() - lastLogin.getTime()
    const twentyFourHours = 24 * 60 * 60 * 1000

    return {
      lastLogin,
      isRecent: timeDiff < twentyFourHours,
    }
  } catch (error) {
    console.error('❌ Erro ao verificar último login:', error)
    return { lastLogin: null, isRecent: false }
  }
}

/**
 * Atualiza o timestamp do último login
 *
 * @returns Promise<boolean> - true se atualizou com sucesso, false caso contrário
 */
export const updateLastLogin = async (): Promise<boolean> => {
  try {
    const now = new Date().getTime()
    await SecureStore.setItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN,
      now.toString(),
    )

    console.log('⏰ Último login atualizado')
    return true
  } catch (error) {
    console.error('❌ Erro ao atualizar último login:', error)
    return false
  }
}

/**
 * Utilitário para debug - lista todas as credenciais armazenadas (sem exibir valores sensíveis)
 *
 * @returns Promise<object> - Objeto com informações de debug
 */
export const debugDisguisedModeStorage = async () => {
  try {
    const [
      hasEmail,
      hasPhone,
      hasPassword,
      hasSessionToken,
      hasRefreshToken,
      lastLoginStr,
      biometricEnabled,
      authType,
    ] = await Promise.all([
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL).then(
        (val) => !!val,
      ),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PHONE).then(
        (val) => !!val,
      ),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD).then(
        (val) => !!val,
      ),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN).then(
        (val) => !!val,
      ),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN).then(
        (val) => !!val,
      ),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.BIOMETRIC_ENABLED),
      SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.AUTH_TYPE),
    ])

    const debugInfo = {
      hasEmail,
      hasPhone,
      hasPassword,
      hasSessionToken,
      hasRefreshToken,
      authType: authType || 'unknown',
      biometricEnabled: biometricEnabled === 'true',
      lastLogin: lastLoginStr
        ? new Date(parseInt(lastLoginStr)).toISOString()
        : null,
      allCredentialsPresent:
        hasPassword &&
        hasSessionToken &&
        hasRefreshToken &&
        (hasEmail || hasPhone),
    }

    console.log('🔍 Debug do armazenamento do modo disfarçado:', debugInfo)
    return debugInfo
  } catch (error) {
    console.error('❌ Erro no debug do armazenamento:', error)
    return null
  }
}

/**
 * Recupera as credenciais salvas do modo disfarçado
 *
 * @returns Promise<DisguisedModeCredentials | null> - Credenciais ou null se não encontradas
 */
export const getDisguisedModeCredentials =
  async (): Promise<DisguisedModeCredentials | null> => {
    try {
      const [
        email,
        phone,
        password,
        sessionToken,
        refreshToken,
        lastLoginStr,
        authType,
      ] = await Promise.all([
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PHONE),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.AUTH_TYPE),
      ])

      if (!password || !sessionToken || !refreshToken || !lastLoginStr) {
        return null
      }

      const authTypeValue = (authType as 'email' | 'phone') || 'email'
      const identifier = authTypeValue === 'phone' ? phone : email

      if (!identifier) {
        return null
      }

      return {
        ...(authTypeValue === 'email'
          ? { email: identifier }
          : { phone: identifier }),
        password,
        sessionToken,
        refreshToken,
        lastLogin: parseInt(lastLoginStr),
        authType: authTypeValue,
      }
    } catch (error) {
      console.error(
        '❌ Erro ao recuperar credenciais do modo disfarçado:',
        error,
      )
      return null
    }
  }

// Tipos auxiliares para TypeScript
export type DisguisedModeCredentials = {
  email?: string
  phone?: string
  password: string
  sessionToken: string
  refreshToken: string
  lastLogin: number
  authType: 'email' | 'phone'
}

export type SilentLoginResult = {
  success: boolean
  message?: string
  reason?:
    | 'recent_login'
    | 'session_restored'
    | 'credentials_login'
    | 'no_credentials'
    | 'auth_error'
    | 'network_error'
}
