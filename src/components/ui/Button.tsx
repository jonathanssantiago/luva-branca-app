/**
 * Componente Button customizado com design moderno
 */

import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from 'react-native-paper'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const theme = useTheme()

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    }

    // Size
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = 8
        baseStyle.paddingHorizontal = 16
        baseStyle.minHeight = 36
        break
      case 'large':
        baseStyle.paddingVertical = 16
        baseStyle.paddingHorizontal = 24
        baseStyle.minHeight = 56
        break
      default:
        baseStyle.paddingVertical = 12
        baseStyle.paddingHorizontal = 20
        baseStyle.minHeight = 48
    }

    // Variant
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = theme.colors.secondary
        break
      case 'danger':
        baseStyle.backgroundColor = theme.colors.error
        break
      case 'outline':
        baseStyle.backgroundColor = 'transparent'
        baseStyle.borderWidth = 1
        baseStyle.borderColor = theme.colors.primary
        break
      default:
        baseStyle.backgroundColor = theme.colors.primary
    }

    if (disabled) {
      baseStyle.opacity = 0.5
    }

    return baseStyle
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    }

    // Size
    switch (size) {
      case 'small':
        baseStyle.fontSize = 14
        break
      case 'large':
        baseStyle.fontSize = 18
        break
      default:
        baseStyle.fontSize = 16
    }

    // Variant
    switch (variant) {
      case 'outline':
        baseStyle.color = theme.colors.primary
        break
      default:
        baseStyle.color = theme.colors.onPrimary
    }

    return baseStyle
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <Text style={[getTextStyle(), textStyle]}>
        {loading ? 'Carregando...' : title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Estilos adicionais se necessário
})
