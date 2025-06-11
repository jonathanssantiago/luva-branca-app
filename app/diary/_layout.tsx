import { Stack } from 'expo-router'

export default function DiaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="view/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  )
} 