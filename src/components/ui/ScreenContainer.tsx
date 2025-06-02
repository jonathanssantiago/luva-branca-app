/**
 * Container para telas que garante espaçamento adequado
 */

import React, { useEffect } from 'react'
import { FlatList, View, ViewStyle, Keyboard, Platform } from 'react-native'
import { Surface } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenContainerProps {
  children: React.ReactNode
  scrollable?: boolean
  style?: ViewStyle
  contentStyle?: ViewStyle
  paddingHorizontal?: number
  paddingVertical?: number
  keyboardAvoidingView?: boolean
  hideTabBar?: boolean
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
  contentStyle,
  paddingHorizontal = 16,
  paddingVertical = 16,
  keyboardAvoidingView = false,
  hideTabBar = false,
}) => {
  const insets = useSafeAreaInsets()

  // Altura fixa da TabBar (80px) + safe area bottom + padding extra para garantir visibilidade
  const tabBarHeight = hideTabBar ? 0 : 80 + insets.bottom + 100 // Adiciona 100px de padding extra

  const containerStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal,
    paddingTop: paddingVertical,
    paddingBottom: paddingVertical + tabBarHeight, // Espaço para a tab bar + padding extra
    ...contentStyle,
  }

  // Ajusta o padding quando o teclado está visível
  useEffect(() => {
    if (keyboardAvoidingView) {
      const keyboardWillShow = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        () => {
          // Ajusta o padding quando o teclado aparece
          containerStyle.paddingBottom = paddingVertical
        }
      )

      const keyboardWillHide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          // Restaura o padding quando o teclado desaparece
          containerStyle.paddingBottom = paddingVertical + tabBarHeight
        }
      )

      return () => {
        keyboardWillShow.remove()
        keyboardWillHide.remove()
      }
    }
  }, [keyboardAvoidingView, paddingVertical, tabBarHeight])

  if (scrollable) {
    return (
      <Surface style={[{ flex: 1 }, style]}>
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => (
            <View style={containerStyle}>
              {children}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          accessibilityRole="none"
          accessibilityLabel="Conteúdo da tela"
        />
      </Surface>
    )
  }

  return (
    <Surface style={[{ flex: 1 }, style]}>
      <View 
        style={containerStyle}
        accessibilityRole="none"
      >
        {children}
      </View>
    </Surface>
  )
} 