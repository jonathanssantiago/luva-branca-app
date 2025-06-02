import { useContext } from 'react'
import { NotificationContext } from '../context/NotificationContext'

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider')
  }
  
  return {
    ...context,
    // Funções utilitárias para demonstração
    sendSecurityAlert: async (message: string) => {
      return context.sendLocalNotification({
        title: 'Alerta de Segurança',
        body: message,
        type: 'security_alert',
        priority: 'high',
        sound: 'default',
      })
    },
    
    sendEmergencyAlert: async (message: string) => {
      return context.sendLocalNotification({
        title: '🚨 EMERGÊNCIA',
        body: message,
        type: 'emergency',
        priority: 'max',
        sound: 'default',
      })
    },
    
    sendReminder: async (message: string) => {
      return context.sendLocalNotification({
        title: 'Lembrete',
        body: message,
        type: 'reminder',
        priority: 'default',
        sound: 'default',
      })
    },
    
    sendSystemUpdate: async (message: string) => {
      return context.sendLocalNotification({
        title: 'Atualização do Sistema',
        body: message,
        type: 'system_update',
        priority: 'low',
        sound: 'default',
      })
    },
  }
} 