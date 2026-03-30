import React, { createContext, FC, ReactNode, useState, useEffect } from 'react'
import { Platform, Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

import {
  NotificationData,
  NotificationState,
  NotificationSettings,
  NotificationType,
} from '../types/notification'
import { supabase } from '../../lib/supabase'
import {
  notificationChannels,
  notificationCategories,
  getChannelForType,
  getPriorityForType,
} from '../config/notifications'
import {
  navigateFromNotification,
  handleNotificationAction,
} from '../utils/notificationNavigation'
import {
  scheduleNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getScheduledNotifications,
  scheduleSecurityCheckReminder,
  scheduleBackupReminder,
  scheduleGuardianCheckReminder,
  ScheduledNotificationOptions,
  NotificationTrigger,
} from '../utils/scheduledNotifications'

interface NotificationContextData extends NotificationState {
  // Permissões e token
  requestPermissions(): Promise<boolean>
  registerForPushNotifications(): Promise<string | null>

  // Gerenciamento de notificações
  sendLocalNotification(
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>,
  ): Promise<string>
  sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<boolean>

  // Notificações agendadas
  scheduleNotification(
    options: ScheduledNotificationOptions,
    trigger: NotificationTrigger,
  ): Promise<string>
  cancelScheduledNotification(notificationId: string): Promise<void>
  cancelAllScheduledNotifications(): Promise<void>
  getScheduledNotifications(): Promise<any[]>

  // Lembretes automáticos
  setupDefaultReminders(): Promise<void>

  // Lista de notificações
  markAsRead(notificationId: string): void
  markAllAsRead(): void
  deleteNotification(notificationId: string): void
  clearAllNotifications(): void

  // Configurações
  settings: NotificationSettings
  updateSettings(newSettings: Partial<NotificationSettings>): Promise<void>

  // Refresh
  refreshNotifications(): Promise<void>
}

// Configurar o comportamento de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const NOTIFICATION_SETTINGS_KEY = 'notification_settings'
const NOTIFICATIONS_DATA_KEY = 'notifications_data'

const defaultSettings: NotificationSettings = {
  enabled: true,
  securityAlerts: true,
  emergencyAlerts: true,
  systemUpdates: true,
  reminders: true,
  messages: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
}

// Mock notifications para demonstração
const mockNotifications: NotificationData[] = [
  {
    id: '1',
    title: 'Alerta de Segurança',
    body: 'Movimento suspeito detectado em sua área',
    type: 'security_alert',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
    isRead: false,
    priority: 'high',
    sound: 'default',
  },
  {
    id: '2',
    title: 'Lembrete de Check-in',
    body: 'Não se esqueça de fazer seu check-in de segurança',
    type: 'reminder',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
    isRead: true,
    priority: 'default',
    sound: 'default',
  },
  {
    id: '3',
    title: 'Atualização do Sistema',
    body: 'Nova versão do aplicativo disponível',
    type: 'system_update',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
    isRead: false,
    priority: 'low',
    sound: 'default',
  },
]

export const NotificationContext = createContext<NotificationContextData>(
  {} as NotificationContextData,
)

export const NotificationProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notificationState, setNotificationState] = useState<NotificationState>(
    {
      notifications: [],
      unreadCount: 0,
      isLoading: true,
      hasPermission: false,
      expoPushToken: null,
    },
  )

  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings)

  useEffect(() => {
    initializeNotifications()
    setupNotificationListeners()
  }, [])

  const setupNotificationListeners = () => {
    // Listener para notificações recebidas quando o app está em foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notificação recebida:', notification)

        // Adicionar à lista local de notificações
        const newNotification: NotificationData = {
          id: notification.request.identifier,
          title: notification.request.content.title || 'Nova notificação',
          body: notification.request.content.body || '',
          data: notification.request.content.data,
          type:
            (notification.request.content.data?.type as NotificationType) ||
            'general',
          createdAt: new Date().toISOString(),
          isRead: false,
          priority: 'default',
          sound: 'default',
        }

        addNotification(newNotification)
      },
    )

    // Listener para quando o usuário toca na notificação
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Resposta à notificação:', response)

        const notificationData = response.notification.request.content.data
        const actionIdentifier = response.actionIdentifier

        // Marcar como lida
        if (response.notification.request.identifier) {
          markAsRead(response.notification.request.identifier)
        }

        // Criar objeto de notificação para navegação
        const notification: NotificationData = {
          id: response.notification.request.identifier,
          title: response.notification.request.content.title || 'Notificação',
          body: response.notification.request.content.body || '',
          data: notificationData,
          type: (notificationData?.type as NotificationType) || 'general',
          createdAt: new Date().toISOString(),
          isRead: true,
          priority: 'default',
          sound: 'default',
        }

        // Processar ação específica se houver
        if (actionIdentifier) {
          handleNotificationAction(actionIdentifier, notification)
        } else {
          // Navegação padrão baseada no tipo e dados da notificação
          navigateFromNotification(notification, notificationData as any)
        }
      })

    // Cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }

  const initializeNotifications = async () => {
    try {
      // Configurar canais de notificação no Android
      if (Platform.OS === 'android') {
        for (const channel of notificationChannels) {
          if (channel.name) {
            await Notifications.setNotificationChannelAsync(
              channel.name,
              channel,
            )
          }
        }
      }

      // Configurar categorias de notificação
      for (const category of notificationCategories) {
        await Notifications.setNotificationCategoryAsync(
          category.identifier,
          category.actions,
          category.options,
        )
      }

      // Carregar configurações salvas
      await loadSettings()
      await loadNotifications()

      // Verificar permissões
      const hasPermission = await checkPermissions()

      setNotificationState((prev) => ({
        ...prev,
        hasPermission,
        isLoading: false,
      }))

      // Se já tem permissão, registrar para push notifications
      if (hasPermission) {
        await registerForPushNotifications()
      }
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error)
      setNotificationState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    }
  }

  const loadSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync(
        NOTIFICATION_SETTINGS_KEY,
      )
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const savedNotifications = await SecureStore.getItemAsync(
        NOTIFICATIONS_DATA_KEY,
      )
      let notifications = mockNotifications // Usar dados mock por padrão

      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications)
        notifications = [...parsed, ...mockNotifications].filter(
          (item, index, arr) =>
            arr.findIndex((i) => i.id === item.id) === index,
        )
      }

      const unreadCount = notifications.filter((n) => !n.isRead).length

      setNotificationState((prev) => ({
        ...prev,
        notifications,
        unreadCount,
      }))
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      // Em caso de erro, usar dados mock
      setNotificationState((prev) => ({
        ...prev,
        notifications: mockNotifications,
        unreadCount: mockNotifications.filter((n) => !n.isRead).length,
      }))
    }
  }

  const checkPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true // Simular permissão no web
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      return existingStatus === 'granted'
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      return false
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setNotificationState((prev) => ({ ...prev, hasPermission: true }))
      return true
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync()
      const granted = status === 'granted'

      setNotificationState((prev) => ({ ...prev, hasPermission: granted }))

      if (granted) {
        // Registrar automaticamente para push notifications
        await registerForPushNotifications()
      }

      return granted
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error)
      return false
    }
  }

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      // Verificar se está rodando em dispositivo físico
      if (!Device.isDevice) {
        console.warn('Push notifications só funcionam em dispositivos físicos')
        return null
      }

      // Verificar permissões
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.warn('Permissão de notificação não concedida')
        return null
      }

      // Obter o token do Expo
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })

      console.log('Expo Push Token:', token.data)

      // Salvar o token no Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const deviceInfo = {
          platform: Platform.OS,
          deviceName: Device.deviceName,
          deviceType: Device.deviceType,
          brand: Device.brand,
          manufacturer: Device.manufacturer,
        }

        const { error } = await supabase.from('user_push_tokens').upsert(
          {
            user_id: user.id,
            expo_token: token.data,
            device_info: deviceInfo,
            is_active: true,
          },
          {
            onConflict: 'user_id,expo_token',
          },
        )

        if (error) {
          console.error('Erro ao salvar token no Supabase:', error)
        } else {
          console.log('Token salvo com sucesso no Supabase')
        }
      }

      // Atualizar o estado local
      setNotificationState((prev) => ({
        ...prev,
        expoPushToken: token.data,
        hasPermission: true,
      }))

      return token.data
    } catch (error) {
      console.error('Erro ao registrar para push notifications:', error)
      return null
    }
  }

  const sendPushNotification = async (
    userId: string,
    title: string,
    body: string,
    notificationData?: Record<string, any>,
  ): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          userId,
          title,
          body,
          data: notificationData || {},
        },
      })

      if (error) {
        console.error('Erro ao enviar push notification:', error)
        return false
      }

      console.log('Push notification enviada com sucesso:', data)
      return data?.success || false
    } catch (error) {
      console.error('Erro ao enviar push notification:', error)
      return false
    }
  }

  const generateId = () =>
    `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`

  const saveNotifications = async (notifications: NotificationData[]) => {
    try {
      await SecureStore.setItemAsync(
        NOTIFICATIONS_DATA_KEY,
        JSON.stringify(notifications),
      )
    } catch (error) {
      console.error('Erro ao salvar notificações:', error)
    }
  }

  const addNotification = async (notification: NotificationData) => {
    setNotificationState((prev) => {
      if (prev.notifications.some((n) => n.id === notification.id)) {
        return prev
      }

      const newNotifications = [notification, ...prev.notifications]
      const unreadCount = newNotifications.filter((n) => !n.isRead).length

      saveNotifications(newNotifications)

      return {
        ...prev,
        notifications: newNotifications,
        unreadCount,
      }
    })
  }

  const sendLocalNotification = async (
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>,
  ): Promise<string> => {
    try {
      const notificationId = generateId()

      const newNotification: NotificationData = {
        ...notification,
        id: notificationId,
        createdAt: new Date().toISOString(),
        isRead: false,
      }

      // Configurar a notificação com canal apropriado
      const notificationRequest = {
        identifier: notificationId,
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
          badge: notification.badge,
          categoryIdentifier: notification.type,
        },
        trigger: null, // Enviar imediatamente
      }

      // Adicionar canal específico para Android
      if (Platform.OS === 'android') {
        ;(notificationRequest.content as any).channelId = getChannelForType(
          notification.type,
        )
        ;(notificationRequest.content as any).priority = getPriorityForType(
          notification.type,
        )
      }

      // Enviar a notificação
      await Notifications.scheduleNotificationAsync(notificationRequest)

      // Adicionar à lista local
      await addNotification(newNotification)

      return notificationId
    } catch (error) {
      console.error('Erro ao enviar notificação local:', error)
      throw error
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotificationState((prev) => {
      const updatedNotifications = prev.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      )

      const unreadCount = updatedNotifications.filter((n) => !n.isRead).length

      // Salvar no storage
      saveNotifications(updatedNotifications)

      return {
        ...prev,
        notifications: updatedNotifications,
        unreadCount,
      }
    })
  }

  const markAllAsRead = () => {
    setNotificationState((prev) => {
      const updatedNotifications = prev.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))

      // Salvar no storage
      saveNotifications(updatedNotifications)

      return {
        ...prev,
        notifications: updatedNotifications,
        unreadCount: 0,
      }
    })
  }

  const deleteNotification = (notificationId: string) => {
    setNotificationState((prev) => {
      const updatedNotifications = prev.notifications.filter(
        (n) => n.id !== notificationId,
      )
      const unreadCount = updatedNotifications.filter((n) => !n.isRead).length

      // Salvar no storage
      saveNotifications(updatedNotifications)

      return {
        ...prev,
        notifications: updatedNotifications,
        unreadCount,
      }
    })
  }

  const clearAllNotifications = () => {
    setNotificationState((prev) => ({
      ...prev,
      notifications: [],
      unreadCount: 0,
    }))

    // Limpar do storage
    SecureStore.deleteItemAsync(NOTIFICATIONS_DATA_KEY)
  }

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      await SecureStore.setItemAsync(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(updatedSettings),
      )
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  const refreshNotifications = async () => {
    setNotificationState((prev) => ({ ...prev, isLoading: true }))
    await loadNotifications()
    setNotificationState((prev) => ({ ...prev, isLoading: false }))
  }

  // Funções de notificações agendadas
  const scheduleNotificationWrapper = async (
    options: ScheduledNotificationOptions,
    trigger: NotificationTrigger,
  ): Promise<string> => {
    return scheduleNotification(options, trigger)
  }

  const cancelScheduledNotificationWrapper = async (
    notificationId: string,
  ): Promise<void> => {
    return cancelScheduledNotification(notificationId)
  }

  const cancelAllScheduledNotificationsWrapper = async (): Promise<void> => {
    return cancelAllScheduledNotifications()
  }

  const getScheduledNotificationsWrapper = async () => {
    return getScheduledNotifications()
  }

  const setupDefaultReminders = async (): Promise<void> => {
    try {
      // Configurar lembretes padrão se as configurações permitirem
      if (settings.reminders && settings.enabled) {
        // Lembrete de check-in de segurança (20:00)
        await scheduleSecurityCheckReminder(20, 0)

        // Lembrete de backup semanal (domingo, 10:00)
        await scheduleBackupReminder(1, 10, 0)

        // Lembrete de verificação de guardiões (domingo, 18:00)
        await scheduleGuardianCheckReminder(1, 18, 0)

        console.log('Lembretes padrão configurados com sucesso')
      }
    } catch (error) {
      console.error('Erro ao configurar lembretes padrão:', error)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        ...notificationState,
        requestPermissions,
        registerForPushNotifications,
        sendLocalNotification,
        sendPushNotification,
        scheduleNotification: scheduleNotificationWrapper,
        cancelScheduledNotification: cancelScheduledNotificationWrapper,
        cancelAllScheduledNotifications: cancelAllScheduledNotificationsWrapper,
        getScheduledNotifications: getScheduledNotificationsWrapper,
        setupDefaultReminders,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        settings,
        updateSettings,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
