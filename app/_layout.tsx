import { MaterialCommunityIcons } from '@expo/vector-icons'
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans'
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as Localization from 'expo-localization'
import { router, Stack } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { AppState, AppStateStatus, Platform, StyleSheet, useColorScheme, View } from 'react-native'
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper'

import { Locales, Setting } from '@/lib'
import { NotificationProvider } from '@/src/context/NotificationContext'
import { AuthProvider, useAuth } from '@/src/context/SupabaseAuthContext'
import { DisguisedModeProvider } from '@/src/context/DisguisedModeContext'
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext'
import { usePrivacySettings, PrivacySettingsProvider } from '@/src/hooks/usePrivacySettings'
import { PermissionsManager } from '@/src/components/PermissionsManager'
import { DatabaseProvider } from '@/src/providers/DatabaseProvider'
import BiometricLockScreen from '@/src/components/BiometricLockScreen'
import CustomSplashScreen from './components/SplashScreen'

SplashScreen.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = { initialRouteName: '(tabs)' }

// Module-level flags survive component remounts caused by Expo Router navigation
let didInitialNavigate = false
let splashHidden = false
let biometricChecked = false

const LOCK_TIMEOUT_MAP: Record<string, number> = {
  '1min': 60_000,
  '5min': 300_000,
  '15min': 900_000,
  '30min': 1_800_000,
}

const RootLayout = () => {
  const [loaded, error] = useFonts({
    NotoSans_400Regular,
    JetBrainsMono_400Regular,
    ...MaterialCommunityIcons.font,
  })
  const [isReady, setIsReady] = useState(false)

  React.useEffect(() => {
    if (error) throw error
  }, [error])

  React.useEffect(() => {
    if (loaded) setIsReady(true)
  }, [loaded])

  if (!loaded || !isReady) {
    return <CustomSplashScreen />
  }

  return (
    <AuthProvider>
      <PrivacySettingsProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </PrivacySettingsProvider>
    </AuthProvider>
  )
}

const RootLayoutNav = () => {
  const colorScheme = useColorScheme() ?? 'light'
  const { theme, isDark } = useTheme()

  const [settings, setSettings] = React.useState<Setting>({
    theme: 'auto',
    color: 'default',
    language: 'pt',
  })

  const {
    user,
    loading: authLoading,
    isOfflineMode,
    signOut,
  } = useAuth()
  const { settings: privacySettings, loading: privacyLoading } =
    usePrivacySettings()

  const [isNavigationReady, setIsNavigationReady] = useState(splashHidden)
  const [isLocked, setIsLocked] = useState(false)
  const backgroundTimestamp = useRef<number | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  const shouldRequireBiometric =
    (user || isOfflineMode) &&
    privacySettings.biometricAuth &&
    !privacyLoading &&
    Platform.OS !== 'web'

  const handleBiometricSuccess = useCallback(() => {
    setIsLocked(false)
  }, [])

  const handleFallbackLogin = useCallback(async () => {
    setIsLocked(false)
    biometricChecked = false
    await signOut()
    didInitialNavigate = false
    router.replace('/(auth)/login')
  }, [signOut])

  // Cold-start biometric: evaluate exactly once after both loaders finish
  useEffect(() => {
    if (authLoading || privacyLoading || biometricChecked) return
    biometricChecked = true
    if (shouldRequireBiometric) {
      setIsLocked(true)
    }
  }, [authLoading, privacyLoading, shouldRequireBiometric])

  // Background-return biometric lock
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const wasBackground =
          appStateRef.current === 'background' ||
          appStateRef.current === 'inactive'
        const isActive = nextAppState === 'active'

        if (wasBackground && isActive && shouldRequireBiometric) {
          const timeoutMs =
            LOCK_TIMEOUT_MAP[privacySettings.lockTimeout] ?? 300_000
          const elapsed = backgroundTimestamp.current
            ? Date.now() - backgroundTimestamp.current
            : Infinity

          if (elapsed >= timeoutMs) {
            setIsLocked(true)
          }
        }

        if (nextAppState === 'background' || nextAppState === 'inactive') {
          backgroundTimestamp.current = Date.now()
        }

        appStateRef.current = nextAppState
      },
    )

    return () => subscription.remove()
  }, [shouldRequireBiometric, privacySettings.lockTimeout])

  // Load locale/theme settings from device
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      SecureStore.getItemAsync('settings').then((result) => {
        if (result === null) {
          SecureStore.setItemAsync('settings', JSON.stringify(settings))
        }
        setSettings(JSON.parse(result ?? JSON.stringify(settings)))
      })
    } else {
      setSettings({ ...settings, theme: colorScheme ?? 'light' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (settings.language === 'auto') {
      Locales.locale = Localization.getLocales()[0].languageCode ?? 'pt'
    } else {
      Locales.locale = settings.language
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initial navigation — runs exactly once using module-level flag
  useEffect(() => {
    if (authLoading || privacyLoading || didInitialNavigate) return

    let target: string
    if (user || isOfflineMode) {
      target = privacySettings.disguisedMode ? '/disguised-mode' : '/(tabs)'
    } else {
      target = '/(auth)/login'
    }

    didInitialNavigate = true

    try {
      router.replace(target as any)
    } catch (err) {
      console.error('Navigation error:', err)
    }

    setTimeout(() => {
      splashHidden = true
      SplashScreen.hideAsync()
      setIsNavigationReady(true)
    }, 300)
  }, [authLoading, privacyLoading, user, isOfflineMode, privacySettings.disguisedMode])

  // Safety timeout: force navigation if init hangs
  useEffect(() => {
    if (didInitialNavigate) return
    const timeout = setTimeout(() => {
      if (!didInitialNavigate) {
        didInitialNavigate = true
        splashHidden = true
        router.replace('/(auth)/login')
        SplashScreen.hideAsync()
        setIsNavigationReady(true)
      }
    }, 10_000)
    return () => clearTimeout(timeout)
  }, [])

  // React to auth state changes after the initial navigation has settled.
  // Navigates directly instead of resetting flags and waiting for another
  // effect cycle, which was unreliable due to React batching.
  const SENTINEL = '__initial__'
  const prevUserRef = useRef<string>(SENTINEL)
  useEffect(() => {
    if (authLoading || privacyLoading) return
    const currentId = user?.id ?? ''
    const prevId = prevUserRef.current

    if (prevId === SENTINEL) {
      prevUserRef.current = currentId
      return
    }

    const userChanged = prevId !== currentId
    prevUserRef.current = currentId

    if (!userChanged) return

    biometricChecked = false

    // Navigate directly based on new auth state
    let target: string
    if (user || isOfflineMode) {
      target = privacySettings.disguisedMode ? '/disguised-mode' : '/(tabs)'
    } else {
      target = '/(auth)/login'
    }

    try {
      router.replace(target as any)
    } catch (err) {
      console.error('Re-navigation error:', err)
    }
  }, [user?.id, authLoading, privacyLoading, isOfflineMode, privacySettings.disguisedMode])

  const { DarkTheme, LightTheme } = adaptNavigationTheme({
    reactNavigationDark: NavDarkTheme,
    reactNavigationLight: NavLightTheme,
    materialDark: theme,
    materialLight: theme,
  })

  return (
    <NavigationThemeProvider
      value={
        isDark
          ? { ...DarkTheme, fonts: NavDarkTheme.fonts }
          : { ...LightTheme, fonts: NavLightTheme.fonts }
      }
    >
      <PaperProvider theme={theme}>
        <DisguisedModeProvider>
          <NotificationProvider>
            <DatabaseProvider>
              <PermissionsManager userId={user?.id}>
                <View style={{ flex: 1 }}>
                  <Stack
                    screenOptions={{
                      animation: 'slide_from_bottom',
                    }}
                  >
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false, animation: 'none' }}
                    />
                    <Stack.Screen
                      name="disguised-mode"
                      options={{
                        headerShown: false,
                        animation: 'none',
                      }}
                    />
                    <Stack.Screen
                      name="notifications"
                      options={{
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name="privacy"
                      options={{
                        title: 'Privacidade',
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name="personal-data"
                      options={{
                        title: 'Dados Pessoais',
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name="search"
                      options={{ title: Locales.t('search') }}
                    />
                    <Stack.Screen
                      name="modal"
                      options={{
                        title: Locales.t('titleModal'),
                        presentation: 'modal',
                      }}
                    />
                    <Stack.Screen
                      name="diary"
                      options={{
                        headerShown: false,
                      }}
                    />
                  </Stack>
                  {!isNavigationReady && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { zIndex: 999, elevation: 999 },
                      ]}
                    >
                      <CustomSplashScreen />
                    </View>
                  )}
                  {isLocked && isNavigationReady && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { zIndex: 1000, elevation: 1000 },
                      ]}
                    >
                      <BiometricLockScreen
                        onSuccess={handleBiometricSuccess}
                        onFallbackLogin={handleFallbackLogin}
                      />
                    </View>
                  )}
                </View>
                <StatusBar style={isDark ? 'light' : 'dark'} />
              </PermissionsManager>
            </DatabaseProvider>
          </NotificationProvider>
        </DisguisedModeProvider>
      </PaperProvider>
    </NavigationThemeProvider>
  )
}

export default RootLayout
