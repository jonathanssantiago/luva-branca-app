import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { NotificationData, NotificationType } from '../types/notification'
import { scheduleNotification } from './scheduledNotifications'

const SNOOZE_MINUTES = 15

export interface NotificationNavigationData {
  screen?: string
  params?: Record<string, any>
  action?: string
}

/**
 * Navega para a tela apropriada baseada no tipo e dados da notificação
 */
export const navigateFromNotification = (
  notification: NotificationData,
  navigationData?: NotificationNavigationData,
) => {
  try {
    // Se há dados específicos de navegação, usar eles
    if (navigationData?.screen) {
      if (navigationData.params) {
        router.push({
          pathname: navigationData.screen as any,
          params: navigationData.params,
        })
      } else {
        router.push(navigationData.screen as any)
      }
      return
    }

    // Navegação baseada no tipo de notificação
    switch (notification.type) {
      case 'security_alert':
        // Navegar para tela de alertas de segurança
        router.push({
          pathname: '/(tabs)/',
          params: {
            tab: 'home',
            alert: 'security',
            notificationId: notification.id,
          },
        })
        break

      case 'emergency':
        // Navegar para tela de emergência
        router.push({
          pathname: '/(tabs)/',
          params: {
            tab: 'home',
            emergency: 'true',
            notificationId: notification.id,
          },
        })
        break

      case 'reminder':
        // Navegar para configurações ou tela de lembretes
        router.push({
          pathname: '/(tabs)/settings',
          params: {
            section: 'reminders',
            notificationId: notification.id,
          },
        })
        break

      case 'system_update':
        // Navegar para configurações do sistema
        router.push({
          pathname: '/(tabs)/settings',
          params: {
            section: 'system',
            notificationId: notification.id,
          },
        })
        break

      case 'message':
        // Navegar para tela de mensagens ou guardiões
        if (notification.data?.guardianId) {
          router.push({
            pathname: '/(tabs)/guardioes',
            params: {
              guardianId: notification.data.guardianId,
              notificationId: notification.id,
            },
          })
        } else {
          router.push('/(tabs)/guardioes')
        }
        break

      case 'general':
      default:
        // Para notificações gerais, navegar para a tela principal
        router.push({
          pathname: '/(tabs)/',
          params: {
            notificationId: notification.id,
          },
        })
        break
    }
  } catch (error) {
    console.error('Erro ao navegar a partir da notificação:', error)
    // Fallback: navegar para a tela principal
    router.push('/(tabs)/')
  }
}

/**
 * Processa ações específicas de notificação (ex: botões de ação rápida).
 * Async para suportar operações com expo-notifications.
 */
export const handleNotificationAction = async (
  actionIdentifier: string,
  notification: NotificationData,
): Promise<void> => {
  switch (actionIdentifier) {
    case 'view_details':
      navigateFromNotification(notification)
      break

    case 'dismiss':
      // Marcar como lida já é feito pelo NotificationContext antes desta chamada
      await Notifications.dismissNotificationAsync(notification.id).catch(() => {
        // Ignora se a notificação já foi descartada
      })
      break

    case 'emergency_response':
      router.push({
        pathname: '/(tabs)/',
        params: {
          emergencyResponse: 'true',
          notificationId: notification.id,
        },
      })
      break

    case 'mark_done':
      // Lembrete concluído: remover da bandeja do sistema.
      // A marcação como lida no estado do app já foi feita pelo NotificationContext.
      await Notifications.dismissNotificationAsync(notification.id).catch(() => {
        // Ignora se a notificação já foi descartada
      })
      break

    case 'snooze': {
      // Dispensar a notificação atual e reagendar para daqui SNOOZE_MINUTES minutos
      await Notifications.dismissNotificationAsync(notification.id).catch(() => {
        // Ignora se a notificação já foi descartada
      })
      await scheduleNotification(
        {
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: { ...(notification.data ?? {}), snoozed: true, originalId: notification.id },
          sound: notification.sound ?? 'default',
        },
        {
          type: 'interval',
          seconds: SNOOZE_MINUTES * 60,
          repeats: false,
        },
      )
      break
    }

    default:
      break
  }
}

/**
 * Gera dados de navegação para uma notificação personalizada
 */
export const createNotificationNavigation = (
  screen: string,
  params?: Record<string, any>,
  action?: string,
): NotificationNavigationData => ({
  screen,
  params,
  action,
})

/**
 * Mapeia tipos de notificação para suas telas padrão
 */
export const getDefaultScreenForType = (type: NotificationType): string => {
  switch (type) {
    case 'security_alert':
    case 'emergency':
      return '/(tabs)/'
    case 'reminder':
    case 'system_update':
      return '/(tabs)/settings'
    case 'message':
      return '/(tabs)/guardioes'
    default:
      return '/(tabs)/'
  }
}
