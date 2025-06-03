import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'

const OFFLINE_ACCESS_KEYS = {
  SESSION_TOKEN: 'offline_session_token',
  LAST_LOGIN: 'offline_last_login',
  USER_PROFILE: 'offline_user_profile',
}

export interface OfflineAccessResult {
  hasAccess: boolean
  requiresBiometric: boolean
  message: string
  userProfile?: any
}

/**
 * Verifica se o usuário tem acesso offline baseado no último login e sessão salva
 */
export async function checkOfflineAccess(): Promise<OfflineAccessResult> {
  try {
    // Verificar se existe sessão salva
    const sessionToken = await SecureStore.getItemAsync(OFFLINE_ACCESS_KEYS.SESSION_TOKEN)
    const lastLogin = await SecureStore.getItemAsync(OFFLINE_ACCESS_KEYS.LAST_LOGIN)
    const userProfile = await SecureStore.getItemAsync(OFFLINE_ACCESS_KEYS.USER_PROFILE)

    if (!sessionToken || !lastLogin) {
      return {
        hasAccess: false,
        requiresBiometric: false,
        message: 'Nenhuma sessão offline encontrada',
      }
    }

    // Verificar se o último login foi nas últimas 24h
    const lastLoginDate = new Date(lastLogin)
    const now = new Date()
    const hoursSinceLastLogin = (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastLogin > 24) {
      return {
        hasAccess: false,
        requiresBiometric: false,
        message: 'Sessão offline expirada',
      }
    }

    // Verificar se biometria está disponível
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()

    return {
      hasAccess: true,
      requiresBiometric: hasHardware && isEnrolled,
      message: 'Modo offline ativado - recursos limitados disponíveis',
      userProfile: userProfile ? JSON.parse(userProfile) : undefined,
    }
  } catch (error) {
    console.error('Erro ao verificar acesso offline:', error)
    return {
      hasAccess: false,
      requiresBiometric: false,
      message: 'Erro ao verificar acesso offline',
    }
  }
}

/**
 * Salva os dados necessários para acesso offline
 */
export async function saveOfflineAccessData(sessionToken: string, userProfile: any) {
  try {
    await SecureStore.setItemAsync(OFFLINE_ACCESS_KEYS.SESSION_TOKEN, sessionToken)
    await SecureStore.setItemAsync(OFFLINE_ACCESS_KEYS.LAST_LOGIN, new Date().toISOString())
    await SecureStore.setItemAsync(OFFLINE_ACCESS_KEYS.USER_PROFILE, JSON.stringify(userProfile))
  } catch (error) {
    console.error('Erro ao salvar dados para acesso offline:', error)
  }
}

/**
 * Limpa os dados de acesso offline
 */
export async function clearOfflineAccessData() {
  try {
    await SecureStore.deleteItemAsync(OFFLINE_ACCESS_KEYS.SESSION_TOKEN)
    await SecureStore.deleteItemAsync(OFFLINE_ACCESS_KEYS.LAST_LOGIN)
    await SecureStore.deleteItemAsync(OFFLINE_ACCESS_KEYS.USER_PROFILE)
  } catch (error) {
    console.error('Erro ao limpar dados de acesso offline:', error)
  }
}

/**
 * Verifica autenticação biométrica para acesso offline
 */
export async function verifyBiometricForOfflineAccess(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique-se para acessar o modo offline',
      fallbackLabel: 'Usar senha',
      cancelLabel: 'Cancelar',
    })
    return result.success
  } catch (error) {
    console.error('Erro na autenticação biométrica:', error)
    return false
  }
} 