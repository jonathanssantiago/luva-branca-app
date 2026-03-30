import { database } from '@/src/database'
import { EmergencyAlert } from '@/src/database/models/EmergencyAlert'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

export async function syncEmergencyAlertItem(item: SyncQueueItem): Promise<void> {
  const payload = item.parsedPayload

  // Emergency alerts são append-only — só 'create' é suportado
  if (item.operation === 'create') {
    const { data } = await apiClient.post('/sync-push', {
      entityType: 'emergency-alerts',
      operation:  'create',
      payload,
    })
    await database.write(async () => {
      const record = await database
        .get<EmergencyAlert>('emergency_alerts')
        .find(item.entityLocalId)
      await record.update((a) => {
        a.remoteId   = data.id
        a.sentAt     = new Date()
        a.syncStatus = 'synced'
      })
    })
  }
}
