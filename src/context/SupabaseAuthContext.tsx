import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { supabase, Profile } from '../../lib/supabase'

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
        return { error }
      }

      // O perfil será criado automaticamente pelo trigger
      if (data.user && !error) {
        // Aguarda um pouco para o trigger processar
        setTimeout(async () => {
          await fetchUserProfile(data.user.id)
        }, 1000)
      }

      return { error: null, data }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Email not confirmed') {
          return {
            error: {
              message: 'Por favor, verifique seu e-mail antes de fazer login.',
            },
          }
        }
        return { error }
      }

      if (!error && data.user) {
        await fetchUserProfile(data.user.id)
      }
      return { error }
    } catch (error) {
      return { error }
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
      return { error }
    } catch (error) {
      return { error }
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
      return { error }
    } catch (error) {
      return { error }
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
