/**
 * Temas Luva Branca - Light e Dark Mode
 * Baseado na paleta de cores centralizada
 */

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper'
import { LuvaBrancaColors } from './luvabranca-colors'

const fonts = configureFonts({ config: { fontFamily: 'NotoSans_400Regular' } })

export const lightTheme = {
  ...MD3LightTheme,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    // Cores primárias
    primary: LuvaBrancaColors.primary,
    onPrimary: LuvaBrancaColors.onPrimary,
    primaryContainer: LuvaBrancaColors.lightPink,
    onPrimaryContainer: LuvaBrancaColors.textPrimary,
    
    // Cores secundárias
    secondary: LuvaBrancaColors.secondary,
    onSecondary: LuvaBrancaColors.onSecondary,
    secondaryContainer: LuvaBrancaColors.veryLightPink,
    onSecondaryContainer: LuvaBrancaColors.textPrimary,
    
    // Cores terciárias
    tertiary: LuvaBrancaColors.textSecondary,
    onTertiary: LuvaBrancaColors.onPrimary,
    tertiaryContainer: LuvaBrancaColors.textDisabled,
    onTertiaryContainer: LuvaBrancaColors.textPrimary,
    
    // Cores de status
    error: LuvaBrancaColors.error,
    onError: LuvaBrancaColors.onPrimary,
    errorContainer: 'rgba(234, 84, 85, 0.1)',
    onErrorContainer: LuvaBrancaColors.error,
    
    // Fundos e superfícies
    background: LuvaBrancaColors.backgrounds.primary,
    onBackground: LuvaBrancaColors.textPrimary,
    surface: LuvaBrancaColors.backgrounds.surface,
    onSurface: LuvaBrancaColors.textPrimary,
    surfaceVariant: LuvaBrancaColors.veryLightPink,
    onSurfaceVariant: LuvaBrancaColors.textSecondary,
    
    // Bordas e contornos
    outline: LuvaBrancaColors.border,
    outlineVariant: LuvaBrancaColors.divider,
    
    // Sombras e sobreposições
    shadow: '#000000',
    scrim: '#000000',
    backdrop: LuvaBrancaColors.backgrounds.overlay,
    
    // Superfícies inversas
    inverseSurface: LuvaBrancaColors.textPrimary,
    inverseOnSurface: LuvaBrancaColors.backgrounds.surface,
    inversePrimary: LuvaBrancaColors.lightPink,
    
    // Elevação
    elevation: {
      level0: 'transparent',
      level1: '#FEFEFE',
      level2: '#FDFDFD',
      level3: '#FCFCFC',
      level4: '#FBFBFB',
      level5: '#FAFAFA',
    },
    
    // Estados desabilitados
    surfaceDisabled: 'rgba(255, 59, 124, 0.12)',
    onSurfaceDisabled: 'rgba(255, 59, 124, 0.38)',
    
    // Cores personalizadas da paleta
    success: LuvaBrancaColors.success,
    onSuccess: LuvaBrancaColors.onPrimary,
    successContainer: 'rgba(40, 199, 111, 0.1)',
    onSuccessContainer: LuvaBrancaColors.success,
    
    warning: LuvaBrancaColors.warning,
    onWarning: LuvaBrancaColors.onPrimary,
    warningContainer: 'rgba(245, 166, 35, 0.1)',
    onWarningContainer: LuvaBrancaColors.warning,
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    // Cores primárias (mantém o rosa vibrante)
    primary: LuvaBrancaColors.primary,
    onPrimary: LuvaBrancaColors.onPrimary,
    primaryContainer: '#4A1A2B', // Rosa escuro
    onPrimaryContainer: LuvaBrancaColors.lightPink,
    
    // Cores secundárias (tons escuros)
    secondary: '#2A2A2A', // Cinza escuro
    onSecondary: '#E0E0E0', // Texto claro
    secondaryContainer: '#1E1E1E',
    onSecondaryContainer: '#F0F0F0',
    
    // Cores terciárias
    tertiary: '#A0A0A0', // Cinza médio
    onTertiary: '#1A1A1A',
    tertiaryContainer: '#404040',
    onTertiaryContainer: '#E0E0E0',
    
    // Cores de status (adaptadas para dark)
    error: LuvaBrancaColors.error,
    onError: LuvaBrancaColors.onPrimary,
    errorContainer: '#4A1A1A', // Vermelho escuro
    onErrorContainer: '#FFB3B3', // Vermelho claro
    
    // Fundos e superfícies escuras
    background: '#121212', // Fundo principal escuro
    onBackground: '#E0E0E0', // Texto claro
    surface: '#1E1E1E', // Superfícies elevadas
    onSurface: '#E0E0E0',
    surfaceVariant: '#2A2A2A',
    onSurfaceVariant: '#B0B0B0',
    
    // Bordas e contornos
    outline: '#555555',
    outlineVariant: '#333333',
    
    // Sombras e sobreposições
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    
    // Superfícies inversas
    inverseSurface: '#E0E0E0',
    inverseOnSurface: '#1A1A1A',
    inversePrimary: LuvaBrancaColors.primary,
    
    // Elevação em dark mode
    elevation: {
      level0: 'transparent',
      level1: '#1F1F1F',
      level2: '#232323',
      level3: '#262626',
      level4: '#282828',
      level5: '#2B2B2B',
    },
    
    // Estados desabilitados
    surfaceDisabled: 'rgba(224, 224, 224, 0.12)',
    onSurfaceDisabled: 'rgba(224, 224, 224, 0.38)',
    
    // Cores personalizadas adaptadas
    success: LuvaBrancaColors.success,
    onSuccess: LuvaBrancaColors.onPrimary,
    successContainer: '#1A3A2A', // Verde escuro
    onSuccessContainer: '#90E0A0', // Verde claro
    
    warning: LuvaBrancaColors.warning,
    onWarning: LuvaBrancaColors.onPrimary,
    warningContainer: '#3A2A1A', // Laranja escuro
    onWarningContainer: '#F0C060', // Laranja claro
  },
}

export type LuvaBrancaTheme = typeof lightTheme 