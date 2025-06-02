export interface NotificationData {
  id: string
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | 'custom' | null
  priority?: 'min' | 'low' | 'default' | 'high' | 'max'
  badge?: number
  categoryId?: string
  createdAt: string
  isRead: boolean
  type: NotificationType
}

export type NotificationType = 
  | 'security_alert'
  | 'emergency'
  | 'system_update'
  | 'reminder'
  | 'message'
  | 'general'

export interface NotificationState {
  notifications: NotificationData[]
  unreadCount: number
  isLoading: boolean
  hasPermission: boolean
  expoPushToken: string | null
}

export interface NotificationSettings {
  enabled: boolean
  securityAlerts: boolean
  emergencyAlerts: boolean
  systemUpdates: boolean
  reminders: boolean
  messages: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  quietHours: {
    enabled: boolean
    startTime: string // HH:mm format
    endTime: string // HH:mm format
  }
}

export interface PushNotificationPayload {
  to: string
  sound: 'default'
  title: string
  body: string
  data?: Record<string, any>
  badge?: number
  categoryId?: string
  channelId?: string
} 