/**
 * Hooks customizados para a aplicação
 */

import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import * as Location from 'expo-location'
import { Location as LocationType } from '../types'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useEmergencyAlertsStore } from '@/src/stores/useEmergencyAlertsStore'

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
 * Hook para emergências — adaptador sobre useEmergencyAlertsStore.
 * Mantém a interface usada por componentes legados (ex.: SOSButton).
 */
export const useEmergency = () => {
  const { user } = useAuth()
  const { loading, addEmergencyAlert } = useEmergencyAlertsStore()
  const { location } = useLocation()

  const createEmergency = async (emergency: {
    type?: string
    description?: string
    isPoliceEmergency?: boolean
    [key: string]: unknown
  }) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado')
      return
    }

    if (!location) {
      Alert.alert('Erro', 'Localização não disponível')
      return
    }

    try {
      await addEmergencyAlert(
        {
          message: emergency.description ?? 'Solicitação de socorro',
          guardiansJson: '[]',
          isPoliceEmergency: emergency.isPoliceEmergency ?? emergency.type === 'police',
          locationLat: location.latitude,
          locationLng: location.longitude,
        },
        user.id,
      )

      Alert.alert(
        'Emergência Registrada',
        'Sua solicitação foi enviada. Aguarde o atendimento.',
        [{ text: 'OK' }],
      )
    } catch (error) {
      console.error('Erro ao criar emergência:', error)
      Alert.alert('Erro', 'Não foi possível registrar a emergência')
    }
  }

  return {
    loading,
    createEmergency,
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
