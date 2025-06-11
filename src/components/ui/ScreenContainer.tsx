/**
 * Container para telas que garante espaçamento adequado
 */

import React, { useMemo } from 'react'
import {
  FlatList,
  View,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native'
import { Surface } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenContainerProps {
  children: React.ReactNode
  scrollable?: boolean
  style?: ViewStyle
  contentStyle?: ViewStyle
  paddingHorizontal?: number
  paddingVertical?: number
  hideTabBar?: boolean
  keyboardAvoiding?: boolean
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
  contentStyle,
  paddingHorizontal = 16,
  paddingVertical = 16,
  hideTabBar = false,
  keyboardAvoiding = true,
}) => {
  const insets = useSafeAreaInsets()

  // Altura fixa da TabBar (80px) + safe area bottom + padding extra para garantir visibilidade
  const tabBarHeight = hideTabBar ? 0 : 80 + insets.bottom + 100 // Adiciona 100px de padding extra

  // Memoiza o containerStyle para evitar mutações
  const containerStyle: ViewStyle = useMemo(() => {
    const baseStyle: ViewStyle = {
      flex: 1,
      paddingHorizontal,
      paddingTop: paddingVertical,
      paddingBottom: paddingVertical + tabBarHeight,
    }

    // Cria uma nova instância combinando os estilos de forma segura
    return Object.assign({}, baseStyle, contentStyle)
  }, [paddingHorizontal, paddingVertical, tabBarHeight, contentStyle])

  const renderContent = () => {
    if (scrollable) {
      return (
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => <View style={containerStyle}>{children}</View>}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="never"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          accessibilityRole="none"
          accessibilityLabel="Conteúdo da tela"
        />
      )
    }

    return (
      <View style={containerStyle} accessibilityRole="none">
        {children}
      </View>
    )
  }

  const content = renderContent()

  if (keyboardAvoiding) {
    return (
      <Surface style={[{ flex: 1 }, style]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          enabled={Platform.OS === 'ios'}
        >
          {content}
        </KeyboardAvoidingView>
      </Surface>
    )
  }

  return <Surface style={[{ flex: 1 }, style]}>{content}</Surface>
}
