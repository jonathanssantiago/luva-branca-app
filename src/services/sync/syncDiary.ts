import { database } from '@/src/database'
import { SafetyDiaryEntry } from '@/src/database/models/SafetyDiaryEntry'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

export async function syncDiaryItem(item: SyncQueueItem): Promise<void> {
  const payload = item.parsedPayload

  if (item.operation === 'create') {
    const { data } = await apiClient.post('/diary-entries', payload)
    await database.write(async () => {
      const record = await database
        .get<SafetyDiaryEntry>('safety_diary_entries')
        .find(item.entityLocalId)
      await record.update((e) => {
        e.remoteId = data.id
        e.syncStatus = 'synced'
      })
    })
  } else if (item.operation === 'update') {
    await apiClient.patch(`/diary-entries/${item.entityRemoteId}`, payload)
    await database.write(async () => {
      const record = await database
        .get<SafetyDiaryEntry>('safety_diary_entries')
        .find(item.entityLocalId)
      await record.update((e) => {
        e.syncStatus = 'synced'
      })
    })
  } else if (item.operation === 'delete') {
    await apiClient.delete(`/diary-entries/${item.entityRemoteId}`)
    await database.write(async () => {
      const record = await database
        .get<SafetyDiaryEntry>('safety_diary_entries')
        .find(item.entityLocalId)
      await record.destroyPermanently()
    })
  }
}

export async function upsertDiaryEntryFromServer(
  serverRecord: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const collection = database.get<SafetyDiaryEntry>('safety_diary_entries')
  const existing = await collection
    .query()
    .fetch()
    .then((all) => all.find((e) => e.remoteId === serverRecord.id))

  await database.write(async () => {
    if (existing) {
      // Client always wins for diary — skip server overwrite
      await existing.update((e) => {
        e.syncStatus = 'synced'
      })
    } else {
      await collection.create((e) => {
        e.userId = userId
        e.remoteId = serverRecord.id as string
        e.title = serverRecord.title as string
        e.content = serverRecord.content as string
        e.location = (serverRecord.location as string) ?? null
        e.entryDate = new Date(serverRecord.entry_date as string)
        e.emotion = (serverRecord.emotion as SafetyDiaryEntry['emotion']) ?? null
        e.isPrivate = serverRecord.is_private as boolean
        e.syncStatus = 'synced'
        e.isDeleted = false
        ;(e as unknown as Record<string, unknown>)['_raw']['tags'] = JSON.stringify(
          serverRecord.tags ?? [],
        )
        ;(e as unknown as Record<string, unknown>)['_raw']['images'] = JSON.stringify(
          serverRecord.images ?? [],
        )
      })
    }
  })
}

export async function deleteDiaryEntryFromServer(remoteId: string): Promise<void> {
  const collection = database.get<SafetyDiaryEntry>('safety_diary_entries')
  const existing = await collection
    .query()
    .fetch()
    .then((all) => all.find((e) => e.remoteId === remoteId))

  if (existing) {
    await database.write(async () => {
      await existing.destroyPermanently()
    })
  }
}
