/**
 * Hook para gerenciamento de alertas offline
 * Armazena alertas que falharam para reenvio posterior
 */

import { useState, useEffect, useCallback } from 'react'
import * as SecureStore from 'expo-secure-store'
import { Guardian } from '@/lib/supabase'

export interface OfflineAlert {
  id: string
  message: string
  timestamp: number
  isPoliceEmergency: boolean
  guardians: Guardian[]
  location?: {
    latitude: number
    longitude: number
  }
  attempts: number
  lastAttempt?: number
}

const OFFLINE_ALERTS_KEY = 'offline_alerts'
const MAX_ATTEMPTS = 3
const RETRY_DELAY = 5 * 60 * 1000 // 5 minutos

export const useOfflineAlerts = () => {
  const [offlineAlerts, setOfflineAlerts] = useState<OfflineAlert[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Carregar alertas offline do storage
  const loadOfflineAlerts = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(OFFLINE_ALERTS_KEY)
      if (stored) {
        const alerts: OfflineAlert[] = JSON.parse(stored)
        setOfflineAlerts(alerts)
      }
    } catch (error) {
      console.error('Erro ao carregar alertas offline:', error)
    }
  }, [])

  // Salvar alertas offline no storage
  const saveOfflineAlerts = useCallback(async (alerts: OfflineAlert[]) => {
    try {
      await SecureStore.setItemAsync(OFFLINE_ALERTS_KEY, JSON.stringify(alerts))
      setOfflineAlerts(alerts)
    } catch (error) {
      console.error('Erro ao salvar alertas offline:', error)
    }
  }, [])

  // Adicionar alerta offline
  const addOfflineAlert = useCallback(
    async (
      message: string,
      guardians: Guardian[],
      isPoliceEmergency: boolean = false,
      location?: { latitude: number; longitude: number },
    ) => {
      const newAlert: OfflineAlert = {
        id: Date.now().toString(),
        message,
        timestamp: Date.now(),
        isPoliceEmergency,
        guardians,
        location,
        attempts: 0,
      }

      const currentAlerts = [...offlineAlerts, newAlert]
      await saveOfflineAlerts(currentAlerts)

      return newAlert.id
    },
    [offlineAlerts, saveOfflineAlerts],
  )

  // Remover alerta offline
  const removeOfflineAlert = useCallback(
    async (alertId: string) => {
      const updatedAlerts = offlineAlerts.filter(
        (alert) => alert.id !== alertId,
      )
      await saveOfflineAlerts(updatedAlerts)
    },
    [offlineAlerts, saveOfflineAlerts],
  )

  // Marcar tentativa de reenvio
  const markRetryAttempt = useCallback(
    async (alertId: string) => {
      const updatedAlerts = offlineAlerts.map((alert) => {
        if (alert.id === alertId) {
          return {
            ...alert,
            attempts: alert.attempts + 1,
            lastAttempt: Date.now(),
          }
        }
        return alert
      })
      await saveOfflineAlerts(updatedAlerts)
    },
    [offlineAlerts, saveOfflineAlerts],
  )

  // Verificar se um alerta deve ser reenviadio
  const shouldRetryAlert = useCallback((alert: OfflineAlert): boolean => {
    if (alert.attempts >= MAX_ATTEMPTS) {
      return false
    }

    if (!alert.lastAttempt) {
      return true
    }

    const timeSinceLastAttempt = Date.now() - alert.lastAttempt
    return timeSinceLastAttempt >= RETRY_DELAY
  }, [])

  // Obter alertas pendentes para reenvio
  const getPendingAlerts = useCallback((): OfflineAlert[] => {
    return offlineAlerts.filter(shouldRetryAlert)
  }, [offlineAlerts, shouldRetryAlert])

  // Limpar alertas expirados (máximo de tentativas atingido)
  const cleanExpiredAlerts = useCallback(async () => {
    const activeAlerts = offlineAlerts.filter(
      (alert) => alert.attempts < MAX_ATTEMPTS,
    )

    if (activeAlerts.length !== offlineAlerts.length) {
      await saveOfflineAlerts(activeAlerts)
    }
  }, [offlineAlerts, saveOfflineAlerts])

  // Processar alertas offline (tentar reenviar)
  const processOfflineAlerts = useCallback(
    async (sendAlertFunction: (alert: OfflineAlert) => Promise<boolean>) => {
      if (isProcessing) return

      setIsProcessing(true)
      const pendingAlerts = getPendingAlerts()

      for (const alert of pendingAlerts) {
        try {
          const success = await sendAlertFunction(alert)

          if (success) {
            await removeOfflineAlert(alert.id)
          } else {
            await markRetryAttempt(alert.id)
          }
        } catch (error) {
          console.error(`Erro ao reenviar alerta ${alert.id}:`, error)
          await markRetryAttempt(alert.id)
        }
      }

      await cleanExpiredAlerts()
      setIsProcessing(false)
    },
    [
      isProcessing,
      getPendingAlerts,
      removeOfflineAlert,
      markRetryAttempt,
      cleanExpiredAlerts,
    ],
  )

  // Carregar alertas na inicialização
  useEffect(() => {
    loadOfflineAlerts()
  }, []) // Removeu dependência que causava loop

  return {
    offlineAlerts,
    isProcessing,
    addOfflineAlert,
    removeOfflineAlert,
    processOfflineAlerts,
    getPendingAlerts,
    loadOfflineAlerts,
  }
}
