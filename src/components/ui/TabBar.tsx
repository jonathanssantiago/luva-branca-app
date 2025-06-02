import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import React, { useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'

// Telas que devem ser ocultadas da barra de navegação
const hiddenTabs = ['documentos', 'arquivo', 'settings']

export const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  
  // Filtra as rotas visíveis
  const visibleRoutes = useMemo(() => 
    state.routes.filter(route => !hiddenTabs.includes(route.name)),
    [state.routes]
  )

  // Configuração específica para cada aba
  const getTabConfig = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'index': // Tela principal SOS
        return {
          icon: 'alarm-light-outline',
          label: 'SOS',
          backgroundColor: '#FF3B7C',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          accessibilityLabel: 'Botão de emergência SOS',
        }
      case 'guardioes': // Tela de guardiões -> "Rede" de apoio
        return {
          icon: 'account-group',
          label: 'Rede',
          backgroundColor: 'transparent',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          accessibilityLabel: 'Rede de apoio e guardiões',
        }
      case 'orientacao': // Tela de orientações -> "Orientações"
        return {
          icon: 'book-open-outline',
          label: 'Orientações',
          backgroundColor: 'transparent',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          accessibilityLabel: 'Orientações e informações',
        }
      case 'apoio': // Tela de apoio psicológico -> "Apoio"
        return {
          icon: 'heart-multiple-outline',
          label: 'Apoio',
          backgroundColor: 'transparent',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          accessibilityLabel: 'Apoio psicológico',
        }
      case 'profile': // Tela de perfil/menu
        return {
          icon: 'menu',
          label: 'Menu',
          backgroundColor: 'transparent',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          accessibilityLabel: 'Menu de configurações',
        }
      default:
        return {
          icon: 'circle',
          label: routeName,
          backgroundColor: 'transparent',
          textColor: '#FFFFFF',
          iconColor: '#FFFFFF',
          accessibilityLabel: routeName,
        }
    }
  }

  const tabBarStyle = useMemo(() => ({
    height: 80 + insets.bottom, // Altura fixa + safe area
    paddingBottom: insets.bottom,
  }), [insets.bottom])

  return (
    <View 
      style={[styles.container, tabBarStyle]}
      accessibilityLabel="Barra de navegação principal"
    >
      <View style={styles.content}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === state.routes.findIndex(r => r.key === route.key)
          const tabConfig = getTabConfig(route.name, isFocused)

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            })
          }

          // Estilo especial para o botão SOS
          if (route.name === 'index') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.sosButton, { backgroundColor: tabConfig.backgroundColor }]}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={tabConfig.accessibilityLabel}
                accessibilityHint="Toque para ativar o modo de emergência"
              >
                <MaterialCommunityIcons
                  name={tabConfig.icon as any}
                  size={28}
                  color={tabConfig.iconColor}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
                <Text 
                  style={[styles.sosButtonText, { color: tabConfig.textColor }]}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                >
                  {tabConfig.label}
                </Text>
              </TouchableOpacity>
            )
          }

          // Estilo padrão para outras abas
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, { opacity: isFocused ? 1 : 0.7 }]}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={tabConfig.accessibilityLabel}
              accessibilityHint={`Toque para navegar para ${tabConfig.label}`}
            >
              <MaterialCommunityIcons
                name={tabConfig.icon as any}
                size={24}
                color={tabConfig.iconColor}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
              <Text 
                style={[styles.tabButtonText, { color: tabConfig.textColor }]}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              >
                {tabConfig.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#333333',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sosButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
    minHeight: 48,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FF3B7C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sosButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
    minHeight: 48,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
})
