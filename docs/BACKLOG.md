# Backlog de tarefas

Documento vivo: consolida **TODOs no código**, **pendências de produto** (README), **push notifications** e **itens a confirmar** (infra/Supabase). Atualize este arquivo ao concluir ou repriorizar itens.

---

## 1. Código — implementação direta

### ~~1.1 `useEmergency` — usuário real e persistência (`src/hooks/index.ts`)~~ ✅ Concluído

**Problema:** `createEmergency` usa `userId: 'current-user'` fixo e só faz `console.log` em vez de enviar dados ao backend.

**O que fazer:**

1. **Obter `user.id` do auth**

   - Importar e usar `useAuth()` de `src/context/SupabaseAuthContext.tsx` dentro do hook `useEmergency` (ou receber `userId` como argumento de `createEmergency` vindo da tela, para manter o hook testável).
   - Se não houver usuário, abortar com `Alert` e não criar registro fantasma.

2. **Definir destino dos dados** (escolher uma estratégia e implementar):

   - **A)** Inserir na tabela/modelo local **WatermelonDB** (`emergency_alerts`) com `sync_status` adequado e deixar o `SyncService` empurrar para a API NestJS; ou
   - Usar Supabase (`supabase.from(...)`) se existir tabela remota equivalente.  
     O projeto já tem fluxo de **alertas de emergência** em `src/services/sync/syncEmergencyAlerts.ts` — alinhar o payload e o `userId` com esse fluxo evita duplicar lógica.

3. **Estado local:** `setEmergencies` pode continuar para UX imediata, mas o registro deve refletir o ID retornado pelo servidor ou o `local id` do WatermelonDB.

**Critério de pronto:** criar emergência com usuário autenticado real; dado visível no backend ou na fila de sync conforme a arquitetura escolhida; remover o comentário `TODO`.

---

### ~~1.2 Cabeçalho das tabs — busca e menu (`src/components/ui/TabsHeader.tsx`)~~ ✅ Concluído

**Problema:** Ícones de lupa e menu (`dots-vertical`) não fazem nada além de comentários `TODO`.

**O que fazer:**

1. **Busca (`magnify`):**

   - Decidir escopo: busca global (navegar para `app/search` se existir) ou busca contextual ao tab atual.
   - Implementar `onPress`: por exemplo `router.push('/search')` ou abrir um `Modal` / `Portal` com `TextInput` e lista filtrada.
   - Reutilizar padrões de `app/search.tsx` e i18n (`Locales`) se já houver tela de busca.

2. **Menu (`dots-vertical`):**
   - Abrir `Menu` do React Native Paper (como em `app/(tabs)/_layout.tsx` no canto superior) com ações: configurações, privacidade, logout — ou um subconjunto coerente com o restante do app.
   - Evitar duplicar o mesmo menu do `TabLayout`; se o header for só cosmético, considerar remover os botões ou ligar ao mesmo handler do menu existente.

**Critério de pronto:** ambos os botões têm comportamento definido e testável; sem `TODO` no arquivo.

---

### ~~1.3 Ações de notificação — lembrete concluído e adiamento (`src/utils/notificationNavigation.ts`)~~ ✅ Concluído

**Problema:** `handleNotificationAction` trata `mark_done` e `snooze` apenas com `console.log`.

**O que fazer:**

1. **`mark_done`:**

   - Identificar onde lembretes são armazenados (local: WatermelonDB / AsyncStore / apenas payload da notificação).
   - Atualizar estado persistido (ex.: flag `completed`, remoção de agendamento local).
   - Se houver tabela `notification_logs` ou entidade no backend, opcionalmente sincronizar.

2. **`snooze`:**
   - Reagendar: nova notificação local com `expo-notifications` para daqui a 15 minutos (ou valor configurável em `src/config/notifications.ts`).
   - Cancelar a notificação atual se necessário (`dismissAllNotifications` / identificador).
   - Garantir que `notification.id` ou metadata permita correlacionar o lembrete adiado.

**Critério de pronto:** ações refletem estado real (usuário vê lembrete concluído ou novo disparo após snooze); logs só para debug opcional.

---

## 2. Infraestrutura e Supabase — validar fora do repositório

### ~~2.1 API NestJS (sync)~~ ✅ Substituída por Edge Functions

O backend NestJS foi **eliminado**. A sincronização agora usa:
- `GET /sync-pull?since=<ms>` — `supabase/functions/sync-pull/index.ts`
- `POST /sync-push` — `supabase/functions/sync-push/index.ts`

`ApiClient.ts` usa `EXPO_PUBLIC_SUPABASE_URL/functions/v1` como base URL.

### ~~2.2 Edge Functions~~ ✅ Implementadas

Todas as edge functions necessárias existem em `supabase/functions/`:
- `sync-pull` — pull de dados desde timestamp
- `sync-push` — push de writes por entidade
- `send-push` — push via Expo API (já existia)
- `send-notification` — push + email via Supabase Admin (reimplementada)

Para fazer deploy: `supabase functions deploy sync-pull sync-push send-push send-notification`

### ~~2.3 Migrações~~ ✅ Reorganizadas

Os 12 arquivos de migration foram substituídos por 4 arquivos organizados:
- `0001_core_tables.sql` — todas as tabelas + `handle_updated_at` + triggers de negócio
- `0002_auth_triggers.sql` — `handle_new_user` + `auth_set_phone_from_metadata`
- `0003_rls.sql` — RLS para todas as tabelas
- `0004_storage.sql` — buckets e RLS do Storage (ordem correta: bucket antes de policy)

Para aplicar: `supabase db push` (ou `supabase db reset` em desenvolvimento).

### 2.4 Auth — OTP

- Verificar se telas em `app/(auth)/` chamam `verifyOtp` / `resendOtp` do `SupabaseAuthContext` onde o fluxo for por telefone/email OTP (`EXPO_PUBLIC_USE_PHONE_AUTH`).

### ~~2.5 Limite de guardiões (até 5)~~ ✅ Implementado

Validação via trigger `validate_guardians_limit` no Postgres + validação na UI. Limite de diário também implementado via `validate_diary_entries_limit` (max 100).

---

## 3. Produto — roadmap (`README.md`)

Itens ainda abertos no README (marcados `[ ]`):

| Área        | Descrição                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Social      | Login Google / Apple ID                                                                              |
| Nuvem       | Backup automático / sync ampla de dados                                                              |
| Offline     | Modo offline avançado (o app já tem WatermelonDB + sync — detalhar o que falta: conflitos, UX, etc.) |
| Segurança   | Análise em tempo real                                                                                |
| Relatórios  | Dashboard analítico                                                                                  |
| i18n        | Espanhol e inglês completos                                                                          |
| Emergência  | Sistema avançado (ex.: botão de pânico integrado)                                                    |
| Performance | Lazy loading, code splitting                                                                         |
| Qualidade   | Testes automatizados (~90% cobertura)                                                                |

Para cada item: criar issue com critérios de aceite antes de implementar.

---

## 4. Push notifications — próximos passos (`docs/PUSH_NOTIFICATIONS.md`)

1. **Delivery tracking** — registrar confirmação de entrega/abertura (Expo receipt + tabela ou analytics).
2. **Agendadas** — notificações locais/remotas com horário (integração com `expo-notifications` + backend se necessário).
3. **Templates** — mapear tipos (`security_alert`, `reminder`, etc.) para títulos/corpos padronizados.
4. **Dashboard** — ferramenta administrativa (fora do app ou painel web).
5. **Estatísticas** — métricas agregadas (taxa de abertura, falhas).

---

## 5. Referências rápidas

| Tema               | Onde olhar                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| Sync / fila        | `src/services/SyncService.ts`, `src/services/sync/syncEmergencyAlerts.ts` |
| Auth               | `src/context/SupabaseAuthContext.tsx`                                     |
| Notificações       | `src/context/NotificationContext.tsx`, `src/hooks/useNotifications.ts`    |
| Documentação geral | `DOCUMENTATION.md`                                                        |

---

_Última consolidação: baseada em grep por `TODO` no código e seções de roadmap/assunções da documentação._
