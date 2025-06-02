import React, { createContext, FC, ReactNode, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { User, AuthState } from '../types'

interface LoginCredentials {
  cpf: string
  password: string
  remember?: boolean
}

interface AuthContextData extends AuthState {
  handleLogin(credentials: LoginCredentials): Promise<void>
  handleLogout(): void
  handleRegister(userData: RegisterData): Promise<void>
  refreshAuth(): Promise<void>
}

interface RegisterData {
  name: string
  cpf: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

const AUTH_TOKEN_KEY = 'auth_token'
const USER_DATA_KEY = 'user_data'

export const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Verifica autenticação inicial
  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY)
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY)

      if (token && userData) {
        const user = JSON.parse(userData)
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }))
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }))
    }
  }

  const handleLogin = async ({
    cpf,
    password,
    remember = false,
  }: LoginCredentials) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      // TODO: Implementar chamada real para API
      // Simulação de login
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: '1',
        name: 'Joana Silva',
        cpf,
        phone: '(11) 99999-9999',
        email: 'joana@example.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const mockToken = 'mock_jwt_token'

      if (remember) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, mockToken)
        await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(mockUser))
      }

      setAuthState({
        user: mockUser,
        token: mockToken,
        isLoading: false,
        isAuthenticated: true,
      })

      // Navegar para tela principal
      router.replace('/(tabs)')
    } catch (error) {
      console.error('Erro no login:', error)
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }))
      throw error
    }
  }

  const handleRegister = async (userData: RegisterData) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      // TODO: Implementar chamada real para API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        cpf: userData.cpf,
        phone: userData.phone,
        email: userData.email,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const token = 'mock_jwt_token'

      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token)
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(newUser))

      setAuthState({
        user: newUser,
        token,
        isLoading: false,
        isAuthenticated: true,
      })

      router.replace('/(tabs)')
    } catch (error) {
      console.error('Erro no registro:', error)
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }))
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
      await SecureStore.deleteItemAsync(USER_DATA_KEY)

      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      })

      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  const refreshAuth = async () => {
    await checkAuthState()
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        handleLogin,
        handleLogout,
        handleRegister,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
