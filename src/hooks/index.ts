/**
 * Hooks customizados para a aplicação
 */

import { useContext, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import * as Location from 'expo-location'
import { User, Location as LocationType, Emergency } from '../types'

/**
 * Hook para geolocalização
 */
export const useLocation = () => {
  const [location, setLocation] = useState<LocationType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setError('Permissão de localização negada')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      })

      const address = reverseGeocode[0]

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address:
          `${address?.street || ''} ${address?.streetNumber || ''}`.trim(),
        city: address?.city || '',
        state: address?.region || '',
        zipCode: address?.postalCode || '',
      })
    } catch (err) {
      setError('Erro ao obter localização')
      console.error('Erro na geolocalização:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    requestLocation()
  }, [])

  return {
    location,
    loading,
    error,
    requestLocation,
  }
}

/**
 * Hook para emergências
 */
export const useEmergency = () => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(false)
  const { location } = useLocation()

  const createEmergency = async (
    emergency: Omit<
      Emergency,
      'id' | 'location' | 'status' | 'userId' | 'createdAt' | 'updatedAt'
    >,
  ) => {
    try {
      setLoading(true)

      if (!location) {
        Alert.alert('Erro', 'Localização não disponível')
        return
      }

      const newEmergency: Emergency = {
        ...emergency,
        id: Date.now().toString(),
        location,
        status: 'pending',
        userId: 'current-user', // TODO: pegar do contexto de auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setEmergencies((prev) => [newEmergency, ...prev])

      // TODO: Enviar para API
      console.log('Emergência criada:', newEmergency)

      Alert.alert(
        'Emergência Registrada',
        'Sua solicitação foi enviada. Aguarde o atendimento.',
        [{ text: 'OK' }],
      )

      return newEmergency
    } catch (error) {
      console.error('Erro ao criar emergência:', error)
      Alert.alert('Erro', 'Não foi possível registrar a emergência')
    } finally {
      setLoading(false)
    }
  }

  const cancelEmergency = (emergencyId: string) => {
    setEmergencies((prev) =>
      prev.map((emergency) =>
        emergency.id === emergencyId
          ? {
              ...emergency,
              status: 'cancelled' as const,
              updatedAt: new Date().toISOString(),
            }
          : emergency,
      ),
    )
  }

  return {
    emergencies,
    loading,
    createEmergency,
    cancelEmergency,
  }
}

/**
 * Hook para validação de formulários
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: any,
) => {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const setFieldTouched = (field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const validate = () => {
    if (!validationSchema) return true

    try {
      validationSchema.validateSync(values, { abortEarly: false })
      setErrors({})
      return true
    } catch (error: any) {
      const validationErrors: Partial<Record<keyof T, string>> = {}

      error.inner?.forEach((err: any) => {
        if (err.path) {
          validationErrors[err.path as keyof T] = err.message
        }
      })

      setErrors(validationErrors)
      return false
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
  }
}

// Exports dos novos hooks do Supabase
export { useProfile } from './useProfile'
export { useAudioRecording } from './useAudioRecording'
export { useGuardians } from './useGuardians'
export { useGuardiansValidator } from './useGuardiansValidator'
export { useDocumentUpload } from './useDocumentUpload'
export { useImageUpload } from './useImageUpload'
export { usePermissions } from './usePermissions'
export { usePrivacySettings } from './usePrivacySettings'
export { useOfflineAlerts } from './useOfflineAlerts'
export { useEdgeFunctions, useAuthFunctions } from './useEdgeFunctions'

// Biometria integrada com configurações de privacidade
export { useBiometricAuth } from './useBiometricAuth'

// Utilitários dos guardiões
export * from '@/src/utils/guardians'
