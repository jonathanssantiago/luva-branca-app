/**
 * Tipos globais da aplicação
 */

export interface User {
  id: string
  name: string
  cpf: string
  phone?: string
  email?: string
  avatar?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface Emergency {
  id: string
  type: EmergencyType
  title: string
  description: string
  location: Location
  status: EmergencyStatus
  userId: string
  createdAt: string
  updatedAt: string
}

export type EmergencyType =
  | 'medical'
  | 'fire'
  | 'police'
  | 'security'
  | 'accident'
  | 'domestic_violence'
  | 'other'

export type EmergencyStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'

export interface Location {
  latitude: number
  longitude: number
  address: string
  city: string
  state: string
  zipCode: string
}

export interface Contact {
  id: string
  name: string
  phone: string
  relationship: string
  isEmergencyContact: boolean
}

export interface NotificationSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  emergencyAlerts: boolean
  systemUpdates: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'pt' | 'en' | 'es'
  notifications: NotificationSettings
  privacySettings: {
    shareLocation: boolean
    shareContacts: boolean
    dataCollection: boolean
  }
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: string
}

export interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
}
