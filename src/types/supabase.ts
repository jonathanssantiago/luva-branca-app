export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          birth_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          updated_at?: string
        }
      }
      // Adicione outras tabelas aqui conforme necessário
    }
    Views: {
      // Views do banco de dados
    }
    Functions: {
      // Edge Functions
      send_welcome: {
        Args: {
          user_id: string
        }
        Returns: {
          success: boolean
          message: string
        }
      }
    }
  }
}

// Tipos de autenticação
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    [key: string]: any
  }
}

// Tipos de perfil
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  birth_date: string | null
  created_at?: string
  updated_at?: string
}

// Tipos de realtime
export interface RealtimeEvent<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
  commit_timestamp: string
}

// Tipos de presença
export interface PresenceState {
  user_id: string
  full_name: string
  online_at: string
}

// Tipos de upload
export interface UploadResult {
  path: string | null
  publicUrl: string | null
  error: string | null
}

// Tipos de edge functions
export interface EdgeFunctionResponse<T = any> {
  data: T | null
  error: string | null
}

// Tipos derivados
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]
export type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Insert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Update<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
