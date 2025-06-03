import { MaterialCommunityIcons } from '@expo/vector-icons'
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans'
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as Localization from 'expo-localization'
import { router, Stack } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { StatusBar } from 'expo-status-bar'
import React, { useContext, useEffect, useState } from 'react'
import { Platform, useColorScheme } from 'react-native'
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper'
import * as LocalAuthentication from 'expo-local-authentication'

import { Locales, Setting, StackHeader, Themes } from '@/lib'
import { NotificationProvider } from '@/src/context/NotificationContext'
import { AuthProvider, useAuth } from '@/src/context/SupabaseAuthContext'
import { DisguisedModeProvider } from '@/src/context/DisguisedModeContext'
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings'
import SplashScreen from './components/SplashScreen'

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
      }, 500)
    }
  }, [loaded])

  if (!loaded || !isReady) {
    return <SplashScreen />
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}

const RootLayoutNav = () => {
  const colorScheme = useColorScheme()
  const [settings, setSettings] = React.useState<Setting>({
    theme: 'auto',
    color: 'default',
    language: 'pt',
  })

  const { user, attemptBiometricLogin } = useAuth()
  const { settings: privacySettings, loading: privacyLoading } =
    usePrivacySettings()
  const [biometricAttempted, setBiometricAttempted] = useState(false)

  // Load settings from the device
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      SecureStore.getItemAsync('settings').then((result) => {
        if (result === null) {
          SecureStore.setItemAsync('settings', JSON.stringify(settings)).then(
            (res) => console.log(res),
          )
        }

        setSettings(JSON.parse(result ?? JSON.stringify(settings)))
      })
    } else {
      setSettings({ ...settings, theme: colorScheme ?? 'light' })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attempt biometric login when app starts
  React.useEffect(() => {
    const attemptBiometricAuth = async () => {
      if (!user && !biometricAttempted) {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync()
          const isEnrolled = await LocalAuthentication.isEnrolledAsync()
          
          if (hasHardware && isEnrolled) {
            const { success } = await attemptBiometricLogin()
            if (success) {
              console.log('Biometric login successful')
            }
          }
        } catch (error) {
          console.error('Biometric login error:', error)
        } finally {
          setBiometricAttempted(true)
        }
      }
    }

    attemptBiometricAuth()
  }, [user, biometricAttempted, attemptBiometricLogin])

  React.useEffect(() => {
    if (settings.language === 'auto') {
      Locales.locale = Localization.getLocales()[0].languageCode ?? 'pt'
    } else {
      Locales.locale = settings.language
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    console.log('=== DEBUG NAVEGAÇÃO ===')
    console.log('user:', user ? 'LOGADO' : 'NÃO LOGADO')
    console.log('privacyLoading:', privacyLoading)
    console.log('disguisedMode:', privacySettings.disguisedMode)

    if (!privacyLoading) {
      if (user) {
        // Se o modo disfarçado estiver ativo, mostrar a tela disfarçada
        if (privacySettings.disguisedMode) {
          console.log('Redirecionando para modo disfarçado')
          router.replace('/disguised-mode')
        } else {
          console.log('Redirecionando para tabs')
          router.replace('/(tabs)')
        }
      } else {
        console.log('Redirecionando para login')
        router.replace('/(auth)/login')
      }
    }
  }, [user, privacySettings.disguisedMode, privacyLoading])

  const theme =
    Themes[
      settings.theme === 'auto' ? (colorScheme ?? 'dark') : settings.theme
    ][settings.color]

  const { DarkTheme, LightTheme } = adaptNavigationTheme({
    reactNavigationDark: NavDarkTheme,
    reactNavigationLight: NavLightTheme,
    materialDark: Themes.dark[settings.color],
    materialLight: Themes.light[settings.color],
  })

  return (
    <ThemeProvider
      value={
        colorScheme === 'light'
          ? { ...LightTheme, fonts: NavLightTheme.fonts }
          : { ...DarkTheme, fonts: NavDarkTheme.fonts }
      }
    >
      <PaperProvider theme={theme}>
        <DisguisedModeProvider>
          <NotificationProvider>
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
                name="app-settings"
                options={{
                  title: 'Configurações',
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
            </Stack>
          </NotificationProvider>
        </DisguisedModeProvider>
      </PaperProvider>

      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

export default RootLayout
