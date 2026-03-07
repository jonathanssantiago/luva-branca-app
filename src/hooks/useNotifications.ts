import { useContext } from 'react'
import { NotificationContext } from '../context/NotificationContext'
import {
  scheduleMedicationReminder,
  scheduleDelayedEmergency,
} from '../utils/scheduledNotifications'

export const useNotifications = () => {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error(
      'useNotifications deve ser usado dentro de NotificationProvider',
    )
  }

  return {
    ...context,
    // Funções utilitárias para diferentes tipos de notificação
    sendSecurityAlert: async (message: string, userId?: string) => {
      if (userId) {
        return context.sendPushNotification(
          userId,
          'Alerta de Segurança',
          message,
          {
            type: 'security_alert',
            priority: 'high',
          },
        )
      } else {
        return context.sendLocalNotification({
          title: 'Alerta de Segurança',
          body: message,
          type: 'security_alert',
          priority: 'high',
          sound: 'default',
        })
      }
    },

    sendEmergencyAlert: async (message: string, userId?: string) => {
      if (userId) {
        return context.sendPushNotification(userId, '🚨 EMERGÊNCIA', message, {
          type: 'emergency',
          priority: 'max',
        })
      } else {
        return context.sendLocalNotification({
          title: '🚨 EMERGÊNCIA',
          body: message,
          type: 'emergency',
          priority: 'max',
          sound: 'default',
        })
      }
    },

    sendReminder: async (message: string, userId?: string) => {
      if (userId) {
        return context.sendPushNotification(userId, 'Lembrete', message, {
          type: 'reminder',
          priority: 'default',
        })
      } else {
        return context.sendLocalNotification({
          title: 'Lembrete',
          body: message,
          type: 'reminder',
          priority: 'default',
          sound: 'default',
        })
      }
    },

    sendSystemUpdate: async (message: string, userId?: string) => {
      if (userId) {
        return context.sendPushNotification(
          userId,
          'Atualização do Sistema',
          message,
          {
            type: 'system_update',
            priority: 'low',
          },
        )
      } else {
        return context.sendLocalNotification({
          title: 'Atualização do Sistema',
          body: message,
          type: 'system_update',
          priority: 'low',
          sound: 'default',
        })
      }
    },

    sendMessage: async (title: string, message: string, userId?: string) => {
      if (userId) {
        return context.sendPushNotification(userId, title, message, {
          type: 'message',
          priority: 'default',
        })
      } else {
        return context.sendLocalNotification({
          title,
          body: message,
          type: 'message',
          priority: 'default',
          sound: 'default',
        })
      }
    },

    // Funções de notificações agendadas
    scheduleMedicationReminder: async (
      medicationName: string,
      times: Array<{ hour: number; minute: number }>,
    ) => {
      return scheduleMedicationReminder(medicationName, times)
    },

    scheduleDelayedEmergency: async (delayMinutes: number, message: string) => {
      return scheduleDelayedEmergency(delayMinutes, message)
    },

    scheduleCustomReminder: async (
      title: string,
      message: string,
      date: Date,
      repeats: boolean = false,
    ) => {
      return context.scheduleNotification(
        {
          title,
          body: message,
          type: 'reminder',
          data: { custom: true },
        },
        {
          type: 'time',
          date,
          repeats,
        },
      )
    },

    scheduleDailyReminder: async (
      title: string,
      message: string,
      hour: number,
      minute: number,
    ) => {
      return context.scheduleNotification(
        {
          title,
          body: message,
          type: 'reminder',
          data: { daily: true },
        },
        {
          type: 'daily',
          hour,
          minute,
          repeats: true,
        },
      )
    },
  }
}
