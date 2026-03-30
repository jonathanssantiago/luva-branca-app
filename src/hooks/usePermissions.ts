import { useState, useEffect } from 'react'
import { Alert, Platform } from 'react-native'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import * as SMS from 'expo-sms'
import * as SecureStore from 'expo-secure-store'
import * as ImagePicker from 'expo-image-picker'
import { AudioModule } from 'expo-audio'

export interface PermissionStatus {
  location: 'granted' | 'denied' | 'undetermined'
  notifications: 'granted' | 'denied' | 'undetermined'
  sms: 'granted' | 'denied' | 'undetermined'
  mediaLibrary: 'granted' | 'denied' | 'undetermined'
  audio: 'granted' | 'denied' | 'undetermined'
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
      mediaLibrary: 'undetermined',
      audio: 'undetermined',
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

  const checkPermissions = async (): Promise<PermissionStatus> => {
    const permissions: PermissionStatus = {
      location: 'undetermined',
      notifications: 'undetermined',
      sms: 'undetermined',
      mediaLibrary: 'undetermined',
      audio: 'undetermined',
    }

    try {
      const [locationStatus, notificationStatus, smsAvailable, mediaLibraryStatus, audioStatus] =
        await Promise.all([
          Location.getForegroundPermissionsAsync(),
          Platform.OS !== 'web'
            ? Notifications.getPermissionsAsync()
            : Promise.resolve({ granted: true, canAskAgain: false } as any),
          SMS.isAvailableAsync(),
          ImagePicker.getMediaLibraryPermissionsAsync(),
          Platform.OS !== 'web'
            ? AudioModule.getRecordingPermissionsAsync()
            : Promise.resolve({ granted: true, canAskAgain: false } as any),
        ])

      permissions.location = locationStatus.granted
        ? 'granted'
        : locationStatus.canAskAgain
          ? 'undetermined'
          : 'denied'

      permissions.notifications = notificationStatus.granted
        ? 'granted'
        : notificationStatus.canAskAgain
          ? 'undetermined'
          : 'denied'

      permissions.sms = smsAvailable ? 'granted' : 'denied'

      permissions.mediaLibrary = mediaLibraryStatus.granted
        ? 'granted'
        : mediaLibraryStatus.canAskAgain
          ? 'undetermined'
          : 'denied'

      permissions.audio = audioStatus.granted
        ? 'granted'
        : audioStatus.canAskAgain
          ? 'undetermined'
          : 'denied'
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

  // Solicitar permissão de galeria
  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      setState((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          mediaLibrary: status === 'granted' ? 'granted' : 'denied',
        },
      }))

      return status === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão de galeria:', error)
      return false
    }
  }

  // Solicitar permissão de áudio
  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setState((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          audio: 'granted',
        },
      }))
      return true
    }

    try {
      const { status } = await AudioModule.requestRecordingPermissionsAsync()

      setState((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          audio: status === 'granted' ? 'granted' : 'denied',
        },
      }))

      return status === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão de áudio:', error)
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
      mediaLibrary: false,
      audio: false,
    }

    // Solicitar localização
    results.location = await requestLocationPermission()

    // Solicitar notificações
    results.notifications = await requestNotificationPermission()

    // Solicitar galeria
    results.mediaLibrary = await requestMediaLibraryPermission()

    // Solicitar áudio
    results.audio = await requestAudioPermission()

    // Marcar que as permissões foram verificadas
    await markPermissionsChecked()

    setState((prev) => ({
      ...prev,
      firstTimeSetup: false,
      allGranted:
        results.location &&
        results.notifications &&
        results.sms &&
        results.mediaLibrary &&
        results.audio,
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
          '📱 SMS: Para enviar mensagens de emergência\n' +
          '📷 Galeria: Para anexar fotos aos relatos\n' +
          '🎤 Microfone: Para gravar áudios de emergência\n\n' +
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
      mediaLibrary: 'Galeria',
      audio: 'Microfone',
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

  useEffect(() => {
    const initializePermissions = async () => {
      setState((prev) => ({ ...prev, loading: true }))

      try {
        const [isFirstTime, currentPermissions] = await Promise.all([
          checkFirstTimeSetup(),
          checkPermissions(),
        ])

        const allGranted =
          currentPermissions.location === 'granted' &&
          currentPermissions.notifications === 'granted' &&
          currentPermissions.sms === 'granted' &&
          currentPermissions.mediaLibrary === 'granted' &&
          currentPermissions.audio === 'granted'

        setState({
          permissions: currentPermissions,
          loading: false,
          allGranted,
          firstTimeSetup: isFirstTime,
        })
      } catch (error) {
        console.error('Permission init error:', error)
        setState((prev) => ({ ...prev, loading: false }))
      }
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
      currentPermissions.sms === 'granted' &&
      currentPermissions.mediaLibrary === 'granted' &&
      currentPermissions.audio === 'granted'

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
    requestMediaLibraryPermission,
    requestAudioPermission,
    requestAllPermissions,
    showPermissionsDialog,
    showCriticalPermissionsDialog,
    recheckPermissions,
    checkPermissions,
  }
}
