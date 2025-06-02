import React, { createContext, FC, ReactNode, useState, useEffect } from 'react'
import { Platform, Alert } from 'react-native'
import * as SecureStore from 'expo-secure-store'

import { 
  NotificationData, 
  NotificationState, 
  NotificationSettings, 
  NotificationType 
} from '../types/notification'

interface NotificationContextData extends NotificationState {
  // Permissões e token
  requestPermissions(): Promise<boolean>
  
  // Gerenciamento de notificações
  sendLocalNotification(notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>): Promise<string>
  
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

export const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData)

export const NotificationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: true,
    hasPermission: false,
    expoPushToken: null,
  })

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)

  useEffect(() => {
    initializeNotifications()
  }, [])

  const initializeNotifications = async () => {
    try {
      // Carregar configurações salvas
      await loadSettings()
      await loadNotifications()
      
      // Verificar permissões
      const hasPermission = await checkPermissions()
      
      setNotificationState(prev => ({
        ...prev,
        hasPermission,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error)
      setNotificationState(prev => ({
        ...prev,
        isLoading: false,
      }))
    }
  }

  const loadSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync(NOTIFICATION_SETTINGS_KEY)
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const savedNotifications = await SecureStore.getItemAsync(NOTIFICATIONS_DATA_KEY)
      let notifications = mockNotifications // Usar dados mock por padrão
      
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications)
        notifications = [...parsed, ...mockNotifications].filter((item, index, arr) => 
          arr.findIndex(i => i.id === item.id) === index
        )
      }
      
      const unreadCount = notifications.filter(n => !n.isRead).length
      
      setNotificationState(prev => ({
        ...prev,
        notifications,
        unreadCount,
      }))
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      // Em caso de erro, usar dados mock
      setNotificationState(prev => ({
        ...prev,
        notifications: mockNotifications,
        unreadCount: mockNotifications.filter(n => !n.isRead).length,
      }))
    }
  }

  const checkPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true // Simular permissão no web
    }
    
    try {
      // Simulação básica - em produção usar expo-notifications
      return true
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      return false
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setNotificationState(prev => ({ ...prev, hasPermission: true }))
      return true
    }

    try {
      // Em produção, usar expo-notifications aqui
      Alert.alert('Permissões', 'Permissões de notificação simuladas como concedidas')
      setNotificationState(prev => ({ ...prev, hasPermission: true }))
      return true
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error)
      return false
    }
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const saveNotifications = async (notifications: NotificationData[]) => {
    try {
      await SecureStore.setItemAsync(NOTIFICATIONS_DATA_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.error('Erro ao salvar notificações:', error)
    }
  }

  const addNotification = async (notification: NotificationData) => {
    setNotificationState(prev => {
      const newNotifications = [notification, ...prev.notifications]
      const unreadCount = newNotifications.filter(n => !n.isRead).length
      
      // Salvar no storage
      saveNotifications(newNotifications)
      
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount,
      }
    })
  }

  const sendLocalNotification = async (
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>
  ): Promise<string> => {
    try {
      const notificationId = generateId()

      const newNotification: NotificationData = {
        ...notification,
        id: notificationId,
        createdAt: new Date().toISOString(),
        isRead: false,
      }

      await addNotification(newNotification)
      return notificationId
    } catch (error) {
      console.error('Erro ao enviar notificação local:', error)
      throw error
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotificationState(prev => {
      const updatedNotifications = prev.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
      
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length
      
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
    setNotificationState(prev => {
      const updatedNotifications = prev.notifications.map(notification => ({
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
    setNotificationState(prev => {
      const updatedNotifications = prev.notifications.filter(n => n.id !== notificationId)
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length
      
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
    setNotificationState(prev => ({
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
      await SecureStore.setItemAsync(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  const refreshNotifications = async () => {
    setNotificationState(prev => ({ ...prev, isLoading: true }))
    await loadNotifications()
    setNotificationState(prev => ({ ...prev, isLoading: false }))
  }

  return (
    <NotificationContext.Provider
      value={{
        ...notificationState,
        requestPermissions,
        sendLocalNotification,
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