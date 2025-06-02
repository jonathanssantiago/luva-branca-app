/**
 * Componente de Loading
 */

import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { ActivityIndicator, useTheme } from 'react-native-paper'

interface LoadingProps {
  message?: string
  size?: 'small' | 'large'
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Carregando...',
  size = 'large',
}) => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={theme.colors.primary}
        style={styles.indicator}
      />
      <Text style={[styles.message, { color: theme.colors.onSurface }]}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
})
