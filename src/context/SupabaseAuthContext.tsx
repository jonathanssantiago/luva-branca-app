import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { supabase, Profile } from '../../lib/supabase'
import { translateAuthError } from '@/lib/utils'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userProfile: Profile | null
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configuração do SecureStore para persistir a sessão
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setUserProfile(data)
    else setUserProfile(null)
  }

  useEffect(() => {
    // Recuperar sessão salva
    const getSession = async () => {
      try {
        const savedSession = await ExpoSecureStoreAdapter.getItem(
          'supabase.auth.token',
        )
        if (savedSession) {
          // Optionally, you can restore session here if needed, but supabase-js handles it internally
        }

        // Obter sessão atual
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id)
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Erro ao obter sessão:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listener para mudanças de estado da autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

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
      if (data?.user && !error) {
        // Aguarda um pouco para o trigger processar
        setTimeout(async () => {
          if (data.user) {
            await fetchUserProfile(data.user.id)
          }
        }, 1000)
      }

      return { error: null, data }
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

      if (!error && data.user) {
        await fetchUserProfile(data.user.id)
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
      await supabase.auth.signOut()
      await ExpoSecureStoreAdapter.removeItem('supabase.auth.token')
      setUserProfile(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
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

  const value = {
    user,
    session,
    loading,
    userProfile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
    resendVerificationEmail,
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
