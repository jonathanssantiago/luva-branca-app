import { database } from '@/src/database'
import { Guardian } from '@/src/database/models/Guardian'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

export async function syncGuardianItem(item: SyncQueueItem): Promise<void> {
  const payload = item.parsedPayload

  if (item.operation === 'create') {
    const { data } = await apiClient.post('/sync-push', {
      entityType: 'guardians',
      operation:  'create',
      payload,
    })
    await database.write(async () => {
      const record = await database.get<Guardian>('guardians').find(item.entityLocalId)
      await record.update((g) => {
        g.remoteId   = data.id
        g.syncStatus = 'synced'
      })
    })
  } else if (item.operation === 'update') {
    await apiClient.post('/sync-push', {
      entityType: 'guardians',
      operation:  'update',
      payload,
      remoteId:   item.entityRemoteId,
    })
    await database.write(async () => {
      const record = await database.get<Guardian>('guardians').find(item.entityLocalId)
      await record.update((g) => { g.syncStatus = 'synced' })
    })
  } else if (item.operation === 'delete') {
    await apiClient.post('/sync-push', {
      entityType: 'guardians',
      operation:  'delete',
      payload,
      remoteId:   item.entityRemoteId,
    })
    await database.write(async () => {
      const record = await database.get<Guardian>('guardians').find(item.entityLocalId)
      await record.destroyPermanently()
    })
  }
}

export async function upsertGuardianFromServer(
  serverRecord: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const collection = database.get<Guardian>('guardians')
  const existing = await collection
    .query()
    .fetch()
    .then((all) => all.find((g) => g.remoteId === serverRecord.id))

  await database.write(async () => {
    if (existing) {
      await existing.update((g) => {
        g.name         = serverRecord.name as string
        g.phone        = serverRecord.phone as string
        g.relationship = serverRecord.relationship as string
        g.isActive     = serverRecord.is_active as boolean
        g.syncStatus   = 'synced'
        g.isDeleted    = false
      })
    } else {
      await collection.create((g) => {
        g.userId       = userId
        g.remoteId     = serverRecord.id as string
        g.name         = serverRecord.name as string
        g.phone        = serverRecord.phone as string
        g.relationship = serverRecord.relationship as string
        g.isActive     = serverRecord.is_active as boolean
        g.syncStatus   = 'synced'
        g.isDeleted    = false
      })
    }
  })
}

export async function deleteGuardianFromServer(remoteId: string): Promise<void> {
  const collection = database.get<Guardian>('guardians')
  const existing = await collection
    .query()
    .fetch()
    .then((all) => all.find((g) => g.remoteId === remoteId))

  if (existing) {
    await database.write(async () => { await existing.destroyPermanently() })
  }
}
