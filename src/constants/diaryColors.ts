/**
 * Cores específicas para o tema do Diário de Segurança
 */
export const DIARY_COLORS = {
  primary: '#7B68EE',        // Roxo suave - introspectivo e calmo
  onPrimary: '#FFFFFF',      // Branco para contraste
  secondary: '#9C88FF',      // Roxo mais claro
  background: '#F8F6FF',     // Fundo levemente roxo
  accent: '#DDA0DD',         // Plum para destaques
  surface: '#F5F3FF',        // Fundo de cards
} as const

export type DiaryColorKeys = keyof typeof DIARY_COLORS 