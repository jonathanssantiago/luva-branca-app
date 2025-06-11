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
import React, { useContext, useEffect, useState, useRef } from 'react'
import { Platform, useColorScheme } from 'react-native'
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper'
import * as LocalAuthentication from 'expo-local-authentication'

import { Locales, Setting, StackHeader, Themes } from '@/lib'
import { NotificationProvider } from '@/src/context/NotificationContext'
import { AuthProvider, useAuth } from '@/src/context/SupabaseAuthContext'
import { DisguisedModeProvider } from '@/src/context/DisguisedModeContext'
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext'
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings'
import { PermissionsManager } from '@/src/components/PermissionsManager'
import CustomSplashScreen from './components/SplashScreen'

// Previne que o splash screen nativo seja ocultado automaticamente
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
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setIsReady(true)
        // Oculta o splash screen nativo após carregar as fontes
        SplashScreen.hideAsync()
      }, 500)
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
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  // Load settings from the device
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      SecureStore.getItemAsync('settings').then((result) => {
        if (result === null) {
          SecureStore.setItemAsync('settings', JSON.stringify(settings)).then(
            () => console.log('Settings initialized'),
          )
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

  // Lógica de navegação centralizada e simplificada
  useEffect(() => {
    // Limpar timeout anterior se existir
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
      navigationTimeoutRef.current = null
    }

    // Aguardar carregamento completo antes de navegar
    const isLoadingComplete = !authLoading && !privacyLoading

    if (isLoadingComplete && !hasNavigated) {
      console.log('🚀 Iniciando navegação...')

      // Adicionar um pequeno delay para garantir que todos os estados estão sincronizados
      navigationTimeoutRef.current = setTimeout(() => {
        try {
          // Determinar rota baseado nos estados centralizados
          if (user || isOfflineMode) {
            // Usuário autenticado ou modo offline
            if (privacySettings.disguisedMode) {
              console.log('➡️ Navegando para modo disfarçado')
              router.replace('/disguised-mode')
            } else {
              console.log('➡️ Navegando para tabs principais')
              router.replace('/(tabs)')
            }
          } else {
            // Usuário não autenticado
            console.log('➡️ Navegando para login')
            router.replace('/(auth)/login')
          }

          setHasNavigated(true)
        } catch (error) {
          console.error('❌ Erro durante navegação:', error)
        } finally {
          navigationTimeoutRef.current = null
        }
      }, 150) // Delay mínimo para sincronização
    }

    // Cleanup timeout
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
        navigationTimeoutRef.current = null
      }
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

  // Reset navegação quando houver mudanças significativas nos estados de autenticação
  useEffect(() => {
    // Reset apenas se não estiver carregando
    if (!authLoading && !privacyLoading) {
      setHasNavigated(false)
    }
  }, [user?.id, sessionRestored, isOfflineMode, authLoading, privacyLoading])

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
            <PermissionsManager userId={user?.id}>
              <Stack
                screenOptions={{
                  animation: 'slide_from_bottom',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="disguised-mode"
                  options={{
                    headerShown: false,
                    animation: 'fade',
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
              <StatusBar style={isDark ? 'light' : 'dark'} />
            </PermissionsManager>
          </NotificationProvider>
        </DisguisedModeProvider>
      </PaperProvider>
    </NavigationThemeProvider>
  )
}

export default RootLayout
