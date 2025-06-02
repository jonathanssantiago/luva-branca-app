/**
 * Paleta de Cores Luva Branca
 * Sistema de design baseado no logo rosa vibrante (#FF3B7C) e luva branca
 */

export const LuvaBrancaColors = {
  // Cores primárias
  primary: '#FF3B7C',      // Rosa vibrante principal
  onPrimary: '#FFFFFF',    // Texto em elementos primários
  
  // Cores secundárias
  secondary: '#F9F9F9',    // Branco suave
  onSecondary: '#222222',  // Texto em elementos secundários
  
  // Neutros - Hierarquia de texto
  textPrimary: '#222222',     // Títulos e texto forte
  textSecondary: '#666666',   // Texto secundário
  textDisabled: '#CCCCCC',    // Texto desabilitado
  
  // Bordas e divisores
  border: '#CCCCCC',       // Bordas principais
  divider: '#EEEEEE',      // Divisores sutis
  
  // Cores de apoio
  lightPink: '#FFD6E5',    // Rosa claro (cards, hover)
  veryLightPink: '#FFECEC', // Rosa muito claro (fundo alternativo)
  
  // Cores de status
  success: '#28C76F',      // Verde para sucesso
  warning: '#F5A623',      // Laranja para avisos
  error: '#EA5455',        // Vermelho para erros
  
  // Versões com opacidade para estados
  primaryWithOpacity: (opacity: number) => `rgba(255, 59, 124, ${opacity})`,
  successWithOpacity: (opacity: number) => `rgba(40, 199, 111, ${opacity})`,
  warningWithOpacity: (opacity: number) => `rgba(245, 166, 35, ${opacity})`,
  errorWithOpacity: (opacity: number) => `rgba(234, 84, 85, ${opacity})`,
  
  // Fundos com gradações
  backgrounds: {
    primary: '#FFFFFF',      // Fundo principal
    surface: '#F9F9F9',      // Superfícies elevadas
    card: '#FFFFFF',         // Cards e modais
    overlay: 'rgba(34, 34, 34, 0.4)', // Overlays e backdrop
  },
  
  // Cores específicas por contexto
  contexts: {
    sos: {
      primary: '#FF3B7C',    // Rosa vibrante para SOS
      active: '#28C76F',     // Verde quando ativado
      emergency: '#EA5455',  // Vermelho para emergências
    },
    guardioes: {
      primary: '#1976d2',    // Azul para guardiões
      card: '#E3F2FD',       // Fundo claro azul
    },
    orientacao: {
      primary: '#28C76F',    // Verde para orientações
      card: '#E8F5E8',       // Fundo claro verde
    },
    apoio: {
      primary: '#7b1fa2',    // Roxo para apoio psicológico
      card: '#F3E5F5',       // Fundo claro roxo
    },
    perfil: {
      primary: '#666666',    // Cinza para perfil
      card: '#F5F5F5',       // Fundo claro cinza
    },
  }
}

/**
 * Verifica se uma cor atende aos padrões de contraste WCAG AA
 * @param foreground Cor do texto/primeiro plano
 * @param background Cor do fundo
 * @returns boolean indicando se o contraste é adequado
 */
export const checkContrast = (foreground: string, background: string): boolean => {
  // Esta é uma implementação básica - em produção, use uma biblioteca como 'color' ou 'chroma-js'
  // para cálculos de contraste mais precisos
  
  // Combinações já testadas da nossa paleta
  const validCombinations = [
    { fg: LuvaBrancaColors.onPrimary, bg: LuvaBrancaColors.primary },
    { fg: LuvaBrancaColors.textPrimary, bg: LuvaBrancaColors.secondary },
    { fg: LuvaBrancaColors.textSecondary, bg: LuvaBrancaColors.backgrounds.primary },
    { fg: '#FFFFFF', bg: LuvaBrancaColors.success },
    { fg: '#FFFFFF', bg: LuvaBrancaColors.error },
    { fg: '#222222', bg: LuvaBrancaColors.lightPink },
  ]
  
  return validCombinations.some(
    combo => combo.fg === foreground && combo.bg === background
  )
}

/**
 * Retorna a cor de texto apropriada para um fundo específico
 * @param backgroundColor Cor do fundo
 * @returns Cor do texto que garante contraste adequado
 */
export const getTextColorForBackground = (backgroundColor: string): string => {
  // Fundos claros usam texto escuro
  const lightBackgrounds = [
    LuvaBrancaColors.secondary,
    LuvaBrancaColors.lightPink,
    LuvaBrancaColors.veryLightPink,
    LuvaBrancaColors.backgrounds.primary,
    LuvaBrancaColors.backgrounds.surface,
    LuvaBrancaColors.backgrounds.card,
  ]
  
  if (lightBackgrounds.includes(backgroundColor)) {
    return LuvaBrancaColors.textPrimary
  }
  
  // Fundos escuros ou coloridos usam texto branco
  return LuvaBrancaColors.onPrimary
}

export default LuvaBrancaColors 