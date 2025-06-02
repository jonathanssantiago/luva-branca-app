/**
 * Componente Card moderno para exibir informações
 */

import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { useTheme } from 'react-native-paper'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  elevation?: number
  padding?: number
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 2,
  padding = 16,
}) => {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          elevation,
          shadowColor: theme.colors.shadow,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
})
