import { database } from '@/src/database'
import { Guardian } from '@/src/database/models/Guardian'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

async function findLocalRecord(localId: string): Promise<Guardian | null> {
  try {
    return await database.get<Guardian>('guardians').find(localId)
  } catch {
    return null
  }
}

export async function syncGuardianItem(item: SyncQueueItem): Promise<void> {
  const payload = item.parsedPayload
  const localRecord = await findLocalRecord(item.entityLocalId)

  if (item.operation === 'create') {
    if (!localRecord) return

    if (localRecord.isDeleted) return

    const { data } = await apiClient.post('/sync-push', {
      entityType: 'guardians',
      operation: 'create',
      payload,
    })
    await database.write(async () => {
      await localRecord.update((g) => {
        g.remoteId = data.id
        g.syncStatus = 'synced'
      })
    })
  } else if (item.operation === 'update') {
    if (!localRecord) return

    const remoteId = item.entityRemoteId || localRecord.remoteId
    if (!remoteId) return

    await apiClient.post('/sync-push', {
      entityType: 'guardians',
      operation: 'update',
      payload,
      remoteId,
    })
    await database.write(async () => {
      await localRecord.update((g) => { g.syncStatus = 'synced' })
    })
  } else if (item.operation === 'delete') {
    const remoteId = item.entityRemoteId || localRecord?.remoteId
    if (!remoteId) {
      if (localRecord) {
        await database.write(async () => { await localRecord.destroyPermanently() })
      }
      return
    }

    await apiClient.post('/sync-push', {
      entityType: 'guardians',
      operation: 'delete',
      payload,
      remoteId,
    })
    if (localRecord) {
      await database.write(async () => { await localRecord.destroyPermanently() })
    }
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
