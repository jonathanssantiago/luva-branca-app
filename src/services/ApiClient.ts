import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import { supabase } from '@/lib/supabase'

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_NESTJS_API_URL ?? 'http://localhost:3000',
  timeout: 30_000,
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
