import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

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

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined, // Utilizaremos o SecureStore para persistir a sessão
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tipos para o banco de dados
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  birth_date: string | null
  cpf: string | null
  created_at?: string
  updated_at?: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
