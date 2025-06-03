/**
 * Utilitário para traduzir e mapear erros de autenticação do Supabase
 * para mensagens amigáveis em português brasileiro
 */

export interface AuthErrorMapping {
  code: string
  title: string
  message: string
  action?: string
}

export const AUTH_ERROR_MAPPINGS: Record<string, AuthErrorMapping> = {
  // Erros de credenciais inválidas
  'Invalid login credentials': {
    code: 'invalid_credentials',
    title: 'Credenciais inválidas',
    message:
      'E-mail ou senha incorretos. Verifique seus dados e tente novamente.',
    action: 'Esqueceu sua senha?',
  },

  'Invalid email or password': {
    code: 'invalid_email_password',
    title: 'E-mail ou senha inválidos',
    message:
      'Os dados informados não conferem. Verifique se o e-mail e senha estão corretos.',
    action: 'Recuperar senha',
  },

  // Erros de e-mail não confirmado
  'Email not confirmed': {
    code: 'email_not_confirmed',
    title: 'E-mail não verificado',
    message:
      'Você precisa confirmar seu e-mail antes de fazer login. Verifique sua caixa de entrada.',
    action: 'Reenviar e-mail',
  },

  'Email link is invalid or has expired': {
    code: 'email_link_expired',
    title: 'Link expirado',
    message:
      'O link de verificação expirou ou é inválido. Solicite um novo e-mail de confirmação.',
    action: 'Reenviar e-mail',
  },

  // Erros de conta
  'User not found': {
    code: 'user_not_found',
    title: 'Usuário não encontrado',
    message:
      'Não encontramos uma conta com este e-mail. Verifique o endereço ou crie uma nova conta.',
    action: 'Criar conta',
  },

  'User already registered': {
    code: 'user_exists',
    title: 'E-mail já cadastrado',
    message:
      'Este e-mail já está em uso. Faça login ou use outro endereço de e-mail.',
    action: 'Fazer login',
  },

  'To signup, please provide your email': {
    code: 'email_required',
    title: 'E-mail obrigatório',
    message: 'Por favor, informe um endereço de e-mail válido para continuar.',
  },

  // Erros de senha
  'Password should be at least 6 characters': {
    code: 'password_too_short',
    title: 'Senha muito curta',
    message: 'A senha deve ter pelo menos 6 caracteres.',
  },

  // Erros de rate limiting
  'Too many requests': {
    code: 'rate_limit',
    title: 'Muitas tentativas',
    message:
      'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
  },

  'Email rate limit exceeded': {
    code: 'email_rate_limit',
    title: 'Limite de e-mails excedido',
    message:
      'Você excedeu o limite de envio de e-mails. Tente novamente em alguns minutos.',
  },

  // Erros de rede
  'Network error': {
    code: 'network_error',
    title: 'Erro de conexão',
    message: 'Verifique sua conexão com a internet e tente novamente.',
  },

  'Failed to fetch': {
    code: 'fetch_error',
    title: 'Erro de comunicação',
    message: 'Não foi possível conectar com o servidor. Verifique sua conexão.',
  },

  // Erro genérico
  'Unknown error': {
    code: 'unknown_error',
    title: 'Erro inesperado',
    message: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
  },
}

/**
 * Traduz e mapeia erros do Supabase para mensagens amigáveis
 * @param error - Erro retornado pelo Supabase
 * @returns Objeto com informações do erro traduzido
 */
export function translateAuthError(error: any): AuthErrorMapping {
  if (!error) {
    return AUTH_ERROR_MAPPINGS['Unknown error']
  }

  const errorMessage =
    error.message || error.error_description || error.error || ''

  // Procura por uma correspondência exata primeiro
  const exactMatch = AUTH_ERROR_MAPPINGS[errorMessage]
  if (exactMatch) {
    return exactMatch
  }

  // Procura por correspondências parciais para mensagens específicas
  for (const [key, mapping] of Object.entries(AUTH_ERROR_MAPPINGS)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return mapping
    }
  }

  // Tratamento especial para erros específicos comuns
  if (
    errorMessage.includes('invalid_grant') ||
    errorMessage.includes('invalid_credentials')
  ) {
    return AUTH_ERROR_MAPPINGS['Invalid login credentials']
  }

  if (errorMessage.includes('email') && errorMessage.includes('confirm')) {
    return AUTH_ERROR_MAPPINGS['Email not confirmed']
  }

  if (errorMessage.includes('already') && errorMessage.includes('registered')) {
    return AUTH_ERROR_MAPPINGS['User already registered']
  }

  if (errorMessage.includes('rate') && errorMessage.includes('limit')) {
    return AUTH_ERROR_MAPPINGS['Too many requests']
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return AUTH_ERROR_MAPPINGS['Network error']
  }

  // Retorna erro genérico se não encontrar correspondência
  return {
    code: 'unknown_error',
    title: 'Erro de autenticação',
    message:
      errorMessage ||
      'Ocorreu um erro durante a autenticação. Tente novamente.',
  }
}

/**
 * Verifica se um erro é recuperável (pode tentar novamente)
 * @param errorCode - Código do erro
 * @returns true se o erro é recuperável
 */
export function isRecoverableError(errorCode: string): boolean {
  const nonRecoverableErrors = [
    'email_not_confirmed',
    'user_exists',
    'password_too_short',
    'email_required',
  ]

  return !nonRecoverableErrors.includes(errorCode)
}

/**
 * Obtém sugestões de ação baseadas no tipo de erro
 * @param errorCode - Código do erro
 * @returns Array de ações sugeridas
 */
export function getErrorActions(errorCode: string): string[] {
  const actions: Record<string, string[]> = {
    invalid_credentials: ['Verificar e-mail e senha', 'Recuperar senha'],
    email_not_confirmed: ['Verificar caixa de entrada', 'Reenviar e-mail'],
    user_not_found: ['Verificar e-mail', 'Criar nova conta'],
    user_exists: ['Fazer login', 'Recuperar senha'],
    rate_limit: ['Aguardar alguns minutos', 'Verificar conexão'],
    network_error: ['Verificar conexão', 'Tentar novamente'],
  }

  return actions[errorCode] || ['Tentar novamente']
}
