import * as Notifications from 'expo-notifications'
import { NotificationData, NotificationType } from '../types/notification'
import { getChannelForType, getPriorityForType } from '../config/notifications'
import { Platform } from 'react-native'

export interface ScheduledNotificationOptions {
  title: string
  body: string
  type?: NotificationType
  data?: Record<string, any>
  sound?: 'default' | string
  badge?: number
  priority?: 'min' | 'low' | 'default' | 'high' | 'max'
}

export interface NotificationTrigger {
  type: 'time' | 'interval' | 'daily' | 'weekly' | 'monthly'
  date?: Date
  seconds?: number
  hour?: number
  minute?: number
  weekday?: number // 1-7 (Sunday = 1)
  day?: number // day of month
  repeats?: boolean
}

/**
 * Agenda uma notificação para ser enviada em uma data/hora específica
 */
export const scheduleNotification = async (
  options: ScheduledNotificationOptions,
  trigger: NotificationTrigger,
): Promise<string> => {
  try {
    let notificationTrigger: any = null

    switch (trigger.type) {
      case 'time':
        if (!trigger.date) {
          throw new Error(
            'Data é obrigatória para notificações agendadas por tempo',
          )
        }
        notificationTrigger = {
          date: trigger.date,
          repeats: trigger.repeats || false,
        }
        break

      case 'interval':
        if (!trigger.seconds) {
          throw new Error(
            'Segundos são obrigatórios para notificações por intervalo',
          )
        }
        notificationTrigger = {
          seconds: trigger.seconds,
          repeats: trigger.repeats || false,
        }
        break

      case 'daily':
        if (trigger.hour === undefined || trigger.minute === undefined) {
          throw new Error(
            'Hora e minuto são obrigatórios para notificações diárias',
          )
        }
        notificationTrigger = {
          hour: trigger.hour,
          minute: trigger.minute,
          repeats: true,
        }
        break

      case 'weekly':
        if (
          trigger.hour === undefined ||
          trigger.minute === undefined ||
          !trigger.weekday
        ) {
          throw new Error(
            'Hora, minuto e dia da semana são obrigatórios para notificações semanais',
          )
        }
        notificationTrigger = {
          weekday: trigger.weekday,
          hour: trigger.hour,
          minute: trigger.minute,
          repeats: true,
        }
        break

      case 'monthly':
        if (
          trigger.hour === undefined ||
          trigger.minute === undefined ||
          !trigger.day
        ) {
          throw new Error(
            'Hora, minuto e dia do mês são obrigatórios para notificações mensais',
          )
        }
        notificationTrigger = {
          day: trigger.day,
          hour: trigger.hour,
          minute: trigger.minute,
          repeats: true,
        }
        break

      default:
        throw new Error('Tipo de trigger não suportado')
    }

    const notificationContent: any = {
      title: options.title,
      body: options.body,
      data: options.data || {},
      sound: options.sound || 'default',
      categoryIdentifier: options.type || 'general',
    }

    if (options.badge !== undefined) {
      notificationContent.badge = options.badge
    }

    // Adicionar canal específico para Android
    if (Platform.OS === 'android') {
      notificationContent.channelId = getChannelForType(
        options.type || 'general',
      )
      notificationContent.priority = getPriorityForType(
        options.type || 'general',
      )
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: notificationTrigger,
    })

    console.log('Notificação agendada com ID:', identifier)
    return identifier
  } catch (error) {
    console.error('Erro ao agendar notificação:', error)
    throw error
  }
}

/**
 * Cancela uma notificação agendada
 */
export const cancelScheduledNotification = async (
  notificationId: string,
): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
    console.log('Notificação cancelada:', notificationId)
  } catch (error) {
    console.error('Erro ao cancelar notificação:', error)
    throw error
  }
}

/**
 * Cancela todas as notificações agendadas
 */
export const cancelAllScheduledNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    console.log('Todas as notificações agendadas foram canceladas')
  } catch (error) {
    console.error('Erro ao cancelar todas as notificações:', error)
    throw error
  }
}

/**
 * Lista todas as notificações agendadas
 */
export const getScheduledNotifications = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync()
    console.log('Notificações agendadas:', scheduled.length)
    return scheduled
  } catch (error) {
    console.error('Erro ao buscar notificações agendadas:', error)
    return []
  }
}

/**
 * Funções utilitárias para tipos comuns de agendamento
 */

// Agendar lembrete de check-in de segurança (diário)
export const scheduleSecurityCheckReminder = async (
  hour: number = 20,
  minute: number = 0,
) => {
  return scheduleNotification(
    {
      title: 'Check-in de Segurança',
      body: 'Não se esqueça de fazer seu check-in de segurança hoje',
      type: 'reminder',
      data: { type: 'security_check', category: 'daily_reminder' },
    },
    {
      type: 'daily',
      hour,
      minute,
      repeats: true,
    },
  )
}

// Agendar lembrete de backup de dados (semanal)
export const scheduleBackupReminder = async (
  weekday: number = 1,
  hour: number = 10,
  minute: number = 0,
) => {
  return scheduleNotification(
    {
      title: 'Backup de Dados',
      body: 'Faça backup dos seus dados importantes',
      type: 'system_update',
      data: { type: 'backup_reminder', category: 'weekly_reminder' },
    },
    {
      type: 'weekly',
      weekday,
      hour,
      minute,
      repeats: true,
    },
  )
}

// Agendar verificação de guardiões (semanal)
export const scheduleGuardianCheckReminder = async (
  weekday: number = 7,
  hour: number = 18,
  minute: number = 0,
) => {
  return scheduleNotification(
    {
      title: 'Verificar Guardiões',
      body: 'Verifique se os dados dos seus guardiões estão atualizados',
      type: 'reminder',
      data: { type: 'guardian_check', category: 'weekly_reminder' },
    },
    {
      type: 'weekly',
      weekday,
      hour,
      minute,
      repeats: true,
    },
  )
}

// Agendar notificação de emergência retardada
export const scheduleDelayedEmergency = async (
  delayMinutes: number,
  message: string,
) => {
  const triggerDate = new Date(Date.now() + delayMinutes * 60 * 1000)

  return scheduleNotification(
    {
      title: '🚨 Alerta de Emergência Programado',
      body: message,
      type: 'emergency',
      data: {
        type: 'delayed_emergency',
        originalTime: new Date().toISOString(),
        delayMinutes,
      },
    },
    {
      type: 'time',
      date: triggerDate,
      repeats: false,
    },
  )
}

// Agendar lembrete de medicamento (personalizado)
export const scheduleMedicationReminder = async (
  medicationName: string,
  times: Array<{ hour: number; minute: number }>,
) => {
  const scheduledIds: string[] = []

  for (const time of times) {
    const id = await scheduleNotification(
      {
        title: 'Lembrete de Medicamento',
        body: `Hora de tomar: ${medicationName}`,
        type: 'reminder',
        data: {
          type: 'medication',
          medication: medicationName,
          time: `${time.hour}:${time.minute.toString().padStart(2, '0')}`,
        },
      },
      {
        type: 'daily',
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    )
    scheduledIds.push(id)
  }

  return scheduledIds
}
