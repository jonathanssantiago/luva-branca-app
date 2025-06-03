# Exemplo de Integração do Login Silencioso

Este documento mostra como integrar as funções de login silencioso implementadas no modo disfarçado com o resto do aplicativo Luva Branca.

## 1. Integração na Tela de Login

Na tela de login (`/app/(auth)/login.tsx`), após um login bem-sucedido, você deve salvar as credenciais:

```tsx
// No arquivo login.tsx, após o login bem-sucedido
import * as SecureStore from 'expo-secure-store'

const onSubmit = async (values: { email: string; password: string }) => {
  setLoading(true)
  setLoginError(null)
  setCurrentEmail(values.email)

  try {
    const { error } = await signIn(values.email, values.password)

    if (!error) {
      // NOVO: Salvar credenciais para login silencioso
      await saveLoginCredentialsForDisguisedMode(values.email, values.password)

      // Redirecionar para o app
      router.replace('/(tabs)')
    } else {
      setLoginError(error)
    }
  } catch (err) {
    console.error('Erro no login:', err)
  } finally {
    setLoading(false)
  }
}

// Função auxiliar para salvar credenciais
const saveLoginCredentialsForDisguisedMode = async (
  email: string,
  password: string,
) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const now = new Date().getTime()
      const STORAGE_KEYS = {
        LAST_LOGIN: 'luva_branca_last_login',
        USER_EMAIL: 'luva_branca_user_email',
        USER_PASSWORD: 'luva_branca_user_password',
        SESSION_TOKEN: 'luva_branca_session_token',
        REFRESH_TOKEN: 'luva_branca_refresh_token',
      }

      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.USER_EMAIL, email),
        SecureStore.setItemAsync(STORAGE_KEYS.USER_PASSWORD, password),
        SecureStore.setItemAsync(
          STORAGE_KEYS.SESSION_TOKEN,
          session.access_token,
        ),
        SecureStore.setItemAsync(
          STORAGE_KEYS.REFRESH_TOKEN,
          session.refresh_token,
        ),
        SecureStore.setItemAsync(STORAGE_KEYS.LAST_LOGIN, now.toString()),
      ])

      console.log('Credenciais salvas para modo disfarçado')
    }
  } catch (error) {
    console.error('Erro ao salvar credenciais:', error)
  }
}
```

## 2. Integração no Contexto de Autenticação

No contexto de autenticação (`/src/context/SupabaseAuthContext.tsx`), na função de logout:

```tsx
const signOut = async () => {
  try {
    await supabase.auth.signOut()
    await ExpoSecureStoreAdapter.removeItem('supabase.auth.token')
    setUserProfile(null)

    // NOVO: Limpar credenciais do modo disfarçado
    await clearDisguisedModeCredentials()
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

// Função auxiliar para limpar credenciais
const clearDisguisedModeCredentials = async () => {
  try {
    const STORAGE_KEYS = {
      LAST_LOGIN: 'luva_branca_last_login',
      USER_EMAIL: 'luva_branca_user_email',
      USER_PASSWORD: 'luva_branca_user_password',
      SESSION_TOKEN: 'luva_branca_session_token',
      REFRESH_TOKEN: 'luva_branca_refresh_token',
    }

    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER_EMAIL),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER_PASSWORD),
      SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.LAST_LOGIN),
    ])

    console.log('Credenciais do modo disfarçado limpas')
  } catch (error) {
    console.error('Erro ao limpar credenciais:', error)
  }
}
```

## 3. Fluxo Completo de Funcionamento

### Primeira vez usando o app:

1. Usuária faz login manual pela primeira vez
2. Credenciais são salvas automaticamente no SecureStore
3. `lastLogin` é registrado

### Usando o modo disfarçado posteriormente:

1. Usuária ativa o gesto secreto (5 taps no título)
2. `handleSecretActivation()` é chamada
3. `silentLoginIfNeeded()` verifica o `lastLogin`:
   - **Se < 24h**: Acesso direto sem reautenticação
   - **Se > 24h**: Tentativa de restaurar sessão do Supabase
   - **Se falhou**: Login automático com credenciais salvas
4. Feedback visual com spinner e mensagens informativas
5. Redirecionamento para o app principal ou erro

### Cenários de erro:

- **Credenciais inválidas**: Permanece no modo disfarçado
- **Sem internet**: Erro de conexão, permanece no modo disfarçado
- **Credenciais não encontradas**: Solicita login manual primeiro

## 4. Segurança e Considerações

### ⚠️ Importante para Produção:

- **Criptografia**: As senhas estão sendo salvas em texto plano no SecureStore. Para produção, considere:
  - Usar apenas refresh tokens
  - Criptografar senhas antes de armazenar
  - Implementar rotação de tokens

### ✅ Medidas de Segurança Implementadas:

- **Timeout de 3 segundos**: Login silencioso tem limite máximo
- **Janela de 24h**: Evita reautenticações desnecessárias
- **SecureStore**: Dados protegidos por hardware (quando disponível)
- **Fallback gracioso**: Em caso de erro, não compromete o disfarce

## 5. Testando o Sistema

### Teste Manual:

1. Faça login normalmente no app
2. Feche o app e reabra no modo disfarçado
3. Execute o gesto secreto (5 taps rápidos no título)
4. Verifique se o login automático funciona

### Teste de Casos Extremos:

1. **Sem credenciais**: Desinstale e reinstale o app, tente o gesto secreto
2. **Credenciais expiradas**: Altere a senha no Supabase, teste o gesto
3. **Sem internet**: Desconecte da rede, teste o gesto

### Logs para Debug:

```tsx
// Adicionar logs nas funções para facilitar debug
console.log('Login silencioso iniciado')
console.log('Último login:', new Date(parseInt(lastLoginStr)))
console.log('Diferença de tempo:', timeDiff / (1000 * 60 * 60), 'horas')
```

## 6. Próximos Passos

Para uma implementação mais robusta em produção:

1. **Implementar rotação de tokens** em vez de salvar senhas
2. **Adicionar logs de auditoria** para rastrear acessos
3. **Implementar rate limiting** para tentativas de login silencioso
4. **Adicionar biometria** como fator adicional de autenticação
5. **Criar dashboard** para monitorar uso do modo disfarçado

---

## 📝 Resumo da Implementação

✅ **Login silencioso funcional** com verificação de `lastLogin`  
✅ **Persistência segura** de credenciais via SecureStore  
✅ **Feedback visual** com spinner e mensagens informativas  
✅ **Timeout de segurança** máximo de 3 segundos  
✅ **Fallback gracioso** em caso de erro  
✅ **Integração transparente** com o modo disfarçado

O sistema está pronto para uso e pode ser facilmente integrado ao resto do aplicativo seguindo os exemplos acima.
