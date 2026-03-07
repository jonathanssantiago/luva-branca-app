# Sistema de Push Notifications - Luva Branca

Este documento descreve como foi implementado o sistema completo de push notifications usando Expo + Supabase no aplicativo Luva Branca.

## 📦 Estrutura Implementada

### 1. **Tabelas do Supabase**

- `user_push_tokens`: Armazena tokens Expo dos usuários
- `notification_logs`: Log de notificações enviadas (opcional, para auditoria)

### 2. **Edge Function**

- `send-push`: Processa e envia push notifications via API do Expo

### 3. **Componentes Frontend**

- Hook `useNotifications`: Interface principal para notificações
- Contexto `NotificationContext`: Gerenciamento global de estado
- Utilitários em `sendPushNotification.ts`: Funções auxiliares
- Configurações em `notifications.ts`: Canais e categorias

## 🚀 Como Usar

### **Configuração Inicial**

```typescript
import { useNotifications } from '@/src/hooks/useNotifications'

function App() {
  const { hasPermission, requestPermissions, registerForPushNotifications } =
    useNotifications()

  // Solicitar permissões na primeira vez
  useEffect(() => {
    if (!hasPermission) {
      requestPermissions()
    }
  }, [])
}
```

### **Enviar Notificação Local**

```typescript
const { sendLocalNotification } = useNotifications()

await sendLocalNotification({
  title: 'Alerta de Segurança',
  body: 'Movimento detectado em sua área',
  type: 'security_alert',
  priority: 'high',
  sound: 'default',
})
```

### **Enviar Push Notification**

```typescript
import { sendNotificationToUser } from '@/src/lib/sendPushNotification'

// Para um usuário específico
const success = await sendNotificationToUser(
  userId,
  'Título da Notificação',
  'Corpo da mensagem',
  { type: 'emergency', priority: 'high' },
)

// Usando o hook
const { sendPushNotification } = useNotifications()
await sendPushNotification(userId, title, body, data)
```

### **Funções Utilitárias**

```typescript
const {
  sendSecurityAlert,
  sendEmergencyAlert,
  sendReminder,
  sendSystemUpdate,
} = useNotifications()

// Notificação local ou push (dependendo se userId é fornecido)
await sendSecurityAlert('Alerta importante', userId) // push
await sendSecurityAlert('Alerta importante') // local
```

## 🛠️ Configuração do Ambiente

### **1. Migrations do Supabase**

Execute as migrations para criar as tabelas:

```sql
-- Arquivo: supabase/migrations/20250611000001_create_user_push_tokens_table.sql
-- Arquivo: supabase/migrations/20250611000002_create_notification_logs_table.sql
```

### **2. Deploy da Edge Function**

```bash
# Deploy da função para Supabase
supabase functions deploy send-push

# Testar localmente
supabase functions serve send-push
```

### **3. Configuração do Expo**

Certifique-se de que o `app.config.js` inclui:

```javascript
export default {
  expo: {
    // ... outras configurações
    notification: {
      icon: './assets/notification-icon.png',
      color: '#ffffff',
      sounds: ['./assets/sounds/notification.wav'],
    },
    extra: {
      eas: {
        projectId: 'your-project-id',
      },
    },
  },
}
```

## 📱 Tipos de Notificação

O sistema suporta os seguintes tipos:

- **`security_alert`**: Alertas de segurança (alta prioridade)
- **`emergency`**: Emergências (prioridade máxima)
- **`reminder`**: Lembretes (prioridade padrão)
- **`system_update`**: Atualizações do sistema (baixa prioridade)
- **`message`**: Mensagens gerais (prioridade padrão)
- **`general`**: Notificações gerais (prioridade padrão)

## 🔧 Configurações Avançadas

### **Canais de Notificação (Android)**

Os canais são configurados automaticamente no arquivo `src/config/notifications.ts`:

```typescript
export const notificationChannels = [
  {
    name: 'security-alerts',
    displayName: 'Alertas de Segurança',
    importance: 5, // MAX
    vibrationPattern: [0, 250, 250, 250],
    // ... outras configurações
  },
]
```

### **Categorias de Notificação (iOS)**

Permitem ações rápidas nas notificações:

```typescript
export const notificationCategories = [
  {
    identifier: 'security_alert',
    actions: [
      {
        identifier: 'view_details',
        buttonTitle: 'Ver Detalhes',
        options: { opensAppToForeground: true },
      },
    ],
  },
]
```

## 🔐 Segurança

### **Autenticação**

- A edge function valida o token de autenticação do Supabase
- Usuários só podem enviar notificações se autenticados
- RLS (Row Level Security) protege os tokens de push

### **Validação de Dados**

- Todos os payloads são validados antes do envio
- Tokens inválidos são automaticamente filtrados
- Logs de auditoria para rastreamento

## 🧪 Testes

### **Componente de Teste**

Use o componente `NotificationTest` para testar:

```typescript
import { NotificationTest } from '@/src/components/NotificationTest'

function TestScreen() {
  return <NotificationTest targetUserId="user-uuid-here" />
}
```

### **Testes na Tela de Notificações**

Em modo de desenvolvimento (`__DEV__`), dois FABs aparecem:

- **+**: Teste de notificação local
- **✈️**: Teste de push notification

## 🐛 Troubleshooting

### **Token não é gerado**

- Verificar se está rodando em dispositivo físico
- Confirmar que as permissões foram concedidas
- Verificar configuração do `projectId` no Expo

### **Push notifications não chegam**

- Verificar se a edge function está funcionando
- Confirmar que o token está salvo no Supabase
- Testar a conectividade com a API do Expo

### **Notificações não aparecem no Android**

- Verificar se os canais foram criados corretamente
- Confirmar configurações de prioridade
- Verificar se o app não está em modo "Não perturbar"

## 📚 Referências

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/sending-notifications-custom/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Expo Notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/)

## 🎯 Próximos Passos

1. **Análise de Delivery**: Implementar tracking de entrega
2. **Notificações Agendadas**: Suporte a notificações programadas
3. **Templates**: Sistema de templates para diferentes tipos
4. **Dashboard**: Interface administrativa para gestão
5. **Estatísticas**: Métricas de engajamento e entrega
