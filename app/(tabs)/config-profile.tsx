import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState, useEffect } from 'react'
import { ScrollView, View, StyleSheet, Alert } from 'react-native'
import {
  Card,
  List,
  Text,
  Button,
  Badge,
  Avatar,
  ActivityIndicator,
  FAB,
} from 'react-native-paper'

import { CustomHeader } from '@/src/components/ui'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useImageUpload } from '@/src/hooks/useImageUpload'
import { useNotifications } from '@/src/hooks/useNotifications'
import type { Profile } from '@/src/types/supabase'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

type Route =
  | '/(tabs)/documentos'
  | '/(tabs)/arquivo'
  | '/(tabs)/settings'
  | '/personal-data'
  | '/notifications'
  | '/privacy'

interface NavigationItem {
  id: string
  title: string
  description: string
  icon: string
  route: Route
  section: 'account'
}

const navigationItems: NavigationItem[] = [
  {
    id: '1',
    title: 'Dados Pessoais',
    description: 'Atualize suas informações',
    icon: 'account',
    route: '/personal-data',
    section: 'account',
  },
  {
    id: '2',
    title: 'Privacidade',
    description: 'Gerencie suas configurações de privacidade',
    icon: 'shield-lock',
    route: '/privacy',
    section: 'account',
  },
]

const ConfigProfile = () => {
  const { user, signOut } = useAuth()
  const {
    profile,
    loading: profileLoading,
    fetchProfile,
    updateProfile,
  } = useProfile()
  const {
    uploading,
    isImagePickerAvailable,
    pickImage,
    takePhoto,
    uploadAvatar,
  } = useImageUpload()
  const { unreadCount } = useNotifications()
  const colors = useThemeExtendedColors()

  const handleLogout = async () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut()
        },
      },
    ])
  }

  const handleUpdateAvatar = async () => {
    try {
      // Verificar se o ImagePicker está disponível
      const isAvailable = await isImagePickerAvailable()
      if (!isAvailable) {
        Alert.alert('Erro', 'Funcionalidade de imagem não está disponível')
        return
      }

      // Mostrar opções para o usuário escolher entre galeria ou câmera
      Alert.alert('Selecionar Avatar', 'Escolha uma opção:', [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const result = await pickImage()
            if (result && !result.canceled && result.assets?.[0]) {
              const uploadResult = await uploadAvatar(result.assets[0].uri)
              if (uploadResult.error) {
                Alert.alert('Erro', uploadResult.error)
              } else if (uploadResult.url) {
                // Atualizar o perfil com a nova URL do avatar
                const updateResult = await updateProfile({
                  avatar_url: uploadResult.url,
                })
                if (updateResult.error) {
                  Alert.alert(
                    'Erro',
                    'Avatar enviado, mas erro ao salvar no perfil',
                  )
                } else {
                  Alert.alert('Sucesso', 'Avatar atualizado com sucesso!')
                }
              }
            }
          },
        },
        {
          text: 'Câmera',
          onPress: async () => {
            const result = await takePhoto()
            if (result && !result.canceled && result.assets?.[0]) {
              const uploadResult = await uploadAvatar(result.assets[0].uri)
              if (uploadResult.error) {
                Alert.alert('Erro', uploadResult.error)
              } else if (uploadResult.url) {
                // Atualizar o perfil com a nova URL do avatar
                const updateResult = await updateProfile({
                  avatar_url: uploadResult.url,
                })
                if (updateResult.error) {
                  Alert.alert(
                    'Erro',
                    'Avatar enviado, mas erro ao salvar no perfil',
                  )
                } else {
                  Alert.alert('Sucesso', 'Avatar atualizado com sucesso!')
                }
              }
            }
          },
        },
      ])
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error)
      Alert.alert('Erro', 'Não foi possível atualizar o avatar')
    }
  }

  // Separar os itens por seção
  const accItems = navigationItems.filter((i) => i.section === 'account')

  // Renderizar item da lista com badge para notificações
  const renderListItem = (item: NavigationItem) => {
    return (
      <List.Item
        key={item.id}
        title={item.title}
        description={item.description}
        left={(props) => (
          <List.Icon {...props} icon={item.icon} color={colors.iconSecondary} />
        )}
        right={(props) => (
          <View style={{ position: 'relative' }}>
            <List.Icon {...props} icon="chevron-right" color={colors.iconSecondary} />
            {item.id === 'notifications' && unreadCount > 0 && (
              <Badge
                style={[profileStyles.notificationBadge, { backgroundColor: colors.error }]}
                size={18}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </View>
        )}
        onPress={() => router.push(item.route)}
        style={profileStyles.listItem}
        titleStyle={{ color: colors.textPrimary }}
        descriptionStyle={{ color: colors.textSecondary }}
        accessibilityLabel={item.title}
      />
    )
  }

  if (profileLoading) {
    return (
      <View style={[profileStyles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[profileStyles.loadingText, { color: colors.textSecondary }]}>Carregando perfil...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={[profileStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={profileStyles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <CustomHeader title="Meu Perfil" rightIcon="menu" />

      <View style={profileStyles.content}>
        {/* User Card */}
        <Card style={[profileStyles.userCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={profileStyles.userHeader}>
              <View style={profileStyles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Avatar.Image
                    size={64}
                    source={{ uri: profile.avatar_url }}
                  />
                ) : (
                  <Avatar.Icon
                    size={64}
                    icon="account"
                    style={[profileStyles.avatarIcon, { backgroundColor: colors.background }]}
                  />
                )}
                <FAB
                  size="small"
                  icon="camera"
                  style={[profileStyles.avatarEditButton, { backgroundColor: colors.primary }]}
                  onPress={handleUpdateAvatar}
                  loading={uploading}
                  disabled={uploading}
                />
              </View>
              <View style={profileStyles.userInfo}>
                <Text style={[profileStyles.userName, { color: colors.textPrimary }]}>
                  {profile?.full_name ||
                    user?.email?.split('@')[0] ||
                    'Usuário'}
                </Text>
                <Text style={[profileStyles.userEmail, { color: colors.textSecondary }]}>
                  {user?.email || 'email@exemplo.com'}
                </Text>
                {profile?.updated_at && (
                  <Text style={[profileStyles.lastUpdate, { color: colors.textSecondary }]}>
                    Última atualização:{' '}
                    {new Date(profile.updated_at).toLocaleDateString('pt-BR')}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Configurações da Conta Section */}
        <Text style={[profileStyles.sectionTitle, { color: colors.textPrimary }]}>Configurações da Conta</Text>
        <Card style={[profileStyles.sectionCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            {accItems.map((item) => renderListItem(item))}
          </Card.Content>
        </Card>

        {/* Logout Card */}
        <Card style={[profileStyles.logoutCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleLogout}
              icon="logout"
              textColor={colors.error}
              style={[profileStyles.logoutButton, { borderColor: colors.error }]}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    borderRadius: 8,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarIcon: {
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  lastUpdate: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 24,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  logoutCard: {
    marginTop: 24,
    marginBottom: 40,
    elevation: 2,
    borderRadius: 8,
  },
  logoutButton: {
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 9,
  },
})

export default ConfigProfile
