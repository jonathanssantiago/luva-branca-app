import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs, router } from 'expo-router'
import React, { useContext, useState, useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Appbar, Menu, Tooltip, Text } from 'react-native-paper'

import { Locales, TabBar } from '@/lib'
import { useAuth } from '@/src/context/SupabaseAuthContext'

const TabLayout = () => {
  const [visible, setVisible] = useState(false)
  const { user, loading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login')
    }
  }, [user, loading])

  // Show loading while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Verificando autenticação...</Text>
      </View>
    )
  }

  // Don't render tabs if user is not authenticated
  if (!user) {
    return null
  }

  const handleMenuDismiss = () => setVisible(false)
  const handleMenuPress = () => setVisible(true)

  const navigateToSettings = () => {
    setVisible(false)
    router.push('/(tabs)/settings')
  }

  const handleLogout = () => {
    setVisible(false)
    router.push('/(auth)/login')
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOS',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              {...props}
              size={28}
              name="alarm-light-outline"
              color={props.focused ? '#FFFFFF' : '#666'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="guardioes"
        options={{
          title: 'Rede',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              {...props}
              size={26}
              name="account-group"
              color={props.focused ? '#FFFFFF' : '#666'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orientacao"
        options={{
          title: 'Guia',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              {...props}
              size={26}
              name="book-open-outline"
              color={props.focused ? '#FFFFFF' : '#666'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="apoio"
        options={{
          title: 'Apoio',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              {...props}
              size={26}
              name="heart-multiple-outline"
              color={props.focused ? '#FFFFFF' : '#666'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Menu',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              {...props}
              size={26}
              name="menu"
              color={props.focused ? '#FFFFFF' : '#666'}
            />
          ),
        }}
      />

      {/* Telas secundárias - não aparecem na barra de navegação */}
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'Documentos',
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: '#FF3B7C' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Appbar.BackAction color="#fff" onPress={() => router.back()} />
          ),
        }}
      />

      <Tabs.Screen
        name="arquivo"
        options={{
          title: 'Gravações',
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: '#EA5455' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Appbar.BackAction color="#fff" onPress={() => router.back()} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: '#666666' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Appbar.BackAction color="#fff" onPress={() => router.back()} />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabLayout
