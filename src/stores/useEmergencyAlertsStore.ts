import { create } from 'zustand'
import { database } from '@/src/database'
import { EmergencyAlert } from '@/src/database/models/EmergencyAlert'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'

interface AddEmergencyAlertInput {
  message: string
  guardiansJson: string
  isPoliceEmergency: boolean
  locationLat?: number | null
  locationLng?: number | null
}

interface EmergencyAlertsState {
  emergencyAlerts: EmergencyAlert[]
  loading: boolean
  error: string | null
  setEmergencyAlerts: (alerts: EmergencyAlert[]) => void
  addEmergencyAlert: (input: AddEmergencyAlertInput, userId: string) => Promise<void>
}

export const useEmergencyAlertsStore = create<EmergencyAlertsState>((set) => ({
  emergencyAlerts: [],
  loading: false,
  error: null,

  setEmergencyAlerts: (emergencyAlerts) => set({ emergencyAlerts }),

  addEmergencyAlert: async (input, userId) => {
    set({ loading: true, error: null })
    try {
      await database.write(async () => {
        const record = await database.get<EmergencyAlert>('emergency_alerts').create((a) => {
          a.userId = userId
          a.message = input.message
          a._setRaw('guardians_json', input.guardiansJson)
          a.isPoliceEmergency = input.isPoliceEmergency
          a.locationLat = input.locationLat ?? null
          a.locationLng = input.locationLng ?? null
          a.syncStatus = 'pending'
          a.sentAt = new Date()
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'emergency_alerts'
          q.entityLocalId = record.id
          q.operation = 'create'
          q.payload = JSON.stringify({ ...input, userId })
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar alerta de emergência'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
