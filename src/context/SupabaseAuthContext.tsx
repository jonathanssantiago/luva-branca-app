import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Session, User } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'
import { supabase, Profile } from '../../lib/supabase'
import { translateAuthError } from '@/lib/utils'
import {
  DISGUISED_MODE_STORAGE_KEYS,
  saveDisguisedModeCredentials,
  clearDisguisedModeCredentials,
  restoreSession,
  getLastLoginInfo,
  updateLastLogin,
} from '@/lib/utils/disguised-mode-auth'
import {
  checkOfflineAccess,
  saveOfflineAccessData,
  clearOfflineAccessData,
  verifyBiometricForOfflineAccess,
  OfflineAccessResult,
} from '../lib/utils/offline-access'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userProfile: Profile | null
  isOfflineMode: boolean
  offlineAccessMessage: string
  sessionRestored: boolean
  signUp: (
    email: string,
    password: string,
    extraData: {
      full_name: string
      phone: string
      birth_date: string
      gender: string
      cpf: string
    },
  ) => Promise<{ error: any; data?: { user: User | null } }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  resendVerificationEmail: (email: string) => Promise<{ error: any }>
  attemptBiometricLogin: () => Promise<{ success: boolean; error?: any }>
  saveCredentialsForBiometric: (email: string, password: string) => Promise<void>
  checkOfflineAccess: () => Promise<OfflineAccessResult>
  verifyBiometricForOfflineAccess: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Storage adapter que funciona tanto para web quanto para mobile
const createSecureStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Para web, usar localStorage com fallback
    return {
      getItemAsync: (key: string) => {
        try {
          if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            return Promise.resolve((globalThis as any).localStorage.getItem(key))
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
        return Promise.resolve(null)
      },
      setItemAsync: (key: string, value: string) => {
        try {
          if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            ;(globalThis as any).localStorage.setItem(key, value)
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
        return Promise.resolve()
      },
      deleteItemAsync: (key: string) => {
        try {
          if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            ;(globalThis as any).localStorage.removeItem(key)
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
        return Promise.resolve()
      },
    }
  } else {
    // Para mobile, usar SecureStore
    return SecureStore
  }
}

const secureStore = createSecureStorageAdapter()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [offlineAccessMessage, setOfflineAccessMessage] = useState('')
  const [sessionRestored, setSessionRestored] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const initializationRef = useRef(false)

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setUserProfile(data)
        return data
      } else {
        setUserProfile(null)
        return null
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      setUserProfile(null)
      return null
    }
  }

  // Função centralizada para restaurar sessão
  const initializeAuth = async () => {
    if (initializationRef.current) {
      return // Evita múltiplas inicializações
    }
    
    initializationRef.current = true
    
    try {
      console.log('🔄 Iniciando restauração de sessão...')
      
      // 1. Tentar obter sessão atual do Supabase
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (!error && currentSession) {
        console.log('✅ Sessão ativa encontrada no Supabase')
        setSession(currentSession)
        setUser(currentSession.user)
        const profile = await fetchUserProfile(currentSession.user.id)
        
        // Salvar para modo disfarçado se o perfil foi carregado
        if (profile) {
          await updateLastLogin()
        }
        
        setSessionRestored(true)
        setIsOfflineMode(false)
        return
      }
      
      // 2. Tentar restaurar sessão usando tokens salvos
      console.log('🔍 Tentando restaurar sessão com tokens salvos...')
      const restoreResult = await restoreSession()
      
      if (restoreResult.success && restoreResult.user) {
        console.log('✅ Sessão restaurada com tokens salvos')
        setUser(restoreResult.user)
        await fetchUserProfile(restoreResult.user.id)
        setSessionRestored(true)
        setIsOfflineMode(false)
        return
      }
      
      // 3. Verificar último login para modo offline
      console.log('🔍 Verificando possibilidade de acesso offline...')
      const { isRecent } = await getLastLoginInfo()
      
      if (isRecent) {
        console.log('⚠️ Login recente detectado - modo offline disponível')
        setIsOfflineMode(true)
        setOfflineAccessMessage('Modo offline ativo - login recente')
        
        // Tentar carregar perfil salvo
        try {
          const savedProfile = await SecureStore.getItemAsync('offline_user_profile')
          if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile))
          }
        } catch (error) {
          console.error('Erro ao carregar perfil offline:', error)
        }
      } else {
        console.log('❌ Nenhuma sessão válida encontrada')
        setUser(null)
        setSession(null)
        setUserProfile(null)
        setIsOfflineMode(false)
        setSessionRestored(false)
      }
      
    } catch (error) {
      console.error('❌ Erro durante inicialização da autenticação:', error)
      setUser(null)
      setSession(null)
      setUserProfile(null)
      setIsOfflineMode(false)
      setSessionRestored(false)
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth()
    }
  }, [isInitialized])

  useEffect(() => {
    // Listener para mudanças de estado da autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      // Só processar se já inicializou
      if (!isInitialized) {
        return
      }
      
      if (event === 'SIGNED_IN' && session) {
        setSession(session)
        setUser(session.user)
        await fetchUserProfile(session.user.id)
        setIsOfflineMode(false)
        setSessionRestored(true)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setUserProfile(null)
        setIsOfflineMode(false)
        setSessionRestored(false)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session)
        // Atualizar tokens salvos
        await Promise.all([
          SecureStore.setItemAsync(
            DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN,
            session.access_token
          ),
          SecureStore.setItemAsync(
            DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN,
            session.refresh_token
          ),
        ])
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isInitialized])

  const signUp = async (
    email: string,
    password: string,
    extraData: {
      full_name: string
      phone: string
      birth_date: string
      gender: string
      cpf: string
    },
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...extraData,
          },
          emailRedirectTo: 'luva-branca://auth/callback',
        },
      })

      if (error) {
        // Mapeamento de erros específicos de cadastro
        if (error.message?.includes('already registered')) {
          return {
            error: {
              ...error,
              message:
                'Este e-mail já está cadastrado. Por favor, faça login ou use outro e-mail.',
              code: 'user_exists',
            },
          }
        }

        if (error.message?.includes('Password should be at least')) {
          return {
            error: {
              ...error,
              message: 'A senha deve ter pelo menos 6 caracteres.',
              code: 'password_too_short',
            },
          }
        }

        if (error.message?.includes('provide your email')) {
          return {
            error: {
              ...error,
              message: 'Por favor, informe um endereço de e-mail válido.',
              code: 'email_required',
            },
          }
        }

        return {
          error: {
            ...error,
            code:
              error.message?.toLowerCase().replace(/\s+/g, '_') ||
              'unknown_error',
          },
        }
      }

      // O perfil será criado automaticamente pelo trigger
      return { error, data }
    } catch (error) {
      return {
        error: {
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
          code: 'network_error',
        },
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Mapeamento mais específico de erros de login
        if (error.message === 'Email not confirmed') {
          return {
            error: {
              ...error,
              message: 'Por favor, verifique seu e-mail antes de fazer login.',
              code: 'email_not_confirmed',
            },
          }
        }

        if (error.message === 'Invalid login credentials') {
          return {
            error: {
              ...error,
              message:
                'E-mail ou senha incorretos. Verifique seus dados e tente novamente.',
              code: 'invalid_credentials',
            },
          }
        }

        if (error.message === 'Too many requests') {
          return {
            error: {
              ...error,
              message:
                'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
              code: 'rate_limit',
            },
          }
        }

        // Retorna o erro com código para facilitar o tratamento
        return {
          error: {
            ...error,
            code:
              error.message?.toLowerCase().replace(/\s+/g, '_') ||
              'unknown_error',
          },
        }
      }

      if (!error && data.user && data.session) {
        // Buscar perfil
        const profile = await fetchUserProfile(data.user.id)
        
        // Salvar credenciais para modo disfarçado
        try {
          await saveDisguisedModeCredentials(email, password)
          
          // Salvar perfil para acesso offline
          if (profile) {
            await SecureStore.setItemAsync(
              'offline_user_profile',
              JSON.stringify(profile)
            )
          }
        } catch (saveError) {
          console.error('Erro ao salvar credenciais:', saveError)
        }
      }
      
      return { error }
    } catch (error) {
      return {
        error: {
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
          code: 'network_error',
        },
      }
    }
  }

  const signOut = async () => {
    try {
      // Clear biometric credentials (legacy)
      await secureStore.deleteItemAsync('user_email')
      await secureStore.deleteItemAsync('user_password')
      await secureStore.deleteItemAsync('last_login')

      // Clear disguised mode credentials
      await clearDisguisedModeCredentials()

      // Clear offline profile
      await secureStore.deleteItemAsync('offline_user_profile')

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setSession(null)
      setUserProfile(null)
      setIsOfflineMode(false)
      setOfflineAccessMessage('')
      setSessionRestored(false)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        const mappedError = translateAuthError(error)
        return { error: mappedError }
      }

      return { error: null }
    } catch (error) {
      const mappedError = translateAuthError(error)
      return { error: mappedError }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'luva-branca://auth/callback',
        },
      })

      if (error) {
        const mappedError = translateAuthError(error)
        return { error: mappedError }
      }

      return { error: null }
    } catch (error) {
      const mappedError = translateAuthError(error)
      return { error: mappedError }
    }
  }

  const saveCredentialsForBiometric = async (email: string, password: string) => {
    try {
      await secureStore.setItemAsync('user_email', email)
      await secureStore.setItemAsync('user_password', password)
      await secureStore.setItemAsync('last_login', new Date().toISOString())
    } catch (error) {
      console.error('Error saving credentials:', error)
    }
  }

  const attemptBiometricLogin = async () => {
    try {
      // No ambiente web, biometric authentication não está disponível
      if (Platform.OS === 'web') {
        return { success: false, error: 'Biometric authentication not available on web' }
      }

      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()

      if (!hasHardware || !isEnrolled) {
        return { success: false, error: 'Biometric authentication not available' }
      }

      // Attempt biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o Luva Branca',
        fallbackLabel: 'Usar senha',
        cancelLabel: 'Cancelar',
      })

      if (!result.success) {
        return { success: false, error: 'Biometric authentication failed' }
      }

      // Get stored credentials (legacy system)
      const email = await secureStore.getItemAsync('user_email')
      const password = await secureStore.getItemAsync('user_password')

      if (!email || !password) {
        return { success: false, error: 'No stored credentials found' }
      }

      // Attempt login with stored credentials
      const { error } = await signIn(email, password)
      
      if (error) {
        return { success: false, error }
      }

      // Update last login timestamp
      await secureStore.setItemAsync('last_login', new Date().toISOString())
      
      return { success: true }
    } catch (error) {
      console.error('Biometric login error:', error)
      return { success: false, error }
    }
  }

  const checkOfflineAccess = async () => {
    return await checkOfflineAccess()
  }

  const verifyBiometricForOfflineAccess = async () => {
    return await verifyBiometricForOfflineAccess()
  }

  const value = {
    user,
    session,
    loading,
    userProfile,
    isOfflineMode,
    offlineAccessMessage,
    sessionRestored,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
    resendVerificationEmail,
    attemptBiometricLogin,
    saveCredentialsForBiometric,
    checkOfflineAccess,
    verifyBiometricForOfflineAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
