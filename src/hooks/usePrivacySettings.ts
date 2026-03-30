import React, { useState, useEffect, createContext, useContext } from 'react'
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

interface PrivacySettingsContextValue {
  settings: PrivacySettings
  loading: boolean
  updateSetting: <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ) => Promise<void>
  resetSettings: () => Promise<void>
}

const PrivacySettingsContext = createContext<PrivacySettingsContextValue | null>(null)

export const PrivacySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return React.createElement(
    PrivacySettingsContext.Provider,
    { value: { settings, loading, updateSetting, resetSettings } },
    children,
  )
}

/**
 * Hook to consume privacy settings. Can be used standalone (creates its own
 * local state) or inside a PrivacySettingsProvider (shared single read).
 */
export const usePrivacySettings = () => {
  const ctx = useContext(PrivacySettingsContext)
  if (ctx) return ctx

  // Fallback: standalone usage outside provider (backward compat)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    ;(async () => {
      try {
        if (Platform.OS !== 'web') {
          const saved = await SecureStore.getItemAsync(PRIVACY_SETTINGS_KEY)
          if (saved) setSettings(JSON.parse(saved))
        }
      } catch (e) {
        console.error('Erro ao carregar configurações de privacidade:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateSetting = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(PRIVACY_SETTINGS_KEY, JSON.stringify(newSettings))
    }
  }

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS)
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(PRIVACY_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
    }
  }

  return { settings, loading, updateSetting, resetSettings }
}
