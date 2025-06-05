/**
 * ThemeContext - Gerenciamento de temas Light/Dark Mode
 * Inclui detecção automática do tema do sistema e alternância manual
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

type ThemeMode = 'light' | 'dark' | 'auto'

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

// Tema dark
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: LuvaBrancaColors.primary,
    onPrimary: LuvaBrancaColors.onPrimary,
    primaryContainer: '#4A0E1F', // Rosa escuro
    onPrimaryContainer: LuvaBrancaColors.lightPink,
    secondary: '#2A2A2A', // Cinza escuro
    onSecondary: '#FFFFFF',
    secondaryContainer: '#333333',
    onSecondaryContainer: '#CCCCCC',
    surface: '#1E1E1E',
    onSurface: '#FFFFFF',
    surfaceVariant: '#2A2A2A',
    onSurfaceVariant: '#CCCCCC',
    onSurfaceDisabled: '#666666',
    background: '#121212',
    onBackground: '#FFFFFF',
    outline: '#444444',
    shadow: '#000000',
    error: LuvaBrancaColors.error,
    onError: LuvaBrancaColors.onPrimary,
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
  const systemColorScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto')

  // Determina se deve usar dark mode
  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark'

  // Seleciona o tema baseado no modo
  const theme = isDark ? darkTheme : lightTheme

  // Carrega a preferência salva na inicialização
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        // Só tenta carregar do SecureStore em plataformas nativas
        if (Platform.OS !== 'web') {
          const savedThemeMode = await SecureStore.getItemAsync('themeMode')
          if (savedThemeMode && ['light', 'dark', 'auto'].includes(savedThemeMode)) {
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
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
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

export default ThemeContext 