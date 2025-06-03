import React from 'react'
import { Stack } from 'expo-router'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { ActivityIndicator, View } from 'react-native'
import { Text } from 'react-native-paper'

const AuthNavigator = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Carregando...</Text>
      </View>
    )
  }

  return (
    <Stack>
      {user ? (
        // Usuário autenticado - mostrar telas principais
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="notifications"
            options={{ title: 'Notificações' }}
          />
          <Stack.Screen
            name="app-settings"
            options={{ title: 'Configurações', headerShown: false }}
          />
          <Stack.Screen
            name="personal-data"
            options={{ title: 'Dados Pessoais', headerShown: false }}
          />
          <Stack.Screen name="search" options={{ title: 'Buscar' }} />
          <Stack.Screen
            name="modal"
            options={{ title: 'Modal', presentation: 'modal' }}
          />
        </>
      ) : (
        // Usuário não autenticado - mostrar telas de auth
        <>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="forgot-password"
            options={{ title: 'Recuperar Senha' }}
          />
        </>
      )}
    </Stack>
  )
}

export default AuthNavigator
