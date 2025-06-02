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

import { Locales, Setting, StackHeader, Themes } from '@/lib'
import { AuthContext, AuthProvider } from '@/src/context/AuthContext'
import { NotificationProvider } from '@/src/context/NotificationContext'
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

  return <RootLayoutNav />
}

const RootLayoutNav = () => {
  const colorScheme = useColorScheme()
  const [settings, setSettings] = React.useState<Setting>({
    theme: 'auto',
    color: 'default',
    language: 'pt',
  })

  const { user } = useContext(AuthContext)

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

  React.useEffect(() => {
    if (settings.language === 'auto') {
      Locales.locale = Localization.getLocales()[0].languageCode ?? 'pt'
    } else {
      Locales.locale = settings.language
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // useEffect(() => {
  //   if (user) {
  //     router.replace('/(tabs)')
  //   } else {
  //     console.log(2121221)
  //     router.replace('/(auth)/login')
  //   }
  // }, [user, router])

  useEffect(() => {
    console.log('mudou ---')
  }, [])

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
        <AuthProvider>
          <NotificationProvider>
            <Stack
              screenOptions={{
                animation: 'slide_from_bottom',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
        </AuthProvider>
      </PaperProvider>

      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

export default RootLayout
