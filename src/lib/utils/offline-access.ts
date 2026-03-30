import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'

const OFFLINE_ACCESS_KEYS = {
  SESSION_TOKEN: 'offline_session_token',
  LAST_LOGIN: 'offline_last_login',
  USER_PROFILE: 'offline_user_profile',
}

const PRIVACY_SETTINGS_KEY = 'privacy_settings'

export interface OfflineAccessResult {
  hasAccess: boolean
  requiresBiometric: boolean
  message: string
  userProfile?: any
  biometricVerified?: boolean
}

/**
 * Utilitário para verificar se biometria está ativada nas configurações
 */
export async function isBiometricEnabledInSettings(): Promise<boolean> {
  try {
    const savedSettings = await SecureStore.getItemAsync(PRIVACY_SETTINGS_KEY)
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      return settings.biometricAuth === true
    }
    // Padrão é true conforme usePrivacySettings
    return true
  } catch (error) {
    console.log('Configurações de privacidade não encontradas, usando padrão')
    return true
  }
}

/**
 * Utilitário para verificar se biometria está disponível no dispositivo
 */
export async function isBiometricAvailable(): Promise<{
  hasHardware: boolean
  isEnrolled: boolean
  isAvailable: boolean
}> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    const isAvailable = hasHardware && isEnrolled

    return { hasHardware, isEnrolled, isAvailable }
  } catch (error) {
    console.error('Erro ao verificar disponibilidade biométrica:', error)
    return { hasHardware: false, isEnrolled: false, isAvailable: false }
  }
}

/**
 * Verifica se o usuário tem acesso offline baseado no último login e sessão salva
 * Agora executa verificação biométrica automaticamente se ativada
 */
export async function checkOfflineAccess(autoVerifyBiometric = true): Promise<OfflineAccessResult> {
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

    // Verificar se biometria está disponível no dispositivo
    const { isAvailable: biometricAvailable } = await isBiometricAvailable()

    // Verificar se biometria está ativada nas configurações
    const biometricEnabled = await isBiometricEnabledInSettings()

    console.log('🔐 Verificação offline - Estado:', {
      biometricAvailable,
      biometricEnabled,
      autoVerifyBiometric,
      sessionValid: hoursSinceLastLogin <= 24,
    })

    // Se biometria está habilitada e disponível, executar verificação automaticamente
    if (autoVerifyBiometric && biometricEnabled && biometricAvailable) {
      console.log('🔐 Biometria ativada - executando verificação automática')
      const biometricResult = await verifyBiometricForOfflineAccess()
      
      if (biometricResult) {
        return {
          hasAccess: true,
          requiresBiometric: false,
          biometricVerified: true,
          message: 'Acesso offline concedido via biometria',
          userProfile: userProfile ? JSON.parse(userProfile) : undefined,
        }
      } else {
        return {
          hasAccess: false,
          requiresBiometric: true,
          biometricVerified: false,
          message: 'Verificação biométrica necessária para acesso offline',
        }
      }
    }

    return {
      hasAccess: true,
      requiresBiometric: biometricAvailable && biometricEnabled,
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
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
      biometricsSecurityLevel: 'weak',
    })
    return result.success
  } catch (error) {
    console.error('Erro na autenticação biométrica:', error)
    return false
  }
} 