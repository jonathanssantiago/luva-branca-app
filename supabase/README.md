# Configuração Supabase

Este diretório contém todas as configurações necessárias para o banco de dados Supabase.

## Estrutura

```
supabase/
├── migrations/
│   └── 001_initial_setup.sql    # Schema inicial do banco
└── functions/                   # Edge Functions (Serverless)
    ├── send-welcome/
    ├── validate-sensitive-data/
    ├── process-payment/
    └── send-notification/
```

## Configuração Inicial

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Fazer login no Supabase

```bash
supabase login
```

### 3. Inicializar projeto local (opcional para desenvolvimento)

```bash
supabase init
supabase start
```

### 4. Aplicar migrações

```bash
# Para projeto remoto
supabase db push

# Para projeto local
supabase db reset
```

### 5. Deploy das Edge Functions

```bash
# Deploy todas as funções
supabase functions deploy

# Deploy função específica
supabase functions deploy send-welcome
supabase functions deploy validate-sensitive-data
supabase functions deploy process-payment
supabase functions deploy send-notification
```

## Configurações Manuais no Dashboard

### 1. Authentication

- Configurar provedores de auth desejados (Google, GitHub, etc.)
- Configurar URLs de redirecionamento
- Configurar templates de email

### 2. Storage

- Verificar se o bucket `avatars` foi criado
- Configurar políticas de CORS se necessário

### 3. Realtime

- Verificar se as tabelas estão habilitadas para realtime
- Configurar filtros se necessário

### 4. API

- Configurar rate limiting
- Configurar CORS policies

## Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role  # Apenas para edge functions
```

## Testando a Configuração

1. Execute as migrações
2. Teste o registro de usuário
3. Teste o upload de avatar
4. Teste as notificações em tempo real
5. Teste as edge functions

## Troubleshooting

- **Erro de permissão**: Verifique se as políticas RLS estão configuradas corretamente
- **Edge function não responde**: Verifique os logs com `supabase functions logs`
- **Realtime não funciona**: Verifique se a tabela está habilitada para realtime
- **Upload falha**: Verifique as políticas do storage bucket
