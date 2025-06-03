import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import React, { useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

// Telas que devem ser ocultadas da barra de navegação
const hiddenTabs = ['documentos', 'arquivo', 'settings']

export const TabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  // Filtra as rotas visíveis
  const visibleRoutes = useMemo(
    () => state.routes.filter((route) => !hiddenTabs.includes(route.name)),
    [state.routes],
  )

  // Configuração específica para cada aba com melhor responsividade
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
          isSpecial: true,
        }
      case 'guardioes': // Tela de guardiões -> "Rede" de apoio
        return {
          icon: 'account-group',
          label: 'Rede',
          backgroundColor: 'transparent',
          textColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          iconColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          accessibilityLabel: 'Rede de apoio e guardiões',
          isSpecial: false,
        }
      case 'orientacao': // Tela de orientações -> "Guia" (nome mais curto)
        return {
          icon: 'book-open-outline',
          label: 'Guia',
          backgroundColor: 'transparent',
          textColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          iconColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          accessibilityLabel: 'Guia de orientações e informações',
          isSpecial: false,
        }
      case 'apoio': // Tela de apoio psicológico -> "Apoio"
        return {
          icon: 'heart-multiple-outline',
          label: 'Apoio',
          backgroundColor: 'transparent',
          textColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          iconColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          accessibilityLabel: 'Apoio psicológico',
          isSpecial: false,
        }
      case 'config-profile': // Tela de perfil/menu
        return {
          icon: 'menu',
          label: 'Menu',
          backgroundColor: 'transparent',
          textColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          iconColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          accessibilityLabel: 'Menu de configurações',
          isSpecial: false,
        }
      default:
        return {
          icon: 'circle',
          label: routeName,
          backgroundColor: 'transparent',
          textColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          iconColor: isFocused ? '#FF3B7C' : '#FFFFFF',
          accessibilityLabel: routeName,
          isSpecial: false,
        }
    }
  }

  // Altura responsiva baseada no tamanho da tela
  const getTabBarHeight = () => {
    if (width < 375) return 100 // Telas pequenas
    if (width < 414) return 85 // Telas médias
    return 90 // Telas grandes
  }

  const tabBarStyle = useMemo(
    () => ({
      height: getTabBarHeight() + insets.bottom,
      paddingBottom: Math.max(insets.bottom, 8),
    }),
    [insets.bottom],
  )

  return (
    <View
      style={[styles.container, tabBarStyle]}
      accessibilityLabel="Barra de navegação principal"
    >
      <View style={styles.content}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused =
            state.index === state.routes.findIndex((r) => r.key === route.key)
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
          if (tabConfig.isSpecial) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.sosButton,
                  { backgroundColor: tabConfig.backgroundColor },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={tabConfig.accessibilityLabel}
                accessibilityHint="Toque para ativar o modo de emergência"
              >
                <MaterialCommunityIcons
                  name={tabConfig.icon as any}
                  size={width < 375 ? 24 : 28}
                  color={tabConfig.iconColor}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
                <Text
                  style={[
                    styles.sosButtonText,
                    {
                      color: tabConfig.textColor,
                      fontSize: width < 375 ? 11 : 12,
                    },
                  ]}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                >
                  {tabConfig.label}
                </Text>
              </TouchableOpacity>
            )
          }

          // Estilo padrão para outras abas com melhor espaçamento
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                {
                  opacity: isFocused ? 1 : 0.7,
                  flex: 1,
                  maxWidth: (width - 120) / 4, // Espaço reservado para o botão SOS
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={tabConfig.accessibilityLabel}
              accessibilityHint={`Toque para navegar para ${tabConfig.label}`}
            >
              <MaterialCommunityIcons
                name={tabConfig.icon as any}
                size={width < 375 ? 20 : 24}
                color={tabConfig.iconColor}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color: tabConfig.textColor,
                    fontSize: width < 375 ? 10 : 11,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
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
    backgroundColor: '#2C2C2C',
    borderTopLeftRadius: width < 375 ? 20 : 24,
    borderTopRightRadius: width < 375 ? 20 : 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: width < 375 ? 12 : 16,
    paddingHorizontal: width < 375 ? 12 : 16,
  },
  sosButton: {
    borderRadius: width < 375 ? 18 : 20,
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingVertical: width < 375 ? 10 : 12,
    minWidth: width < 375 ? 70 : 80,
    minHeight: width < 375 ? 44 : 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#FF3B7C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosButtonText: {
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: width < 375 ? 6 : 8,
    paddingHorizontal: width < 375 ? 8 : 12,
    minHeight: width < 375 ? 44 : 48,
    justifyContent: 'center',
  },
  tabButtonText: {
    fontWeight: '500',
    marginTop: width < 375 ? 2 : 4,
    textAlign: 'center',
    lineHeight: width < 375 ? 12 : 14,
  },
})
