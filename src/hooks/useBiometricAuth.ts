import { useState, useEffect, useCallback } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { usePrivacySettings } from './usePrivacySettings'

export interface BiometricAuthState {
  isAvailable: boolean
  isEnabled: boolean
  hasHardware: boolean
  isEnrolled: boolean
  loading: boolean
}

export interface BiometricAuthActions {
  checkAvailability: () => Promise<void>
  toggleBiometric: (enabled: boolean) => Promise<void>
  authenticate: (options?: {
    promptMessage?: string
    fallbackLabel?: string
    cancelLabel?: string
  }) => Promise<{ success: boolean; error?: string }>
  canAutoAuthenticate: () => Promise<boolean>
}

export interface UseBiometricAuthReturn extends BiometricAuthState, BiometricAuthActions {}

/**
 * Hook para gerenciar autenticação biométrica integrada com configurações de privacidade
 * 
 * Features:
 * - Integração completa com usePrivacySettings
 * - Verificação automática de disponibilidade
 * - Métodos para autenticação
 * - Estado centralizado da biometria
 */
export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const { settings, updateSetting } = usePrivacySettings()
  
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnabled: settings.biometricAuth,
    hasHardware: false,
    isEnrolled: false,
    loading: true,
  })

  // Sincronizar com configurações de privacidade
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isEnabled: settings.biometricAuth,
    }))
  }, [settings.biometricAuth])

  // Verificar disponibilidade da biometria
  const checkAvailability = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        setState(prev => ({
          ...prev,
          isAvailable: false,
          hasHardware: false,
          isEnrolled: false,
          loading: false,
        }))
        return
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      const isAvailable = hasHardware && isEnrolled

      setState(prev => ({
        ...prev,
        isAvailable,
        hasHardware,
        isEnrolled,
        loading: false,
      }))

      console.log('🔐 Biometria - Estado:', {
        hasHardware,
        isEnrolled,
        isAvailable,
        isEnabled: settings.biometricAuth,
      })
    } catch (error) {
      console.error('Erro ao verificar disponibilidade biométrica:', error)
      setState(prev => ({
        ...prev,
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        loading: false,
      }))
    }
  }, [settings.biometricAuth])

  // Ativar/desativar biometria (integra com configurações de privacidade)
  const toggleBiometric = useCallback(async (enabled: boolean) => {
    try {
      if (enabled && !state.isAvailable) {
        throw new Error('Biometria não está disponível neste dispositivo')
      }

      // Atualizar configurações de privacidade
      await updateSetting('biometricAuth', enabled)
      
      console.log(`🔐 Biometria ${enabled ? 'ativada' : 'desativada'} via configurações`)
    } catch (error) {
      console.error('Erro ao alterar configuração biométrica:', error)
      throw error
    }
  }, [state.isAvailable, updateSetting])

  // Autenticar com biometria
  const authenticate = useCallback(async (options: {
    promptMessage?: string
    fallbackLabel?: string
    cancelLabel?: string
  } = {}) => {
    try {
      if (Platform.OS === 'web') {
        return { 
          success: false, 
          error: 'Autenticação biométrica não disponível na web' 
        }
      }

      if (!state.isAvailable) {
        return { 
          success: false, 
          error: 'Biometria não disponível neste dispositivo' 
        }
      }

      if (!state.isEnabled) {
        return { 
          success: false, 
          error: 'Biometria está desativada nas configurações' 
        }
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Autentique-se para continuar',
        fallbackLabel: options.fallbackLabel || 'Usar senha',
        cancelLabel: options.cancelLabel || 'Cancelar',
      })

      if (result.success) {
        console.log('✅ Autenticação biométrica bem-sucedida')
        return { success: true }
      } else {
        console.log('❌ Autenticação biométrica falhou:', result.error)
        return { 
          success: false, 
          error: result.error || 'Falha na autenticação biométrica' 
        }
      }
    } catch (error) {
      console.error('Erro durante autenticação biométrica:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }, [state.isAvailable, state.isEnabled])

  // Verificar se pode fazer autenticação automática
  const canAutoAuthenticate = useCallback(async (): Promise<boolean> => {
    return state.isAvailable && state.isEnabled && !state.loading
  }, [state.isAvailable, state.isEnabled, state.loading])

  // Verificar disponibilidade ao montar o hook
  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  return {
    // State
    isAvailable: state.isAvailable,
    isEnabled: state.isEnabled,
    hasHardware: state.hasHardware,
    isEnrolled: state.isEnrolled,
    loading: state.loading,
    // Actions
    checkAvailability,
    toggleBiometric,
    authenticate,
    canAutoAuthenticate,
  }
} 