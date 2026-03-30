import { useState } from 'react'
import { View } from 'react-native'
import { useTheme, Text, IconButton, Menu, Searchbar } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '@/src/context/SupabaseAuthContext'

interface TabsHeaderProps {
  route: {
    name: string
  }
  /** Chamado sempre que o texto da busca muda (permite filtragem na tela pai) */
  onSearch?: (query: string) => void
}

export const TabsHeader = ({ route, onSearch }: TabsHeaderProps) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { signOut } = useAuth()
  const [menuVisible, setMenuVisible] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchToggle = () => {
    if (searchVisible) {
      setSearchQuery('')
      onSearch?.('')
    }
    setSearchVisible((v) => !v)
  }

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    onSearch?.(text)
  }

  const handleMenuDismiss = () => setMenuVisible(false)

  const navigateTo = (path: string) => {
    handleMenuDismiss()
    router.push(path as any)
  }

  const handleSignOut = async () => {
    handleMenuDismiss()
    await signOut()
    router.replace('/(auth)/login')
  }

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
          SIAPeP-M
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
          title: 'SIAPeP-M',
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
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <IconButton
            icon={searchVisible ? 'close' : 'magnify'}
            iconColor={headerConfig.textColor}
            size={24}
            onPress={handleSearchToggle}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          />

          <Menu
            visible={menuVisible}
            onDismiss={handleMenuDismiss}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor={headerConfig.textColor}
                size={24}
                onPress={() => setMenuVisible(true)}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              />
            }
          >
            <Menu.Item
              leadingIcon="cog-outline"
              onPress={() => navigateTo('/(tabs)/settings')}
              title="Configurações"
            />
            <Menu.Item
              leadingIcon="shield-lock-outline"
              onPress={() => navigateTo('/privacy')}
              title="Privacidade"
            />
            <Menu.Item
              leadingIcon="logout"
              onPress={handleSignOut}
              title="Sair"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>
      </View>

      {searchVisible && (
        <Searchbar
          placeholder="Buscar..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          style={{
            marginTop: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
          }}
          inputStyle={{ color: headerConfig.textColor, fontSize: 15 }}
          iconColor={headerConfig.textColor}
          placeholderTextColor="rgba(255,255,255,0.6)"
        />
      )}
    </View>
  )
}
