import { View } from 'react-native'
import { Appbar, useTheme, Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IconButton } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface TabsHeaderProps {
  route: {
    name: string
  }
}

export const TabsHeader = ({ route }: TabsHeaderProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  // Verificação de segurança
  if (!route || !route.name) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.primary,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        <Text
          variant="headlineSmall"
          style={{
            color: theme.colors.onPrimary,
            fontWeight: '600',
            fontSize: 20,
          }}
        >
          Luva Branca
        </Text>
      </View>
    )
  }

  const getHeaderConfig = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return {
          title: 'SOS Emergência',
          backgroundColor: theme.colors.primary, // Rosa vibrante
          textColor: theme.colors.onPrimary,
          icon: 'alert-circle' as any,
        }
      case 'guardioes':
        return {
          title: 'Meus Guardiões',
          backgroundColor: '#1976d2', // Azul para guardiões
          textColor: '#FFFFFF',
          icon: 'shield-account' as any,
        }
      case 'orientacao':
        return {
          title: 'Orientações',
          backgroundColor: '#28C76F', // Verde fixo ao invés de theme.colors.success
          textColor: '#FFFFFF',
          icon: 'book-open-variant' as any,
        }
      case 'apoio':
        return {
          title: 'Apoio',
          backgroundColor: '#7b1fa2', // Roxo para apoio psicológico
          textColor: '#FFFFFF',
          icon: 'heart' as any,
        }
      case 'perfil':
        return {
          title: 'Meu Perfil',
          backgroundColor: theme.colors.tertiary, // Cinza da paleta
          textColor: theme.colors.onTertiary,
          icon: 'account-circle' as any,
        }
      default:
        return {
          title: 'Luva Branca',
          backgroundColor: theme.colors.primary,
          textColor: theme.colors.onPrimary,
          icon: 'shield-check' as any,
        }
    }
  }

  const headerConfig = getHeaderConfig(route.name)

  return (
    <View
      style={[
        {
          backgroundColor: headerConfig.backgroundColor,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          // Sombra moderna
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <MaterialCommunityIcons
            name={headerConfig.icon}
            size={28}
            color={headerConfig.textColor}
            style={{ marginRight: 12 }}
          />
          <Text
            variant="headlineSmall"
            style={{
              color: headerConfig.textColor,
              fontWeight: '600',
              fontSize: 20,
            }}
          >
            {headerConfig.title}
          </Text>
        </View>

        {/* Botões de ação */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton
            icon="magnify"
            iconColor={headerConfig.textColor}
            size={24}
            onPress={() => {
              // TODO: Implementar busca
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <IconButton
            icon="dots-vertical"
            iconColor={headerConfig.textColor}
            size={24}
            onPress={() => {
              // TODO: Implementar menu
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </View>
      </View>
    </View>
  )
}
