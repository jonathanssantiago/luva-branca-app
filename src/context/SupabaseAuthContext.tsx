import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Session, User } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'
import { supabase, Profile } from '../../lib/supabase'
import { translateAuthError, normalizePhoneToE164 } from '@/lib/utils'
import {
  DISGUISED_MODE_STORAGE_KEYS,
  saveDisguisedModeCredentials,
  clearDisguisedModeCredentials,
  getLastLoginInfo,
  updateLastLogin,
} from '@/lib/utils/disguised-mode-auth'
import {
  checkOfflineAccess as checkOfflineAccessUtil,
  saveOfflineAccessData,
  clearOfflineAccessData,
  verifyBiometricForOfflineAccess as verifyBiometricUtil,
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
  signUpWithPhone: (
    phone: string,
    password: string,
    extraData: {
      full_name: string
      birth_date: string
      gender: string
      cpf: string
    },
  ) => Promise<{ error: any; data?: { user: User | null; session: Session | null } }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  sendPasswordResetOtp: (phone: string) => Promise<{ error: any }>
  verifyPasswordResetOtp: (
    phone: string,
    token: string,
  ) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  resendVerificationEmail: (email: string) => Promise<{ error: any }>
  attemptBiometricLogin: () => Promise<{ success: boolean; error?: any }>
  saveCredentialsForBiometric: (
    email: string,
    password: string,
  ) => Promise<void>
  checkOfflineAccess: () => Promise<OfflineAccessResult>
  verifyBiometricForOfflineAccess: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const createSecureStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItemAsync: (key: string) => {
        try {
          if (
            typeof globalThis !== 'undefined' &&
            'localStorage' in globalThis
          ) {
            return Promise.resolve(
              (globalThis as any).localStorage.getItem(key),
            )
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
        return Promise.resolve(null)
      },
      setItemAsync: (key: string, value: string) => {
        try {
          if (
            typeof globalThis !== 'undefined' &&
            'localStorage' in globalThis
          ) {
            ; (globalThis as any).localStorage.setItem(key, value)
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
        return Promise.resolve()
      },
      deleteItemAsync: (key: string) => {
        try {
          if (
            typeof globalThis !== 'undefined' &&
            'localStorage' in globalThis
          ) {
            ; (globalThis as any).localStorage.removeItem(key)
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
        return Promise.resolve()
      },
    }
  } else {
    return SecureStore
  }
}

const secureStore = createSecureStorageAdapter()

type AuthInitResult = {
  user: User | null
  session: Session | null
  profile: Profile | null
  isOfflineMode: boolean
  offlineAccessMessage: string
  sessionRestored: boolean
}

let initPromise: Promise<AuthInitResult> | null = null

type AuthEventHandler = (event: string, session: Session | null) => void
let onAuthEvent: AuthEventHandler | null = null
let authSubscriptionCreated = false
// Flag set only during explicit user-initiated signOut to distinguish from
// spurious SIGNED_OUT events that Android/Supabase emits on token refresh failures.
let signOutInProgress = false
let passwordResetInProgress = false

function persistTokens(eventSession: Session): Promise<[void, void]> {
  return Promise.all([
    SecureStore.setItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN,
      eventSession.access_token,
    ),
    SecureStore.setItemAsync(
      DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN,
      eventSession.refresh_token,
    ),
  ])
}

async function fetchProfileForUser(userId: string): Promise<Profile | null> {
  try {
    const [profileResult, authUserResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.auth.getUser(),
    ])

    const { data, error } = profileResult
    if (error || !data) return null

    const meta = authUserResult.data?.user?.user_metadata ?? {}
    const authPhone = authUserResult.data?.user?.phone

    const needsUpdate =
      (!data.full_name && meta.full_name) ||
      (!data.phone && (meta.phone || authPhone)) ||
      (!data.birth_date && meta.birth_date) ||
      (!data.gender && meta.gender) ||
      (!data.cpf && meta.cpf)

    if (needsUpdate) {
      const patch: Partial<Profile> = {}
      if (!data.full_name && meta.full_name) patch.full_name = meta.full_name
      if (!data.phone && meta.phone) patch.phone = meta.phone
      else if (!data.phone && authPhone) patch.phone = authPhone
      if (!data.birth_date && meta.birth_date) patch.birth_date = meta.birth_date
      if (!data.gender && meta.gender) patch.gender = meta.gender
      if (!data.cpf && meta.cpf) patch.cpf = meta.cpf

      // Defer the write — don't block the critical path
      Promise.resolve(
        supabase
          .from('profiles')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single(),
      )
        .then(({ data: updated }) => {
          if (updated) Object.assign(data, updated)
        })
        .catch(() => {})

      return { ...data, ...patch } as Profile
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
}

function runInitialization(): Promise<AuthInitResult> {
  if (initPromise) return initPromise

  initPromise = (async (): Promise<AuthInitResult> => {
    const noSession: AuthInitResult = {
      user: null,
      session: null,
      profile: null,
      isOfflineMode: false,
      offlineAccessMessage: '',
      sessionRestored: false,
    }

    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (!error && currentSession) {
        const profile = await fetchProfileForUser(currentSession.user.id)
        if (profile) updateLastLogin().catch(() => {})
        return {
          user: currentSession.user,
          session: currentSession,
          profile,
          isOfflineMode: false,
          offlineAccessMessage: '',
          sessionRestored: true,
        }
      }

      const [sessionToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN),
      ])

      if (sessionToken && refreshToken) {
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: sessionToken,
            refresh_token: refreshToken,
          })

          if (!sessionError && data.session) {
            if (data.session.access_token !== sessionToken) {
              persistTokens(data.session).catch(() => {})
            }
            const profile = await fetchProfileForUser(data.session.user.id)
            updateLastLogin().catch(() => {})
            return {
              user: data.session.user,
              session: data.session,
              profile,
              isOfflineMode: false,
              offlineAccessMessage: '',
              sessionRestored: true,
            }
          }

          if (sessionError) {
            console.warn('Stored tokens rejected, clearing stale credentials:', sessionError.message)
            await clearDisguisedModeCredentials()
          }
        } catch (tokenError) {
          console.warn('setSession threw, clearing stale credentials:', tokenError)
          await clearDisguisedModeCredentials()
        }
      }

      const { isRecent } = await getLastLoginInfo()

      if (isRecent) {
        let profile: Profile | null = null
        try {
          const savedProfile = await SecureStore.getItemAsync('offline_user_profile')
          if (savedProfile) profile = JSON.parse(savedProfile)
        } catch (e) {
          console.error('Erro ao carregar perfil offline:', e)
        }
        return {
          user: null,
          session: null,
          profile,
          isOfflineMode: true,
          offlineAccessMessage: 'Modo offline ativo - login recente',
          sessionRestored: false,
        }
      }

      return noSession
    } catch (error) {
      console.error('Erro durante inicialização da autenticação:', error)
      return noSession
    }
  })()

  return initPromise
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [offlineAccessMessage, setOfflineAccessMessage] = useState('')
  const [sessionRestored, setSessionRestored] = useState(false)

  // Track current user id at module scope so the onAuthEvent closure
  // can check whether a SIGNED_OUT is spurious.
  const userRef = useRef<User | null>(null)
  userRef.current = user

  const fetchUserProfile = async (userId: string) => {
    const profile = await fetchProfileForUser(userId)
    setUserProfile(profile)
    return profile
  }

  useEffect(() => {
    let cancelled = false

    onAuthEvent = async (event: string, eventSession: Session | null) => {
      if (cancelled) return

      if (event === 'SIGNED_IN' && eventSession) {
        if (passwordResetInProgress) return
        setSession(eventSession)
        setUser(eventSession.user)
        await fetchUserProfile(eventSession.user.id)
        setIsOfflineMode(false)
        setSessionRestored(true)
        setLoading(false)
        persistTokens(eventSession).catch(() => {})
      } else if (event === 'SIGNED_OUT') {
        if (!signOutInProgress) return
        signOutInProgress = false
        setSession(null)
        setUser(null)
        setUserProfile(null)
        setIsOfflineMode(false)
        setSessionRestored(false)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && eventSession) {
        if (passwordResetInProgress) return
        setSession(eventSession)
        persistTokens(eventSession).catch(() => {})
      }
    }

    if (!authSubscriptionCreated) {
      authSubscriptionCreated = true
      supabase.auth.onAuthStateChange((event, eventSession) => {
        if (event === 'INITIAL_SESSION') return
        onAuthEvent?.(event, eventSession)
      })
    }

    runInitialization().then((result) => {
      if (cancelled) return
      setUser(result.user)
      setSession(result.session)
      setUserProfile(result.profile)
      setIsOfflineMode(result.isOfflineMode)
      setOfflineAccessMessage(result.offlineAccessMessage)
      setSessionRestored(result.sessionRestored)
      setLoading(false)
    }).catch((err) => {
      console.error('Auth init failed:', err)
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
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
          emailRedirectTo: 'siapepm://auth/callback',
        },
      })

      if (error) {
        console.error('[signUp] Supabase error:', error.message, error.code)
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

        if (error.code === 'database_error_saving_new_user') {
          return {
            error: {
              ...error,
              message:
                'Já existe uma conta com este CPF. Por favor, faça login ou entre em contato com o suporte.',
              code: 'cpf_already_registered',
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

      console.log('[signUp] Response:', {
        userId: data?.user?.id,
        identities: data?.user?.identities?.length ?? 0,
        hasSession: !!data?.session,
      })

      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        return {
          error: {
            message:
              'Este e-mail já está cadastrado. Por favor, faça login ou use outro e-mail.',
            code: 'user_exists',
          },
        }
      }

      // Upsert explícito garante que todos os campos chegam ao banco,
      // independente da versão do trigger no servidor.
      if (data?.user) {
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            full_name: extraData.full_name || null,
            email: email || null,
            phone: extraData.phone || null,
            birth_date: extraData.birth_date || null,
            gender: extraData.gender || null,
            cpf: extraData.cpf || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
      }

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

  const signUpWithPhone = async (
    phone: string,
    password: string,
    extraData: {
      full_name: string
      birth_date: string
      gender: string
      cpf: string
    },
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            ...extraData,
            phone, // Incluir explicitamente o telefone nos metadados
          },
        },
      })

      if (error) {
        console.error('[signUpWithPhone] Supabase error:', error.message, error.code)
        if (error.message?.includes('already registered')) {
          return {
            error: {
              ...error,
              message:
                'Este telefone já está cadastrado. Por favor, faça login ou use outro telefone.',
              code: 'phone_exists',
            },
          }
        }

        if (error.code === 'database_error_saving_new_user') {
          return {
            error: {
              ...error,
              message:
                'Já existe uma conta com este CPF. Por favor, faça login ou entre em contato com o suporte.',
              code: 'cpf_already_registered',
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

        if (error.message?.includes('provide your phone')) {
          return {
            error: {
              ...error,
              message: 'Por favor, informe um número de telefone válido.',
              code: 'phone_required',
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

      console.log('[signUpWithPhone] Response:', {
        userId: data?.user?.id,
        identities: data?.user?.identities?.length ?? 0,
        hasSession: !!data?.session,
      })

      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        return {
          error: {
            message:
              'Este telefone já está cadastrado. Por favor, faça login ou use outro telefone.',
            code: 'phone_exists',
          },
        }
      }

      if (data?.user) {
        // Upsert explícito garante que todos os campos chegam ao banco,
        // independente da versão do trigger no servidor.
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            full_name: extraData.full_name || null,
            phone: phone || null,
            birth_date: extraData.birth_date || null,
            gender: extraData.gender || null,
            cpf: extraData.cpf || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )

        // Quando enable_confirmations = false, o Supabase retorna sessão
        // imediatamente no signup — setar estado como autenticado.
        if (data.session) {
          setSession(data.session)
          setUser(data.user)
          const profile = await fetchUserProfile(data.user.id)

          try {
            await saveDisguisedModeCredentials(phone, password, 'phone')
            if (profile) {
              await SecureStore.setItemAsync(
                'offline_user_profile',
                JSON.stringify(profile),
              )
            }
          } catch (saveError) {
            console.error('Erro ao salvar credenciais:', saveError)
          }

          setIsOfflineMode(false)
          setSessionRestored(true)
        }
      }

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
          await saveDisguisedModeCredentials(email, password, 'email')

          // Salvar perfil para acesso offline
          if (profile) {
            await SecureStore.setItemAsync(
              'offline_user_profile',
              JSON.stringify(profile),
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

  const signInWithPhone = async (phone: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          return {
            error: {
              ...error,
              message:
                'Telefone ou senha incorretos. Verifique seus dados e tente novamente.',
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
          await saveDisguisedModeCredentials(phone, password, 'phone')

          // Salvar perfil para acesso offline
          if (profile) {
            await SecureStore.setItemAsync(
              'offline_user_profile',
              JSON.stringify(profile),
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
      await Promise.all([
        secureStore.deleteItemAsync('user_email'),
        secureStore.deleteItemAsync('user_password'),
        secureStore.deleteItemAsync('last_login'),
        clearDisguisedModeCredentials(),
        secureStore.deleteItemAsync('offline_user_profile'),
      ])

      signOutInProgress = true
      const { error } = await supabase.auth.signOut()
      if (error) {
        signOutInProgress = false
        throw error
      }

      // Allow fresh init on next mount
      initPromise = null

      setUser(null)
      setSession(null)
      setUserProfile(null)
      setIsOfflineMode(false)
      setOfflineAccessMessage('')
      setSessionRestored(false)
    } catch (error) {
      signOutInProgress = false
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

  const sendPasswordResetOtp = async (phone: string) => {
    passwordResetInProgress = true
    try {
      const formattedPhone = normalizePhoneToE164(phone)
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { shouldCreateUser: false },
      })

      if (error) {
        passwordResetInProgress = false
        return { error: translateAuthError(error) }
      }

      return { error: null }
    } catch (error) {
      passwordResetInProgress = false
      return { error: translateAuthError(error) }
    }
  }

  const verifyPasswordResetOtp = async (phone: string, token: string) => {
    try {
      const formattedPhone = normalizePhoneToE164(phone)
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      })

      if (error) {
        return { error: translateAuthError(error) }
      }

      return { error: null }
    } catch (error) {
      return { error: translateAuthError(error) }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { error: translateAuthError(error) }
      }

      if (data.user) {
        const authPhone =
          data.user.phone ||
          (data.user.user_metadata?.phone as string | undefined)
        if (authPhone) {
          try {
            await saveDisguisedModeCredentials(authPhone, newPassword, 'phone')
          } catch (saveError) {
            console.warn('Erro ao atualizar credenciais após reset:', saveError)
          }
        }
      }

      passwordResetInProgress = false
      signOutInProgress = true
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        signOutInProgress = false
        return { error: translateAuthError(signOutError) }
      }
      initPromise = null
      setSession(null)
      setUser(null)
      setUserProfile(null)
      setIsOfflineMode(false)
      setSessionRestored(false)

      return { error: null }
    } catch (error) {
      passwordResetInProgress = false
      return { error: translateAuthError(error) }
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
          emailRedirectTo: 'siapepm://auth/callback',
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

  const saveCredentialsForBiometric = async (
    email: string,
    password: string,
  ) => {
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
        return {
          success: false,
          error: 'Biometric authentication not available on web',
        }
      }

      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()

      if (!hasHardware || !isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        }
      }

      // Attempt biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o Luva Branca',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
        biometricsSecurityLevel: 'weak',
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
    // Biometria agora é verificada automaticamente se ativada
    return await checkOfflineAccessUtil(true)
  }

  const verifyBiometricForOfflineAccess = async () => {
    return await verifyBiometricUtil()
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
    signUpWithPhone,
    signIn,
    signInWithPhone,
    signOut,
    resetPassword,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    updatePassword,
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
