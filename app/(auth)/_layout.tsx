import { Stack } from 'expo-router'

import { Locales, StackHeader } from '@/lib'

const Layout = () => (
  <Stack
    screenOptions={{
      animation: 'fade',
      headerShown: false,
    }}
  >
    <Stack.Screen name="login" />
    <Stack.Screen name="signup" />
    <Stack.Screen name="verify-email" />
    <Stack.Screen name="forgot-password" />
  </Stack>
)

export default Layout
