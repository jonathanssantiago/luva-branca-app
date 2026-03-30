import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import { supabase } from '@/lib/supabase'

// Base URL aponta para as Supabase Edge Functions do projeto.
// Formato: https://<project-ref>.supabase.co/functions/v1
//
// Supabase Edge Functions exigem o header `apikey` (anon key) além do
// `Authorization: Bearer <user_jwt>` — sem ele o gateway retorna 401.
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  ''

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL
    ?? `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/functions/v1`,
  timeout: 30_000,
  headers: {
    apikey: SUPABASE_ANON_KEY,
  },
})

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  },
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { config: InternalAxiosRequestConfig & { _retried?: boolean } }) => {
    if (error.response?.status === 401 && !error.config?._retried) {
      error.config._retried = true
      const {
        data: { session },
      } = await supabase.auth.refreshSession()
      if (session?.access_token) {
        error.config.headers.Authorization = `Bearer ${session.access_token}`
        return apiClient(error.config)
      }
    }
    return Promise.reject(error)
  },
)

export { apiClient }
