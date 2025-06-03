import { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export interface PrivacySettings {
  shareLocation: boolean
  shareUsageData: boolean
  allowAnalytics: boolean
  shareWithPartners: boolean
  biometricAuth: boolean
  autoLock: boolean
  lockTimeout: '1min' | '5min' | '15min' | '30min'
  hideContent: boolean
  disguisedMode: boolean
}

const DEFAULT_SETTINGS: PrivacySettings = {
  shareLocation: false,
  shareUsageData: false,
  allowAnalytics: true,
  shareWithPartners: false,
  biometricAuth: true,
  autoLock: true,
  lockTimeout: '5min',
  hideContent: false,
  disguisedMode: false,
}

const PRIVACY_SETTINGS_KEY = 'privacy_settings'

export const usePrivacySettings = () => {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      if (Platform.OS !== 'web') {
        const savedSettings =
          await SecureStore.getItemAsync(PRIVACY_SETTINGS_KEY)
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de privacidade:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ) => {
    try {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)

      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(
          PRIVACY_SETTINGS_KEY,
          JSON.stringify(newSettings),
        )
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
    }
  }

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS)
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(
          PRIVACY_SETTINGS_KEY,
          JSON.stringify(DEFAULT_SETTINGS),
        )
      }
    } catch (error) {
      console.error('Erro ao resetar configurações:', error)
    }
  }

  return {
    settings,
    loading,
    updateSetting,
    resetSettings,
  }
}
