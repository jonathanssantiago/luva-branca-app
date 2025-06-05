import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Configuração das variáveis de ambiente
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. Verifique EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY',
  )
}

// Storage adapter que funciona tanto para web quanto para mobile
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Para web, usar localStorage
    return {
      getItem: (key: string) => {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          return Promise.resolve((globalThis as any).localStorage.getItem(key))
        }
        return Promise.resolve(null)
      },
      setItem: (key: string, value: string) => {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          ;(globalThis as any).localStorage.setItem(key, value)
        }
        return Promise.resolve()
      },
      removeItem: (key: string) => {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
          ;(globalThis as any).localStorage.removeItem(key)
        }
        return Promise.resolve()
      },
    }
  } else {
    // Para mobile, usar SecureStore
    return {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    }
  }
}

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tipos para o banco de dados
export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  cpf: string | null
  phone: string | null
  birth_date: string | null
  gender: string | null
  avatar_url: string | null
  created_at?: string
  updated_at?: string
}

export interface Guardian {
  id: string
  user_id: string
  name: string
  phone: string
  relationship: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      guardians: {
        Row: Guardian
        Insert: Omit<Guardian, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<
          Omit<Guardian, 'id' | 'user_id' | 'created_at' | 'updated_at'>
        >
      }
    }
  }
}
