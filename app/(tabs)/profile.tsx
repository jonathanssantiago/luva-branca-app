import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { FlatList, View, StyleSheet, Dimensions } from 'react-native'
import {
  Card,
  List,
  Text,
  useTheme,
  Button,
} from 'react-native-paper'

import { CustomHeader } from '@/src/components/ui'
import { useAuth } from '@/src/hooks'

const { width } = Dimensions.get('window')

interface User {
  name: string
  email: string
}

type Route = '/(tabs)/documentos' | '/(tabs)/arquivo' | '/(tabs)/settings' | '/(tabs)/profile'

interface NavigationItem {
  id: string
  title: string
  description: string
  icon: string
  route: Route
  section: 'navigation' | 'account'
}

const navigationItems: NavigationItem[] = [
  {
    id: '1',
    title: 'Meus Documentos',
    description: 'Gerencie seus documentos pessoais',
    icon: 'file-document',
    route: '/(tabs)/documentos',
    section: 'navigation',
  },
  {
    id: '2',
    title: 'Minhas Gravações',
    description: 'Acesse suas gravações de áudio',
    icon: 'microphone',
    route: '/(tabs)/arquivo',
    section: 'navigation',
  },
  {
    id: '3',
    title: 'Configurações',
    description: 'Ajuste as configurações do app',
    icon: 'cog',
    route: '/(tabs)/settings',
    section: 'navigation',
  },
  {
    id: '4',
    title: 'Dados Pessoais',
    description: 'Atualize suas informações',
    icon: 'account',
    route: '/(tabs)/profile',
    section: 'account',
  },
  {
    id: '5',
    title: 'Privacidade',
    description: 'Gerencie suas configurações de privacidade',
    icon: 'shield-lock',
    route: '/(tabs)/settings',
    section: 'account',
  },
  {
    id: '6',
    title: 'Notificações',
    description: 'Configure suas notificações',
    icon: 'bell',
    route: '/(tabs)/settings',
    section: 'account',
  },
]

const Profile = () => {
  const theme = useTheme()
  const { handleLogout } = useAuth()
  const [user] = useState<User>({
    name: 'Usuário',
    email: 'email@exemplo.com',
  })

  // Separar os itens por seção
  const navItems = navigationItems.filter(i => i.section === 'navigation')
  const accItems = navigationItems.filter(i => i.section === 'account')

  // FlatList data: todos os itens de navegação e conta, com um identificador de seção
  const flatListData = [
    ...navItems.map(i => ({ ...i, section: 'navigation' })),
    ...accItems.map(i => ({ ...i, section: 'account' })),
  ]

  // Cabeçalho da lista (avatar, nome, email, títulos e cards)
  const renderHeader = () => (
    <>
      <CustomHeader
        title="Meu Perfil"
        iconColor="#666666"
        rightIcon="menu"
      />
      <View style={profileStyles.headerSpacing} />
      <Card style={profileStyles.userCard}>
        <Card.Content>
          <View style={profileStyles.userHeader}>
            <View style={profileStyles.avatarContainer}>
              <MaterialCommunityIcons
                name="account-circle"
                size={64}
                color="#666666"
              />
            </View>
            <View style={profileStyles.userInfo}>
              <Text style={profileStyles.userName}>
                {user?.name || 'Usuário'}
              </Text>
              <Text style={profileStyles.userEmail}>
                {user?.email || 'email@exemplo.com'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      <Text style={profileStyles.sectionTitle}>Funcionalidades</Text>
      <Card style={profileStyles.sectionCard}>
        <Card.Content>
          {navItems.map((item) => (
            <List.Item
              key={item.id}
              title={item.title}
              description={item.description}
              left={props => (
                <List.Icon {...props} icon={item.icon} />
              )}
              right={props => (
                <List.Icon {...props} icon="chevron-right" />
              )}
              onPress={() => router.push(item.route)}
              style={profileStyles.listItem}
              accessible={true}
              accessibilityLabel={item.title}
            />
          ))}
        </Card.Content>
      </Card>
      <Text style={profileStyles.sectionTitle}>Configurações da Conta</Text>
      <Card style={profileStyles.sectionCard}>
        <Card.Content>
          {accItems.map((item) => (
            <List.Item
              key={item.id}
              title={item.title}
              description={item.description}
              left={props => (
                <List.Icon {...props} icon={item.icon} />
              )}
              right={props => (
                <List.Icon {...props} icon="chevron-right" />
              )}
              onPress={() => router.push(item.route)}
              style={profileStyles.listItem}
              accessible={true}
              accessibilityLabel={item.title}
            />
          ))}
        </Card.Content>
      </Card>
    </>
  )

  // Rodapé da lista (botão Sair)
  const renderFooter = () => (
    <Card style={profileStyles.logoutCard}>
      <Card.Content>
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor="#EA5455"
          style={profileStyles.logoutButton}
        >
          Sair
        </Button>
      </Card.Content>
    </Card>
  )

  return (
    <FlatList
      data={[]}
      keyExtractor={() => Math.random().toString()}
      renderItem={null}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={profileStyles.flatListContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  )
}

const profileStyles = StyleSheet.create({
  flatListContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
    backgroundColor: '#F5F5F5',
    flexGrow: 1,
  },
  headerSpacing: {
    height: 0,
  },
  userCard: {
    marginBottom: 24,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 24,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  logoutCard: {
    marginTop: 24,
    marginBottom: 40,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  logoutButton: {
    borderColor: '#EA5455',
  },
})

export default Profile
