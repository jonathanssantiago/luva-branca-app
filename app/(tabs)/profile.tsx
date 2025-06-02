import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import {
  Card,
  List,
  Text,
  Button,
  Badge,
} from 'react-native-paper'

import { CustomHeader } from '@/src/components/ui'
import { useAuth } from '@/src/hooks'
import { useNotifications } from '@/src/hooks/useNotifications'

interface User {
  name: string
  email: string
}

type Route = '/(tabs)/documentos' | '/(tabs)/arquivo' | '/(tabs)/settings' | '/personal-data' | '/notifications' | '/app-settings' | '/privacy'

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
    title: 'Notificações',
    description: 'Visualize seus alertas e mensagens',
    icon: 'bell',
    route: '/notifications',
    section: 'navigation',
  },
  {
    id: '4',
    title: 'Configurações',
    description: 'Ajuste as configurações do app',
    icon: 'cog',
    route: '/app-settings',
    section: 'navigation',
  },
  {
    id: '5',
    title: 'Dados Pessoais',
    description: 'Atualize suas informações',
    icon: 'account',
    route: '/personal-data',
    section: 'account',
  },
  {
    id: '6',
    title: 'Privacidade',
    description: 'Gerencie suas configurações de privacidade',
    icon: 'shield-lock',
    route: '/privacy',
    section: 'account',
  },
]

const Profile = () => {
  const { handleLogout } = useAuth()
  const { unreadCount } = useNotifications()
  const [user] = useState<User>({
    name: 'Usuário',
    email: 'email@exemplo.com',
  })

  // Separar os itens por seção
  const navItems = navigationItems.filter(i => i.section === 'navigation')
  const accItems = navigationItems.filter(i => i.section === 'account')

  // Renderizar item da lista com badge para notificações
  const renderListItem = (item: NavigationItem) => {
    const isNotifications = item.route === '/notifications'
    
    return (
      <List.Item
        key={item.id}
        title={item.title}
        description={item.description}
        left={props => (
          <View style={{ position: 'relative' }}>
            <List.Icon {...props} icon={item.icon} />
            {isNotifications && unreadCount > 0 && (
              <Badge 
                style={profileStyles.notificationBadge}
                size={18}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </View>
        )}
        right={props => (
          <List.Icon {...props} icon="chevron-right" />
        )}
        onPress={() => router.push(item.route)}
        style={profileStyles.listItem}
        accessible={true}
        accessibilityLabel={item.title}
      />
    )
  }

  return (
    <ScrollView 
      style={profileStyles.container}
      contentContainerStyle={profileStyles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <CustomHeader
        title="Meu Perfil"
        iconColor="#666666"
        rightIcon="menu"
      />
      
      <View style={profileStyles.content}>
        {/* User Card */}
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

        {/* Funcionalidades Section */}
        <Text style={profileStyles.sectionTitle}>Funcionalidades</Text>
        <Card style={profileStyles.sectionCard}>
          <Card.Content>
            {navItems.map((item) => renderListItem(item))}
          </Card.Content>
        </Card>

        {/* Configurações da Conta Section */}
        <Text style={profileStyles.sectionTitle}>Configurações da Conta</Text>
        <Card style={profileStyles.sectionCard}>
          <Card.Content>
            {accItems.map((item) => renderListItem(item))}
          </Card.Content>
        </Card>

        {/* Logout Card */}
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
      </View>
    </ScrollView>
  )
}

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EA5455',
    borderRadius: 9,
  },
})

export default Profile
