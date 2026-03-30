# Luva Branca — Documentação do Projeto

> **Sua segurança em primeiro lugar**

## 1) Resumo Executivo

O **Luva Branca** é um aplicativo mobile de **segurança pessoal** desenvolvido com **React Native + Expo**, com backend em **Supabase**. O projeto prioriza uma experiência simples de autenticação e inclui recursos voltados a **proteção pessoal e privacidade**, como **modo disfarçado**, **rede de guardiões**, **SOS com localização**, **gerenciamento seguro de documentos**, **gravações de áudio** e **notificações**.

- **Público-alvo**: usuários (principalmente brasileiros) que desejam um app de segurança pessoal com foco em privacidade.
- **Problema que resolve**: facilitar ações rápidas em situações de risco (acionamento de guardiões/autoridades, compartilhamento de localização) e oferecer ferramentas de registro/organização (documentos e gravações) com controle de privacidade.
- **Diferenciais técnicos**:
  - **Modo disfarçado** que apresenta UI “inofensiva” com acesso protegido a recursos reais.
  - **Buckets privados no Supabase Storage** com **RLS** e uso de **signed URLs** para acesso a arquivos.
  - **Camada offline-first**: banco local (**WatermelonDB**) + fila de sincronização + stores (**Zustand**); sincronização via **Supabase Edge Functions** (`sync-pull`, `sync-push`) com Bearer token — sem backend externo.
  - **Acesso offline** de sessão e tratamento de alertas quando sem rede.

**Identidade no Expo**: o `app.config.js` pode usar nome/slug de produto distintos do repositório (ex.: **SIAPeP-M** / `siapepm`). O código-fonte e esta documentação referem-se ao projeto **Luva Branca** de forma genérica.

Fontes:

- Visão geral, funcionalidades e setup: `README.md`
- Config do app e permissões: `app.config.js`

---

## 2) Arquitetura e Stack

### 2.1 Visão de alto nível (diagrama textual)

```
[App Expo/React Native (Expo Router)]
  |
  |-- Auth + Sessão/Offline (Supabase Auth)     -> Supabase (Auth + tabelas)
  |-- Banco local (WatermelonDB) + Zustand    -> perfil, guardiões, diário, mídia, alertas, fila sync
  |-- SyncService + ApiClient (axios)         -> Supabase Edge Functions (sync-pull / sync-push) + Bearer do Supabase
  |-- SOS (Localização + SMS + WhatsApp)      -> Expo Location / Expo SMS / Linking
  |-- Guardiões / Diário / Documentos / Áudio -> leitura/escrita local + sync; Storage Supabase (signed URLs)
  |-- Notificações (local + push)             -> Expo Notifications + Edge Function send-push
  |-- Privacidade e modo disfarçado           -> Context + SecureStore + navegação condicional
```

### 2.2 Tecnologias e bibliotecas principais

- **App / UI**

  - Expo / React Native: `package.json`
  - Expo Router (rotas baseadas em arquivos): `package.json` (`expo-router`), pasta `app/`
  - React Native Paper (Material Design): `package.json` (`react-native-paper`)
  - Reanimated / Gesture Handler: `package.json`

- **Mobile APIs (Expo)**

  - Notificações: `expo-notifications` (`package.json`)
  - Localização: `expo-location` (`package.json`)
  - Armazenamento seguro: `expo-secure-store` (`package.json`)
  - SMS: `expo-sms` (`package.json`)
  - Biometria local: `expo-local-authentication` (`package.json`)

- **Estado local e sync**

  - WatermelonDB: `src/database/` (schema, models, migrations locais)
  - Zustand: `src/stores/*` (guardiões, diário, perfil, mídia, sync, alertas de emergência)
  - Sincronização: `src/services/SyncService.ts`, módulos em `src/services/sync/*`
  - Cliente HTTP: `src/services/ApiClient.ts` (axios + interceptor com JWT do Supabase)

- **Backend (Supabase — sem servidor externo)**
  - Supabase JS: `lib/supabase.ts`, `package.json` (`@supabase/supabase-js`)
  - Edge Functions (Deno): `supabase/functions/` — `sync-pull`, `sync-push`, `send-push`, `send-notification`
  - Migrações SQL: `supabase/migrations/` — 4 arquivos organizados (`0001–0004`)
  - `ApiClient` usa `EXPO_PUBLIC_SUPABASE_URL/functions/v1` como base URL

### 2.3 Estrutura de pastas (resumo)

- `app/`: telas e rotas do **Expo Router**
  - `app/_layout.tsx`: providers globais e navegação condicional (auth / offline / modo disfarçado); inclui `DatabaseProvider` e `PermissionsManager`
  - `app/(auth)/`: fluxo de autenticação
  - `app/(tabs)/`: abas principais — **SOS** (`index`), **Rede** (`guardioes`), **Guia** (`orientacao`), **Apoio** (`apoio`), **Menu** (`config-profile`); telas empilhadas com `href: null`: `documentos`, `arquivo` (gravações), `settings`
  - `app/diary/`: diário de segurança (lista, criar, editar, visualizar)
- `src/`: hooks, contexts, componentes, serviços e estado
  - `src/context/*`: Auth, Theme, Notifications, DisguisedMode
  - `src/providers/DatabaseProvider.tsx`: inicializa observadores WatermelonDB, rede (`NetInfo`) e `SyncService`
  - `src/database/*`: WatermelonDB — `schema.ts`, models, `migrations/`
  - `src/stores/*`: stores Zustand + `observers/` (reatividade com dados locais)
  - `src/services/*`: `ApiClient`, `SyncService`, sincronização por entidade
  - `src/hooks/*`: documentos, áudio, notificações, guardiões, permissões, snackbar global (`useAppSnackbar`) etc.
  - `src/components/ui/AppSnackbar.tsx`: feedback visual consistente
- `lib/`: utilitários, i18n, cliente Supabase, estilos
- `plugins/`: config Expo (ex.: `withSimdjson.js` referenciado em `app.config.js`)
- `supabase/`: migrações e edge functions
- `docs/`: documentação auxiliar (ex.: push notifications)

---

## 3) Como rodar localmente

### 3.1 Pré-requisitos

De acordo com o `README.md`:

- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (Android) e/ou Xcode (iOS, macOS)

### 3.2 Instalação

1. Instale dependências:

```bash
npm install
# ou: yarn install
```

2. Configure variáveis de ambiente (copie `.env.example` para `.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sua-chave-anonima
EXPO_PUBLIC_USE_PHONE_AUTH=true

# Opcional: sobrescreve URL base das Edge Functions (padrão: SUPABASE_URL/functions/v1)
# EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=https://seu-projeto.supabase.co/functions/v1
```

**Onde isso é consumido**:

- `app.config.js` injeta em `expo.extra` (`supabaseUrl`, `supabaseAnonKey`)
- `lib/supabase.ts` lê de `Constants.expoConfig?.extra` e fallback para `process.env.*`
- `src/services/ApiClient.ts` usa `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL` (ou deriva de `EXPO_PUBLIC_SUPABASE_URL`) como base para as Edge Functions de sync

> Observação importante: `lib/supabase.ts` lança erro se `supabaseUrl`/`supabaseAnonKey` estiverem ausentes.

### 3.3 Rodando o app

Scripts do `package.json`:

```bash
npm start
npm run android
npm run ios
npm run web
```

- `npm start` executa `expo start` (`package.json`).
- `npm run android`/`ios` usam `expo run:*` (gera e roda nativo).

### 3.4 Build (EAS)

Configurações do EAS em: `eas.json`.

Perfis identificados:

- `development` (dev client)
- `preview` / `preview-apk`
- `production` (AAB)
- `adhoc` (inclui `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY` no `eas.json`)

> **Atenção (segurança)**: manter `EXPO_PUBLIC_SUPABASE_KEY` em arquivos versionados pode ser aceitável no contexto Supabase (anon key é pública), mas ainda assim vale revisar se não há outras credenciais sensíveis indevidas em builds.

### 3.5 Observações sobre Expo Router

- Layout global e providers: `app/_layout.tsx`
- Auth group: `app/(auth)/_layout.tsx`
- Tabs group: `app/(tabs)/_layout.tsx`

---

## 4) Funcionalidades (guia por módulos)

Nesta seção, cada módulo descreve: objetivo, fluxo, arquivos relevantes, hooks/contexts e pontos de falha.

### 4.1 Autenticação (incluindo verificação)

**Objetivo**: autenticar usuário e manter sessão persistida, com suporte a restauração e modos alternativos (offline / modo disfarçado).

**Fluxo (alto nível)**

1. App inicializa.
2. `AuthProvider` tenta recuperar sessão.
3. Roteamento central decide tela inicial: tabs, login ou modo disfarçado.

**Implementado em**

- Providers e roteamento: `app/_layout.tsx` (usa `AuthProvider`, `useAuth`, `usePrivacySettings` e decide `router.replace`)
- Contexto de auth e sessão/recuperação: `src/context/SupabaseAuthContext.tsx`
- Telas auth (grupo): `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/signup.tsx` (arquivos existem no tree do workspace)

**Hooks/contexts envolvidos**

- `useAuth()` de `src/context/SupabaseAuthContext.tsx`

**Pontos de erro comuns**

- Variáveis do Supabase ausentes → erro fatal em `lib/supabase.ts`.
- Falhas ao restaurar sessão → cai para login ou, se houver “login recente”, ativa modo offline (ver lógica em `src/context/SupabaseAuthContext.tsx`).

### 4.2 Permissões (setup inicial)

**Objetivo**: coletar permissões críticas (ex.: localização, notificações e áudio) de forma guiada após login.

**Fluxo**

1. Usuário loga.
2. `PermissionsManager` verifica permissões e se é “first time setup”.
3. Caso faltem permissões críticas, abre modal/componente de setup.

**Implementado em**

- Wrapper global: `app/_layout.tsx` (envolve o `Stack` com `<PermissionsManager userId={user?.id}>`)
- Orquestração: `src/components/PermissionsManager.tsx` (decide se mostra `PermissionsSetup`)
- Lógica de permissões: `src/hooks/usePermissions.ts`
- Declarações de permissão nativas:
  - Android: `app.config.js` (`android.permissions`)
  - iOS: `app.config.js` (`ios.infoPlist.*UsageDescription`)

**Pontos de falha comuns**

- Em simuladores: push notifications podem não funcionar por limitações do Expo (ver troubleshooting em `docs/PUSH_NOTIFICATIONS.md`).

### 4.3 SOS / Emergência

**Objetivo**: permitir que o usuário acione rapidamente uma emergência enviando alertas com localização.

**Fluxo (observado no código)**

- Obtém permissão e localização (`expo-location`).
- Monta mensagem com link do Google Maps.
- Envia alertas para guardiões (SMS + tentativa WhatsApp via `Linking.openURL`).
- Pode abrir discagem para emergência policial (ex.: `tel:190`).
- Registra alertas offline e tenta reenviar depois.

**Implementado em**

- Tela SOS: `app/(tabs)/index.tsx`

**Hooks/contexts envolvidos**

- `useGuardians()` (`src/hooks/useGuardians.ts`) para obter contatos de emergência
- `usePermissions()` (`src/hooks/usePermissions.ts`) para permissão de localização/notificações
- `useOfflineAlerts()` (`src/hooks/useOfflineAlerts.ts`) para enfileirar alertas quando offline
- `useNotifications()` (`src/hooks/useNotifications.ts`) para notificação local (confirmação)

**Pontos de falha comuns**

- Localização desativada / permissão negada: a tela trata com `Alert` e direciona para settings (ver `app/(tabs)/index.tsx`).
- SMS pode não estar disponível: `expo-sms` tem `SMS.isAvailableAsync()`.
- WhatsApp: `Linking.openURL` pode falhar se não houver app ou URL inválida.

### 4.4 Guardiões

**Objetivo**: manter lista de contatos de confiança que recebem alertas.

**Fluxo**

- CRUD de guardiões.
- Seleção de guardiões de emergência.
- Limite de guardiões (texto na UI sugere “até 5”).

**Implementado em**

- Tela: `app/(tabs)/guardioes.tsx`
- Hook: `src/hooks/useGuardians.ts`
- Tipos: `lib/supabase.ts` (`Guardian`)
- Migração: `supabase/migrations/20250603_create_guardians_unified.sql`

**Pontos de falha comuns**

- Validação de dados (nome/telefone/parentesco) já existe na tela.

### 4.5 Documentos (upload/preview/delete)

**Objetivo**: upload e gerenciamento seguro de documentos e imagens pessoais.

**Fluxo**

- Usuário seleciona documento (DocumentPicker) ou imagem (camera/galeria).
- Upload para bucket `documentos` no caminho `${user.id}/...`.
- Listagem do bucket e geração de **signed URL** para download/preview.

**Implementado em**

- Hook: `src/hooks/useDocumentUpload.ts`
- Políticas do bucket: `supabase/migrations/20250606_create_documents_bucket.sql`

**Pontos de falha comuns**

- Arquivo > 50MB: validado em `src/hooks/useDocumentUpload.ts`.
- Tipo não suportado: validado em `src/hooks/useDocumentUpload.ts`.
- Bucket inexistente/políticas incorretas: falhas em `supabase.storage.from('documentos')...`.

### 4.6 Gravações / Áudio

**Objetivo**: gravar e armazenar áudio de forma privada.

**Implementado em**

- Hook: `src/hooks/useAudioRecording.ts`
- Bucket e políticas: `supabase/migrations/20250110_create_audios_bucket.sql`

**Estratégia**

- Upload em pasta do usuário (ex.: `${user.id}/arquivo.m4a`).
- Acesso via **signed URL** (24h em pontos do hook).

### 4.7 Notificações (local/push/agendadas)

**Objetivo**: enviar notificações locais e push (via Expo).

**Implementação (conforme docs e código)**

- Documento de arquitetura e uso: `docs/PUSH_NOTIFICATIONS.md`
- Contexto/provider: `src/context/NotificationContext.tsx`
- Hook: `src/hooks/useNotifications.ts`
- Config de canais/categorias (Android/iOS): `src/config/notifications.ts` (referenciado em `docs/PUSH_NOTIFICATIONS.md`)
- Edge Function de envio: `supabase/functions/send-push/index.ts`
- Tabelas:
  - `user_push_tokens`: `supabase/migrations/20250611000001_create_user_push_tokens_table.sql`
  - `notification_logs`: `supabase/migrations/20250611000002_create_notification_logs_table.sql`

**Fluxo (push)**

1. App registra token Expo e salva em `user_push_tokens`.
2. Frontend invoca a edge function `send-push` (via `supabase.functions.invoke`).
3. Edge function valida `Authorization`, busca tokens do(s) usuário(s) alvo(s) e envia para a API do Expo.

**Pontos de falha comuns**

- Push token não gera em emulador/simulador (ver `docs/PUSH_NOTIFICATIONS.md`).
- Edge function exige header `authorization` (ver `supabase/functions/send-push/index.ts`).

### 4.8 Privacidade

**Objetivo**: centralizar preferências de privacidade e controlar recursos sensíveis (como modo disfarçado).

**Implementado em**

- Telas: `app/privacy.tsx`, `app/personal-data.tsx` (presentes no tree do workspace)
- Hook: `src/hooks/usePrivacySettings.ts`
- Roteamento baseado em privacidade: `app/_layout.tsx` (usa `privacySettings.disguisedMode`)

### 4.9 Modo Disfarçado

**Objetivo**: fornecer uma interface alternativa (aparência “receitas”/conteúdo neutro) e permitir acesso controlado ao modo real, reduzindo riscos em situações de coerção.

**Implementado em**

- Tela: `app/disguised-mode.tsx`
- Provider/context (estado global): `src/context/DisguisedModeContext.tsx`
- Persistência e login silencioso: `lib/utils/disguised-mode-auth` (referenciado pela tela)

**Pontos notáveis observados**

- Uso de `expo-secure-store` para tokens/credenciais do modo disfarçado.
- Estratégia de “login silencioso” com restauração de sessão ou credenciais.

### 4.10 Temas / UI System

**Objetivo**: permitir temas claro/escuro/auto e paleta consistente.

**Implementado em**

- Tema e integração com Paper + React Navigation: `app/_layout.tsx` (`PaperProvider`, `adaptNavigationTheme`, `useTheme()`)
- Contexto de tema: `src/context/ThemeContext.tsx`
- Cores: `lib/ui/styles/luvabranca-colors` (usado em `app/(tabs)/_layout.tsx`)

### 4.11 Banco local, sincronização e Edge Functions

**Objetivo**: permitir uso com dados no dispositivo (WatermelonDB), enfileirar alterações e sincronizar com o servidor Supabase quando houver rede — sem backend externo.

**Componentes principais**

- **Schema local**: `src/database/schema.ts` — tabelas `profiles`, `guardians`, `safety_diary_entries`, `audio_recordings`, `documents`, `emergency_alerts`, `sync_queue`.
- **Provider**: `src/providers/DatabaseProvider.tsx` — após login, registra observadores (`src/stores/observers/*`), monitora `NetInfo`, inicia listener de rede do `SyncService` e executa **pull** inicial (`SyncService.pullFromServer`) com carimbo em `SecureStore` (`offline_last_sync_at`).
- **SyncService**: `src/services/SyncService.ts` — pull via `GET /sync-pull?since=<ms>`, push via módulos de sync que chamam `POST /sync-push`; mutex e backoff por tentativa.
- **ApiClient**: `src/services/ApiClient.ts` — axios com `baseURL` derivada de `EXPO_PUBLIC_SUPABASE_URL/functions/v1`; anexa `Authorization: Bearer` com access token do Supabase e tenta refresh em 401.
- **Stores (Zustand)**: `src/stores/` — `useGuardiansStore`, `useDiaryStore`, `useProfileStore`, `useMediaStore`, `useSyncStore`, `useEmergencyAlertsStore`.

**Edge Functions de sync**:

| Função      | Método | Rota                    | Função                                            |
| ----------- | ------ | ----------------------- | ------------------------------------------------- |
| `sync-pull` | GET    | `/sync-pull?since=<ms>` | Retorna dados do usuário modificados após `since` |
| `sync-push` | POST   | `/sync-push`            | Roteia writes por `entityType + operation`        |

**Variáveis de ambiente**: apenas `EXPO_PUBLIC_SUPABASE_URL` é obrigatório. `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL` é opcional para sobrescrever.

**Pontos de falha comuns**

- Edge Function não deployada: pull/sync falham com 404 — rode `supabase functions deploy`.
- Sem token Supabase válido: `ApiClient` não envia `Authorization` e todas as Edge Functions retornam 401.

---

## 5) Supabase (Backend)

### 5.1 Uso do Supabase no app

**Cliente**: `lib/supabase.ts`

- Lê URL e anon key de `Constants.expoConfig.extra` ou `process.env.*`.
- Configura `auth.storage` com adapter mobile/web.
- Mantém `persistSession` e `autoRefreshToken`.

### 5.2 Tabelas

Tabelas identificadas diretamente no código/migrações:

- `profiles` (perfil do usuário) — `supabase/migrations/0001_core_tables.sql`
- `guardians` — `supabase/migrations/0001_core_tables.sql`
- `safety_diary_entries` — `supabase/migrations/0001_core_tables.sql`
- `audio_recordings` — `supabase/migrations/0001_core_tables.sql`
- `documents` — `supabase/migrations/0001_core_tables.sql`
- `emergency_alerts` — `supabase/migrations/0001_core_tables.sql`
- `user_push_tokens` — `supabase/migrations/0001_core_tables.sql`
- `notification_logs` — `supabase/migrations/0001_core_tables.sql`
- `safety_diary_entries`
  - Migração: `supabase/migrations/20250611_create_safety_diary_entries.sql`
- `user_push_tokens`
  - Migração: `supabase/migrations/20250611000001_create_user_push_tokens_table.sql`
- `notification_logs`
  - Migração: `supabase/migrations/20250611000002_create_notification_logs_table.sql`

> Observação: o arquivo `lib/supabase.ts` tipa explicitamente `profiles`, `guardians` e `safety_diary_entries`, mas **não tipa** `user_push_tokens`/`notification_logs` (apesar de existirem migrações).

### 5.3 Storage buckets e RLS

Buckets identificados nas migrações:

| Bucket         |    Tipo | Objetivo                       | Migração                                                      |
| -------------- | ------: | ------------------------------ | ------------------------------------------------------------- |
| `documentos`   | privado | documentos pessoais do usuário | `supabase/migrations/20250606_create_documents_bucket.sql`    |
| `audios`       | privado | gravações de áudio do usuário  | `supabase/migrations/20250110_create_audios_bucket.sql`       |
| `diary-photos` | privado | fotos anexadas ao diário       | `supabase/migrations/20250610_create_diary_photos_bucket.sql` |

**Padrão de path por usuário**

- Documentos usam `${auth.uid()}/...` e RLS valida foldername.
  - RLS: `auth.uid()::text = (storage.foldername(name))[1]` em `20250606_create_documents_bucket.sql`
- Áudios usam split por `/` do nome para checar a pasta: `(string_to_array(name, '/'))[1]`.
  - RLS em `20250110_create_audios_bucket.sql`

### 5.4 Estratégia de signed URLs

O app usa `createSignedUrl(path, expiresInSeconds)` para acessar buckets privados.

Exemplos:

- Documentos: `src/hooks/useDocumentUpload.ts` cria signed URL (1h).
- Áudios: `src/hooks/useAudioRecording.ts` cria signed URL (24h).
- Fotos do diário: `src/hooks/useSafetyDiary.ts` cria signed URL (1 semana).

**Implicações**

- Links expiram; UI precisa lidar com refresh/recriar URL.
- Evita expor bucket como público.

### 5.5 Edge Functions (useEdgeFunctions)

Hook genérico:

- `src/hooks/useEdgeFunctions.ts` expõe `invokeFunction(functionName, body, options)` e wrappers:
  - `send-welcome`, `validate-data`, `process-payment`, `send-notification`, `generate-report`, `whatsapp-send`, `backup-user-data`, `ai-analysis`, `cleanup-data`, `setup-user-preferences`.

**Edge Functions realmente presentes no repo** (pasta `supabase/functions/`):

- `send-push/` (implementada): `supabase/functions/send-push/index.ts`
- `send-notification/` (pasta existe; conteúdo não foi analisado aqui)

> **Ponto a confirmar**: `useEdgeFunctions.ts` lista várias funções, mas apenas algumas podem existir/deployadas.

---

## 6) Notificações

Baseado em `docs/PUSH_NOTIFICATIONS.md` + `supabase/functions/send-push/index.ts`.

### 6.1 Tipos suportados

De acordo com `docs/PUSH_NOTIFICATIONS.md`:

- `security_alert`
- `emergency`
- `reminder`
- `system_update`
- `message`
- `general`

### 6.2 Canais/categorias

- Android channels: `src/config/notifications.ts` (referência em `docs/PUSH_NOTIFICATIONS.md`)
- iOS categories: `src/config/notifications.ts` (referência em `docs/PUSH_NOTIFICATIONS.md`)

### 6.3 Registro e envio (alto nível)

- Registro: feito no frontend via hook/context (ver `docs/PUSH_NOTIFICATIONS.md`).
- Persistência no backend: tabela `user_push_tokens`.
- Envio: edge function `send-push` chama Expo Push API.

---

## 7) Segurança e Privacidade

### 7.1 Dados sensíveis e superfícies de risco

O app lida com:

- Identidade do usuário e dados pessoais (perfil)
- Rede de contatos (guardiões)
- Localização em contextos de emergência
- Documentos e gravações de áudio

### 7.2 Mitigações implementadas

- **Storage privado** + **RLS** nos buckets (`documentos`, `audios`, `diary-photos`) garantindo acesso por pasta do usuário:
  - `supabase/migrations/20250606_create_documents_bucket.sql`
  - `supabase/migrations/20250110_create_audios_bucket.sql`
  - `supabase/migrations/20250610_create_diary_photos_bucket.sql`
- **Signed URLs** para acesso temporário a arquivos, evitando bucket público:
  - `src/hooks/useDocumentUpload.ts`
  - `src/hooks/useAudioRecording.ts`
  - `src/hooks/useSafetyDiary.ts`
- **SecureStore** para dados localmente persistidos no device:
  - Sessão/credenciais relacionadas a modo disfarçado: `app/disguised-mode.tsx`, `lib/utils/disguised-mode-auth`
  - Persistência de settings: `app/_layout.tsx`

### 7.3 Considerações para abuso/ameaça

- **Modo disfarçado** reduz exposição visual do app.
- **Permissões**: o app pede permissões sensíveis (microfone, localização, SMS). Isso exige:
  - explicações claras ao usuário
  - fallback e UX quando negadas

### 7.4 Recomendações (hardening)

1. Revisar logs sensíveis em produção (há muitos `console.log`/`console.error` em telas críticas como `app/(tabs)/index.tsx`).
2. Documentar claramente a política de retenção de áudios/documentos (prazo, exclusão).
3. Garantir que edge functions estejam com validação de payload e rate limiting (quando aplicável).
4. Revisar `eas.json` para evitar quaisquer segredos além de chaves públicas.

---

## 8) Padrões de código e contribuição

### 8.1 Convenções

- TypeScript em todo o app (`tsconfig.json`, `package.json`).
- Hooks para encapsular integrações (Supabase, upload, notificações, permissões) em `src/hooks/*`.
- Contexts para estado global (auth, tema, notificações, modo disfarçado) em `src/context/*`.
- Estado derivado de dados locais e sync: **Zustand** em `src/stores/*`, observadores ligados ao **WatermelonDB** em `src/stores/observers/*`.
- Dados persistentes no aparelho: models em `src/database/models/*`, migrations em `src/database/migrations/`.

### 8.2 Como adicionar novas telas

- Para telas roteadas pelo Expo Router, crie arquivo em `app/`.
- Para telas dentro das tabs, criar em `app/(tabs)/...`.
- Para telas de auth, criar em `app/(auth)/...`.
- Fluxo do **diário de segurança**: `app/diary/` (stack própria registrada em `app/_layout.tsx`).

### 8.3 Boas práticas para features sensíveis

- Evitar armazenar dados sensíveis em storage não seguro.
- Preferir storage privado (Supabase Storage privado + signed URL).
- Evitar logs com localização/telefones em builds de produção.

---

## 9) Troubleshooting

Baseado no `README.md` e no funcionamento observado.

### 9.1 Metro não inicia

Fonte: `README.md`

```bash
npx expo start --clear
```

### 9.2 iOS pods

Fonte: `README.md`

```bash
cd ios
pod install
cd ..
```

### 9.3 Push token não gera / push não chega

Fonte: `docs/PUSH_NOTIFICATIONS.md`

- Testar em dispositivo físico.
- Verificar permissões.
- Conferir se `user_push_tokens` está populada.
- Conferir se a função `send-push` foi deployada e se recebe `authorization`.

### 9.4 Erro do Supabase (env)

Se `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_KEY` não estiverem configuradas, o app falha ao iniciar.

Fonte: `lib/supabase.ts`

### 9.5 Sincronização / Edge Functions

- Faça o deploy das funções antes de testar sync: `supabase functions deploy sync-pull sync-push send-notification send-push`
- Sem deploy ou com token ausente: pull inicial falha com 404/401 (veja logs `[DatabaseProvider] Pull failed`); a fila local acumula itens e tentará de novo quando houver rede.
- Confirme que as migrations `0001–0004` foram aplicadas: `supabase db push` ou via painel Supabase.

---

## 10) Roadmap / Próximos passos

- **Push** (`docs/PUSH_NOTIFICATIONS.md`): tracking de delivery, agendamento, templates, dashboard e estatísticas.
- **README.md** — _Roadmap v2.0_ (resumo): login social (Google/Apple), backup em nuvem, modo offline avançado, análise de segurança em tempo real, relatórios, idiomas adicionais; melhorias técnicas (performance, testes automatizados).

> **Nota**: o projeto incorpora **banco local** (WatermelonDB) e **sync via Edge Functions** (`sync-pull`/`sync-push`). O item "modo offline avançado" do README pode evoluir em cima dessa base (resolução de conflitos, UX offline completa, etc.).

---

## Assunções / Pontos a Confirmar

1. **Deploy das Edge Functions**: executar `supabase functions deploy sync-pull sync-push send-push send-notification` antes do primeiro uso em produção.
2. **Migrations**: as 4 migrations (`0001-0004`) substituem os 12 arquivos anteriores — usar `supabase db reset` (dev) ou migração de delta (prod).
3. **`SUPABASE_SERVICE_ROLE_KEY`**: a edge function `send-notification` exige a service role key como secret (`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`).
4. **Fluxo de verificação/OTP**: o contexto de auth tem métodos `verifyOtp`, `resendOtp`, etc. Confirmar implementação/uso nas telas `app/(auth)/*`.
5. **Limite de guardiões e diário**: validação no banco (`validate_guardians_limit`, `validate_diary_entries_limit`) e na UI — ambos aplicados.

---

## Apêndice: Arquivos-chave

- App entry/layout: `app/_layout.tsx`
- Tabs e navegação: `app/(tabs)/_layout.tsx`
- SOS: `app/(tabs)/index.tsx`
- Guardiões: `app/(tabs)/guardioes.tsx`
- Diário: `app/diary/index.tsx` e rotas em `app/diary/`
- Modo disfarçado: `app/disguised-mode.tsx`
- Supabase client: `lib/supabase.ts`
- Auth context: `src/context/SupabaseAuthContext.tsx`
- Banco local e sync: `src/providers/DatabaseProvider.tsx`, `src/services/SyncService.ts`, `src/services/ApiClient.ts`, `src/database/schema.ts`
- Notificações: `docs/PUSH_NOTIFICATIONS.md`, `supabase/functions/send-push/index.ts`
- Buckets/policies: `supabase/migrations/20250606_create_documents_bucket.sql`, `supabase/migrations/20250110_create_audios_bucket.sql`
