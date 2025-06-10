/**
 * ThemeContext - Gerenciamento de temas Light/Dark Mode
 * Inclui detecção automática do tema do sistema e alternância manual
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

type ThemeMode = 'light' | 'dark' | 'auto'

// Paleta refinada para Dark Mode com contraste WCAG AA
const darkModeColors = {
  // Textos - Hierarquia visual
  grayLightest: '#F5F5F5', // Texto primário (títulos) - Contraste 13.7:1
  grayLighter: '#E0E0E0', // Texto secundário - Contraste 10.9:1
  grayLight: '#BDBDBD', // Texto terciário - Contraste 7.4:1
  grayMedium: '#9E9E9E', // Placeholders - Contraste 4.7:1

  // Superfícies - Do mais escuro ao mais claro
  grayDarkest: '#0F0F0F', // Background principal
  grayDarker: '#1A1A1A', // Surface elevada
  grayDark: '#2D2D2D', // Inputs/Cards
  gray: '#424242', // Borders/Dividers

  // Estados e feedback
  errorLight: '#FF6B6B', // Erro no dark mode
  successLight: '#51CF66', // Sucesso no dark mode
  warningLight: '#FFD93D', // Aviso no dark mode

  // Rosa adaptado para dark mode
  primaryDark: '#FF6B9D', // Rosa mais claro para melhor contraste
  primaryContainerDark: '#4A1B2F', // Container rosa escuro
}

// Tema light baseado no LuvaBrancaColors
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: LuvaBrancaColors.primary,
    onPrimary: LuvaBrancaColors.onPrimary,
    primaryContainer: LuvaBrancaColors.lightPink,
    onPrimaryContainer: LuvaBrancaColors.textPrimary,
    secondary: LuvaBrancaColors.secondary,
    onSecondary: LuvaBrancaColors.onSecondary,
    secondaryContainer: LuvaBrancaColors.veryLightPink,
    onSecondaryContainer: LuvaBrancaColors.textPrimary,
    surface: LuvaBrancaColors.backgrounds.surface,
    onSurface: LuvaBrancaColors.textPrimary,
    surfaceVariant: LuvaBrancaColors.veryLightPink,
    onSurfaceVariant: LuvaBrancaColors.textSecondary,
    onSurfaceDisabled: LuvaBrancaColors.textDisabled,
    background: LuvaBrancaColors.backgrounds.primary,
    onBackground: LuvaBrancaColors.textPrimary,
    outline: LuvaBrancaColors.border,
    shadow: LuvaBrancaColors.textSecondary,
    error: LuvaBrancaColors.error,
    onError: LuvaBrancaColors.onPrimary,
  },
}

// Tema dark refinado
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    // Cores primárias - mantendo identidade da marca
    primary: darkModeColors.primaryDark,
    onPrimary: '#FFFFFF',
    primaryContainer: darkModeColors.primaryContainerDark,
    onPrimaryContainer: darkModeColors.grayLighter,

    // Cores secundárias
    secondary: darkModeColors.grayDark,
    onSecondary: darkModeColors.grayLightest,
    secondaryContainer: darkModeColors.grayDarker,
    onSecondaryContainer: darkModeColors.grayLight,

    // Superfícies - hierarquia clara
    background: darkModeColors.grayDarkest,
    onBackground: darkModeColors.grayLightest,
    surface: darkModeColors.grayDarker,
    onSurface: darkModeColors.grayLightest,
    surfaceVariant: darkModeColors.grayDark,
    onSurfaceVariant: darkModeColors.grayLighter,
    onSurfaceDisabled: `${darkModeColors.grayMedium}99`, // 60% opacity

    // Inputs e formulários
    outline: darkModeColors.gray,
    outlineVariant: darkModeColors.grayDark,

    // Estados de erro
    error: darkModeColors.errorLight,
    onError: '#FFFFFF',
    errorContainer: '#4A1A1A',
    onErrorContainer: darkModeColors.errorLight,

    // Shadow e elevação
    shadow: '#000000',
    scrim: '#000000',

    // Cores específicas para componentes
    inverseSurface: darkModeColors.grayLightest,
    inverseOnSurface: darkModeColors.grayDarkest,
    inversePrimary: LuvaBrancaColors.primary,

    // Superfícies elevadas
    elevation: {
      level0: 'transparent',
      level1: darkModeColors.grayDarker,
      level2: '#1F1F1F',
      level3: '#242424',
      level4: '#262626',
      level5: '#2A2A2A',
    },

    // Placeholder customizado para inputs
    placeholder: darkModeColors.grayMedium,

    // Estados disabled mais sutis
    disabled: `${darkModeColors.grayMedium}66`, // 40% opacity

    // Surface containers para cards
    surfaceContainer: darkModeColors.grayDarker,
    surfaceContainerHigh: darkModeColors.grayDark,
    surfaceContainerHighest: darkModeColors.gray,
    surfaceContainerLow: '#141414',
    surfaceContainerLowest: darkModeColors.grayDarkest,
  },
}

interface ThemeContextType {
  theme: typeof lightTheme
  themeMode: ThemeMode
  isDark: boolean
  toggleTheme: () => void
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() ?? 'light'
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto')

  // Determina se deve usar dark mode
  const isDark =
    themeMode === 'auto' ? systemColorScheme === 'dark' : themeMode === 'dark'

  // Seleciona o tema baseado no modo
  const theme = isDark ? darkTheme : lightTheme

  // Carrega a preferência salva na inicialização
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        // Só tenta carregar do SecureStore em plataformas nativas
        if (Platform.OS !== 'web') {
          const savedThemeMode = await SecureStore.getItemAsync('themeMode')
          if (
            savedThemeMode &&
            ['light', 'dark', 'auto'].includes(savedThemeMode)
          ) {
            setThemeModeState(savedThemeMode as ThemeMode)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar preferência de tema:', error)
        // Em caso de erro, mantém o tema padrão 'auto'
      }
    }

    loadThemePreference()
  }, [])

  // Salva a preferência quando o tema muda
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        // Só tenta salvar no SecureStore em plataformas nativas
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('themeMode', themeMode)
        }
      } catch (error) {
        console.error('Erro ao salvar preferência de tema:', error)
      }
    }

    saveThemePreference()
  }, [themeMode])

  // Função para alternar entre os temas
  const toggleTheme = () => {
    if (themeMode === 'auto') {
      // auto -> light -> dark -> auto
      setThemeModeState('light')
    } else if (themeMode === 'light') {
      setThemeModeState('dark')
    } else {
      setThemeModeState('auto')
    }
  }

  // Função para definir um modo específico
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
  }

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    toggleTheme,
    setThemeMode,
  }

  // Sempre renderiza os children, não espera inicialização
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Hook para usar o contexto de tema
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    console.error('useTheme deve ser usado dentro de um ThemeProvider')
    // Retorna um tema padrão em caso de erro ao invés de lançar exception
    return {
      theme: lightTheme,
      themeMode: 'light',
      isDark: false,
      toggleTheme: () => {},
      setThemeMode: () => {},
    }
  }
  return context
}

// Hook para obter apenas as cores do tema atual
export const useThemeColors = () => {
  const { theme } = useTheme()
  return theme.colors
}

// Hook para obter cores específicas do dark mode (placeholder, disabled, etc.)
export const useThemeExtendedColors = () => {
  const { theme, isDark } = useTheme()

  return {
    ...theme.colors,
    // Cores específicas para componentes de formulário
    placeholder: isDark
      ? darkModeColors.grayMedium
      : LuvaBrancaColors.textSecondary,
    disabled: isDark
      ? `${darkModeColors.grayMedium}66`
      : LuvaBrancaColors.textDisabled,
    inputBackground: isDark
      ? darkModeColors.grayDark
      : LuvaBrancaColors.backgrounds.surface,
    inputBorder: isDark ? darkModeColors.gray : LuvaBrancaColors.border,

    // Hierarquia de texto
    textPrimary: isDark
      ? darkModeColors.grayLightest
      : LuvaBrancaColors.textPrimary,
    textSecondary: isDark
      ? darkModeColors.grayLighter
      : LuvaBrancaColors.textSecondary,
    textTertiary: isDark
      ? darkModeColors.grayLight
      : LuvaBrancaColors.textSecondary,

    // Estados de feedback
    success: isDark ? darkModeColors.successLight : LuvaBrancaColors.success,
    warning: isDark ? darkModeColors.warningLight : LuvaBrancaColors.warning,

    // Opacidades para ícones
    iconPrimary: isDark
      ? `${darkModeColors.grayLightest}DE`
      : `${LuvaBrancaColors.textPrimary}DE`, // 87%
    iconSecondary: isDark
      ? `${darkModeColors.grayLighter}99`
      : `${LuvaBrancaColors.textSecondary}99`, // 60%
  }
}

export default ThemeContext
