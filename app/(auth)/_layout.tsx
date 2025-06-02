import { Stack } from 'expo-router'

import { Locales, StackHeader } from '@/lib'

const Layout = () => (
  <Stack
    screenOptions={{
      animation: 'slide_from_bottom',
      headerShown: false,
    }}
  >
    <Stack.Screen name="login" />
    <Stack.Screen name="signup" />
  </Stack>
)

export default Layout
