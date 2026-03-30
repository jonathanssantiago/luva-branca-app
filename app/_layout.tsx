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
import React, { useEffect, useState, useRef } from 'react'
import { Platform, StyleSheet, useColorScheme, View } from 'react-native'
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper'
import * as LocalAuthentication from 'expo-local-authentication'

import { Locales, Setting, StackHeader, Themes } from '@/lib'
import { NotificationProvider } from '@/src/context/NotificationContext'
import { AuthProvider, useAuth } from '@/src/context/SupabaseAuthContext'
import { DisguisedModeProvider } from '@/src/context/DisguisedModeContext'
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext'
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings'
import { PermissionsManager } from '@/src/components/PermissionsManager'
import { DatabaseProvider } from '@/src/providers/DatabaseProvider'
import CustomSplashScreen from './components/SplashScreen'

SplashScreen.preventAutoHideAsync()

// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from 'expo-router'

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = { initialRouteName: '(tabs)' }

const RootLayout = () => {
  const [loaded, error] = useFonts({
    NotoSans_400Regular,
    JetBrainsMono_400Regular,
    ...MaterialCommunityIcons.font,
  })
  const [isReady, setIsReady] = useState(false)

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  React.useEffect(() => {
    if (error) throw error
  }, [error])

  React.useEffect(() => {
    if (loaded) {
      setIsReady(true)
    }
  }, [loaded])

  if (!loaded || !isReady) {
    return <CustomSplashScreen />
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
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
    sessionRestored,
    isOfflineMode,
  } = useAuth()
  const { settings: privacySettings, loading: privacyLoading } =
    usePrivacySettings()

  const [hasNavigated, setHasNavigated] = useState(false)
  const [isNavigationReady, setIsNavigationReady] = useState(false)

  // Load settings from the device
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

  useEffect(() => {
    const isLoadingComplete = !authLoading && !privacyLoading

    if (isLoadingComplete && !hasNavigated) {
      try {
        if (user || isOfflineMode) {
          if (privacySettings.disguisedMode) {
            router.replace('/disguised-mode')
          } else {
            router.replace('/(tabs)')
          }
        } else {
          router.replace('/(auth)/login')
        }
      } catch (error) {
        console.error('❌ Erro durante navegação:', error)
      }

      setHasNavigated(true)

      setTimeout(() => {
        SplashScreen.hideAsync()
        setIsNavigationReady(true)
      }, 300)
    }
  }, [
    authLoading,
    privacyLoading,
    user,
    sessionRestored,
    isOfflineMode,
    privacySettings.disguisedMode,
    hasNavigated,
  ])

  // Reset navegação apenas em mudanças reais de estado de autenticação
  // (login/logout), não durante a navegação inicial
  const prevUserRef = useRef<string | undefined>(undefined)
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (authLoading || privacyLoading) return

    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      prevUserRef.current = user?.id
      return
    }

    const userChanged = prevUserRef.current !== user?.id
    prevUserRef.current = user?.id

    if (userChanged) {
      setHasNavigated(false)
      setIsNavigationReady(false)
    }
  }, [user?.id, authLoading, privacyLoading])

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
