import {
  AndroidNotificationPriority,
  NotificationChannelInput,
} from 'expo-notifications'

// Configuração dos canais de notificação para Android
export const notificationChannels: NotificationChannelInput[] = [
  {
    name: 'security-alerts',
    description: 'Notificações importantes sobre segurança e emergências',
    importance: 5, // MAX
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    enableLights: true,
    lightColor: '#FF0000',
    lockscreenVisibility: 1, // PUBLIC
    bypassDnd: true,
  },
  {
    name: 'emergency',
    description: 'Notificações críticas de emergência',
    importance: 5, // MAX
    vibrationPattern: [0, 500, 200, 500],
    sound: 'default',
    enableLights: true,
    lightColor: '#FF0000',
    lockscreenVisibility: 1, // PUBLIC
    bypassDnd: true,
  },
  {
    name: 'general',
    description: 'Notificações gerais do aplicativo',
    importance: 3, // DEFAULT
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    enableLights: true,
    lightColor: '#0000FF',
    lockscreenVisibility: 1, // PUBLIC
  },
  {
    name: 'reminders',
    description: 'Lembretes e tarefas programadas',
    importance: 3, // DEFAULT
    vibrationPattern: [0, 250],
    sound: 'default',
    enableLights: false,
    lockscreenVisibility: 1, // PUBLIC
  },
  {
    name: 'system-updates',
    description: 'Informações sobre atualizações e manutenção',
    importance: 2, // LOW
    vibrationPattern: [0, 100],
    sound: 'default',
    enableLights: false,
    lockscreenVisibility: 0, // SECRET
  },
]

// Configuração padrão de categorias de notificação
export const notificationCategories = [
  {
    identifier: 'security_alert',
    actions: [
      {
        identifier: 'view_details',
        buttonTitle: 'Ver Detalhes',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dispensar',
        options: {
          opensAppToForeground: false,
        },
      },
    ],
    options: {
      customDismissAction: true,
      allowInCarPlay: false,
      allowAnnouncement: true,
      categorySummaryFormat: '%u alertas de segurança',
      customPlaceholder: 'Alerta de Segurança',
    },
  },
  {
    identifier: 'emergency',
    actions: [
      {
        identifier: 'emergency_response',
        buttonTitle: 'Responder',
        options: {
          opensAppToForeground: true,
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ],
    options: {
      customDismissAction: false,
      allowInCarPlay: true,
      allowAnnouncement: true,
      categorySummaryFormat: '%u emergências',
      customPlaceholder: 'Emergência',
    },
  },
  {
    identifier: 'reminder',
    actions: [
      {
        identifier: 'mark_done',
        buttonTitle: 'Concluído',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Adiar',
        options: {
          opensAppToForeground: false,
        },
      },
    ],
    options: {
      customDismissAction: true,
      allowInCarPlay: false,
      allowAnnouncement: false,
      categorySummaryFormat: '%u lembretes',
      customPlaceholder: 'Lembrete',
    },
  },
]

// Mapeamento de tipos para canais
export const getChannelForType = (type: string): string => {
  switch (type) {
    case 'security_alert':
      return 'security-alerts'
    case 'emergency':
      return 'emergency'
    case 'reminder':
      return 'reminders'
    case 'system_update':
      return 'system-updates'
    default:
      return 'general'
  }
}

// Mapeamento de tipos para prioridade
export const getPriorityForType = (
  type: string,
): AndroidNotificationPriority => {
  switch (type) {
    case 'emergency':
    case 'security_alert':
      return AndroidNotificationPriority.MAX
    case 'reminder':
    case 'message':
      return AndroidNotificationPriority.DEFAULT
    case 'system_update':
      return AndroidNotificationPriority.LOW
    default:
      return AndroidNotificationPriority.DEFAULT
  }
}
