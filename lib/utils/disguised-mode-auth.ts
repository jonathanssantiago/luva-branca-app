/**
 * Utilitários para Login Silencioso do Modo Disfarçado
 *
 * Este arquivo contém funções auxiliares para integrar o sistema de login silencioso
 * do modo disfarçado com outras partes do aplicativo Luva Branca.
 */

import * as SecureStore from 'expo-secure-store'
import { supabase } from '@/lib/supabase'

/**
 * Chaves utilizadas no SecureStore para persistir dados de autenticação
 */
export const DISGUISED_MODE_STORAGE_KEYS = {
  LAST_LOGIN: 'luva_branca_last_login',
  USER_EMAIL: 'luva_branca_user_email',
  USER_PASSWORD: 'luva_branca_user_password',
  SESSION_TOKEN: 'luva_branca_session_token',
  REFRESH_TOKEN: 'luva_branca_refresh_token',
} as const

/**
 * Salva as credenciais de login para uso no modo disfarçado
 *
 * DEVE ser chamada após um login manual bem-sucedido
 *
 * @param email - Email do usuário
 * @param password - Senha do usuário
 * @returns Promise<boolean> - true se salvou com sucesso, false caso contrário
 */
export const saveDisguisedModeCredentials = async (
  email: string,
  password: string,
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

    await Promise.all([
      SecureStore.setItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL, email),
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
    ])

    console.log('✅ Credenciais do modo disfarçado salvas com sucesso')
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
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN),
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
    const email = await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL,
    )
    const password = await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD,
    )

    return !!(email && password)
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
    const hasEmail = !!(await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL,
    ))
    const hasPassword = !!(await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD,
    ))
    const hasSessionToken = !!(await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN,
    ))
    const hasRefreshToken = !!(await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN,
    ))
    const lastLoginStr = await SecureStore.getItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.LAST_LOGIN,
    )

    const debugInfo = {
      hasEmail,
      hasPassword,
      hasSessionToken,
      hasRefreshToken,
      lastLogin: lastLoginStr
        ? new Date(parseInt(lastLoginStr)).toISOString()
        : null,
      allCredentialsPresent:
        hasEmail && hasPassword && hasSessionToken && hasRefreshToken,
    }

    console.log('🔍 Debug do armazenamento do modo disfarçado:', debugInfo)
    return debugInfo
  } catch (error) {
    console.error('❌ Erro no debug do armazenamento:', error)
    return null
  }
}

// Tipos auxiliares para TypeScript
export type DisguisedModeCredentials = {
  email: string
  password: string
  sessionToken: string
  refreshToken: string
  lastLogin: number
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
