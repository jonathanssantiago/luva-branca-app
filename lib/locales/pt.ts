/**
 * Portuguese Translations
 */

const Portuguese = {
  login: 'Entrar',
  signup: 'Cadastrar-se',
  profile: 'Perfil',
  options: 'Opções',
  search: 'Pesquisar',
  stackNav: 'Navegação Stack',
  drawerNav: 'Navegação Drawer',
  appearance: 'Aparência',
  language: 'Idioma',
  changeLanguage: 'Alterar idioma do aplicativo',
  system: 'Sistema',
  mode: 'Modo',
  changeMode: 'Alternar entre modo claro e escuro',
  lightMode: 'Claro',
  darkMode: 'Escuro',
  color: 'Cor',
  changeColor: 'Alterar cor do tema',
  changeScreenCode:
    'Altere qualquer texto, salve o arquivo e seu aplicativo será atualizado automaticamente',
  goHome: 'Ir para tela inicial',
  openScreenCode: 'Abrir código desta tela',
  save: 'Salvar',
  screen404: 'Página não encontrada',
  titleHome: 'SOS - Emergência',
  titleModal: 'Modal',
  titleNotFound: 'Não Encontrado',
  titleSettings: 'Configurações',
  restartApp: 'Reinicie o aplicativo para aplicar as alterações',
  notAvailable: 'Expo SecureStore não está disponível para web',
  adaptive: 'adaptativo',
  default: 'padrão',
  orange: 'laranja',
  red: 'vermelho',
  violet: 'violeta',
  indigo: 'índigo',
  blue: 'azul',
  teal: 'verde-azulado',
  cyan: 'ciano',
  green: 'verde',
  lime: 'lima',
  olive: 'oliva',
  brown: 'marrom',

  // SOS
  sos: {
    botaoAcessibilidade: 'Botão de emergência SOS',
    instrucao: 'Toque para alertar seus guardiões',
    msgGuardioes: '🚨 EMERGÊNCIA! Preciso de ajuda urgente!',
    msgPolicia: '🚨 EMERGÊNCIA! Necessito socorro policial imediato!',
    localizacao: 'Localização',
    snackbarGuardioes: 'Alerta enviado para seus guardiões!',
    snackbarPolicia: 'Chamada de emergência enviada!',
  },

  // Guardiões
  guardioes: {
    titulo: 'Meus Guardiões',
    nome: 'Nome',
    telefone: 'Telefone',
    adicionar: 'Adicionar',
    preencha: 'Preencha todos os campos',
    limite: 'Máximo de 5 guardiões permitidos',
    adicionado: 'Guardião adicionado com sucesso!',
    removido: 'Guardião removido com sucesso!',
    nenhum: 'Nenhum guardião cadastrado',
  },

  // Documentos
  documentos: {
    titulo: 'Meus Documentos',
    adicionar: 'Adicionar Documento',
    adicionado: 'Documento adicionado com sucesso!',
    nenhum: 'Nenhum documento cadastrado',
  },

  // Arquivo de áudio
  arquivo: {
    titulo: 'Gravações de Emergência',
    iniciar: 'Iniciar Gravação',
    parar: 'Parar Gravação',
    permissaoNegada: 'Permissão de microfone negada',
    erroIniciar: 'Erro ao iniciar gravação',
    salva: 'Gravação salva com sucesso!',
    nenhuma: 'Nenhuma gravação disponível',
  },

  // Rede de Apoio
  apoio: {
    titulo: 'Rede de Apoio',
    atualizar: 'Atualizar Locais',
    permissaoNegada: 'Permissão de localização negada',
    erroBuscar: 'Erro ao buscar locais de apoio',
    nenhum: 'Nenhum local de apoio encontrado',
  },

  // Orientações
  orientacao: {
    titulo: 'Orientações e Ajuda',
    buscar: 'Buscar orientações...',
    nenhuma: 'Nenhuma orientação encontrada',
    perguntaMedidaProtetiva: 'Como solicitar uma medida protetiva?',
    respostaMedidaProtetiva:
      'Procure uma Delegacia da Mulher ou um órgão do Ministério Público. Leve documentos pessoais e relate a situação de violência.',
    perguntaAcionarPolicia: 'Quando devo acionar a polícia?',
    respostaAcionarPolicia:
      'Em situações de perigo iminente, violência física ou ameaças diretas. Ligue 190 ou use o botão SOS do aplicativo.',
    perguntaDireitos: 'Quais são meus direitos?',
    respostaDireitos:
      'Toda mulher tem direito à vida sem violência, proteção policial, medidas protetivas, assistência judiciária gratuita e acolhimento em casas-abrigo.',
  },

  forgotPassword: {
    title: 'Recuperar Senha',
    subtitlePhone: 'Informe seu telefone para receber o código por SMS',
    subtitleOtp: 'Digite o código de 4 dígitos enviado por SMS',
    subtitleNewPassword: 'Defina sua nova senha de acesso',
    subtitleEmail: 'Informe seu e-mail para receber o link de redefinição',
    phoneLabel: 'Telefone',
    otpLabel: 'Código de verificação',
    newPasswordLabel: 'Nova senha',
    confirmPasswordLabel: 'Confirmar senha',
    sendCode: 'Enviar código',
    sendResetLink: 'Enviar link de redefinição',
    verifyCode: 'Verificar código',
    resetPassword: 'Redefinir senha',
    resendCode: 'Reenviar código',
    resendIn: 'Reenviar em %{seconds}s',
    back: 'Voltar',
    sending: 'Enviando...',
    verifying: 'Verificando...',
    resetting: 'Redefinindo...',
    successTitle: 'Senha redefinida!',
    successMessage:
      'Sua senha foi atualizada com sucesso. Faça login para continuar.',
    emailSentTitle: 'E-mail enviado!',
    emailSentMessage:
      'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
    backToLogin: 'Voltar para o login',
    passwordsMustMatch: 'As senhas devem ser iguais',
    otpAttemptsExceeded:
      'Muitas tentativas inválidas. Solicite um novo código.',
  },
}

export default Portuguese
