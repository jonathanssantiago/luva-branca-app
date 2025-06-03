import { useState, useEffect } from 'react'
import { Alert, Platform } from 'react-native'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import * as SMS from 'expo-sms'
import * as SecureStore from 'expo-secure-store'

export interface PermissionStatus {
  location: 'granted' | 'denied' | 'undetermined'
  notifications: 'granted' | 'denied' | 'undetermined'
  sms: 'granted' | 'denied' | 'undetermined'
}

export interface PermissionsState {
  permissions: PermissionStatus
  loading: boolean
  allGranted: boolean
  firstTimeSetup: boolean
}

const PERMISSIONS_KEY = 'app_permissions_checked'

export const usePermissions = () => {
  const [state, setState] = useState<PermissionsState>({
    permissions: {
      location: 'undetermined',
      notifications: 'undetermined',
      sms: 'undetermined',
    },
    loading: true,
    allGranted: false,
    firstTimeSetup: true,
  })

  // Verificar se é a primeira vez que o usuário está configurando as permissões
  const checkFirstTimeSetup = async (): Promise<boolean> => {
    try {
      const hasChecked = await SecureStore.getItemAsync(PERMISSIONS_KEY)
      return !hasChecked
    } catch (error) {
      console.error('Erro ao verificar primeira configuração:', error)
      return true
    }
  }

  // Marcar que as permissões já foram verificadas
  const markPermissionsChecked = async () => {
    try {
      await SecureStore.setItemAsync(PERMISSIONS_KEY, 'true')
    } catch (error) {
      console.error('Erro ao marcar permissões como verificadas:', error)
    }
  }

  // Verificar status atual das permissões
  const checkPermissions = async (): Promise<PermissionStatus> => {
    const permissions: PermissionStatus = {
      location: 'undetermined',
      notifications: 'undetermined',
      sms: 'undetermined',
    }

    try {
      // Verificar permissão de localização
      const locationStatus = await Location.getForegroundPermissionsAsync()
      permissions.location = locationStatus.granted
        ? 'granted'
        : locationStatus.canAskAgain
          ? 'undetermined'
          : 'denied'

      // Verificar permissão de notificações
      if (Platform.OS !== 'web') {
        const notificationStatus = await Notifications.getPermissionsAsync()
        permissions.notifications = notificationStatus.granted
          ? 'granted'
          : notificationStatus.canAskAgain
            ? 'undetermined'
            : 'denied'
      } else {
        permissions.notifications = 'granted' // Assumir concedido no web
      }

      // Verificar permissão de SMS (disponibilidade)
      const smsAvailable = await SMS.isAvailableAsync()
      permissions.sms = smsAvailable ? 'granted' : 'denied'
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
    }

    return permissions
  }

  // Solicitar permissão de localização
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      setState((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          location: status === 'granted' ? 'granted' : 'denied',
        },
      }))

      return status === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão de localização:', error)
      return false
    }
  }

  // Solicitar permissão de notificações
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setState((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          notifications: 'granted',
        },
      }))
      return true
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync()

      setState((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          notifications: status === 'granted' ? 'granted' : 'denied',
        },
      }))

      return status === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificações:', error)
      return false
    }
  }

  // Solicitar todas as permissões necessárias
  const requestAllPermissions = async (): Promise<{
    [key: string]: boolean
  }> => {
    const results = {
      location: false,
      notifications: false,
      sms: true, // SMS não precisa de solicitação, só verificação de disponibilidade
    }

    // Solicitar localização
    results.location = await requestLocationPermission()

    // Solicitar notificações
    results.notifications = await requestNotificationPermission()

    // Marcar que as permissões foram verificadas
    await markPermissionsChecked()

    setState((prev) => ({
      ...prev,
      firstTimeSetup: false,
      allGranted: results.location && results.notifications && results.sms,
    }))

    return results
  }

  // Mostrar dialog explicativo sobre permissões
  const showPermissionsDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Permissões Necessárias',
        'Para garantir sua segurança, o Luva Branca precisa de algumas permissões:\n\n' +
          '📍 Localização: Para enviar sua localização em emergências\n' +
          '🔔 Notificações: Para alertas importantes\n' +
          '📱 SMS: Para enviar mensagens de emergência\n\n' +
          'Deseja configurar agora?',
        [
          {
            text: 'Configurar Depois',
            style: 'cancel',
            onPress: () => {
              markPermissionsChecked()
              setState((prev) => ({ ...prev, firstTimeSetup: false }))
              resolve(false)
            },
          },
          {
            text: 'Configurar Agora',
            onPress: async () => {
              const results = await requestAllPermissions()
              resolve(results.location && results.notifications)
            },
          },
        ],
      )
    })
  }

  // Mostrar dialog para permissões críticas negadas
  const showCriticalPermissionsDialog = (deniedPermissions: string[]) => {
    const permissionNames = {
      location: 'Localização',
      notifications: 'Notificações',
      sms: 'SMS',
    }

    const deniedNames = deniedPermissions
      .map((p) => permissionNames[p as keyof typeof permissionNames])
      .join(', ')

    Alert.alert(
      'Permissões Importantes',
      `As seguintes permissões foram negadas: ${deniedNames}\n\n` +
        'Essas permissões são importantes para o funcionamento completo do app de segurança. ' +
        'Você pode habilitá-las posteriormente nas configurações do dispositivo.',
      [{ text: 'Entendi', style: 'default' }],
    )
  }

  // Inicializar verificação de permissões
  useEffect(() => {
    const initializePermissions = async () => {
      setState((prev) => ({ ...prev, loading: true }))

      const isFirstTime = await checkFirstTimeSetup()
      const currentPermissions = await checkPermissions()

      const allGranted =
        currentPermissions.location === 'granted' &&
        currentPermissions.notifications === 'granted' &&
        currentPermissions.sms === 'granted'

      setState({
        permissions: currentPermissions,
        loading: false,
        allGranted,
        firstTimeSetup: isFirstTime,
      })
    }

    initializePermissions()
  }, [])

  // Verificar novamente as permissões (para usar após retornar das configurações)
  const recheckPermissions = async () => {
    setState((prev) => ({ ...prev, loading: true }))

    const currentPermissions = await checkPermissions()
    const allGranted =
      currentPermissions.location === 'granted' &&
      currentPermissions.notifications === 'granted' &&
      currentPermissions.sms === 'granted'

    setState((prev) => ({
      ...prev,
      permissions: currentPermissions,
      loading: false,
      allGranted,
    }))
  }

  return {
    ...state,
    requestLocationPermission,
    requestNotificationPermission,
    requestAllPermissions,
    showPermissionsDialog,
    showCriticalPermissionsDialog,
    recheckPermissions,
    checkPermissions,
  }
}
