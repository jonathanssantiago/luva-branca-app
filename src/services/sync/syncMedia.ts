import { database } from '@/src/database'
import { AudioRecording } from '@/src/database/models/AudioRecording'
import { Document } from '@/src/database/models/Document'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

export async function syncAudioRecordingItem(item: SyncQueueItem): Promise<void> {
  const payload = item.parsedPayload

  if (item.operation === 'create') {
    const { data } = await apiClient.post('/audio-recordings', payload)
    await database.write(async () => {
      const record = await database
        .get<AudioRecording>('audio_recordings')
        .find(item.entityLocalId)
      await record.update((r) => {
        r.remoteId = data.id
        r.remoteUrl = data.remote_url ?? null
        r.syncStatus = 'synced'
      })
    })
  } else if (item.operation === 'delete') {
    await apiClient.delete(`/audio-recordings/${item.entityRemoteId}`)
    await database.write(async () => {
      const record = await database
        .get<AudioRecording>('audio_recordings')
        .find(item.entityLocalId)
      await record.destroyPermanently()
    })
  }
}

export async function syncDocumentItem(item: SyncQueueItem): Promise<void> {
  const payload = item.parsedPayload

  if (item.operation === 'create') {
    const { data } = await apiClient.post('/documents', payload)
    await database.write(async () => {
      const record = await database
        .get<Document>('documents')
        .find(item.entityLocalId)
      await record.update((d) => {
        d.remoteId = data.id
        d.remoteUrl = data.remote_url ?? null
        d.syncStatus = 'synced'
      })
    })
  } else if (item.operation === 'delete') {
    await apiClient.delete(`/documents/${item.entityRemoteId}`)
    await database.write(async () => {
      const record = await database
        .get<Document>('documents')
        .find(item.entityLocalId)
      await record.destroyPermanently()
    })
  }
}

export async function upsertAudioRecordingFromServer(
  serverRecord: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const collection = database.get<AudioRecording>('audio_recordings')
  const existing = await collection
    .query()
    .fetch()
    .then((all) => all.find((r) => r.remoteId === serverRecord.id))

  if (!existing) {
    await database.write(async () => {
      await collection.create((r) => {
        r.userId = userId
        r.remoteId = serverRecord.id as string
        r.filename = serverRecord.filename as string
        r.remoteUrl = (serverRecord.remote_url as string) ?? null
        r.duration = (serverRecord.duration as number) ?? 0
        r.syncStatus = 'synced'
        r.isDeleted = false
      })
    })
  }
}

export async function upsertDocumentFromServer(
  serverRecord: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const collection = database.get<Document>('documents')
  const existing = await collection
    .query()
    .fetch()
    .then((all) => all.find((d) => d.remoteId === serverRecord.id))

  if (!existing) {
    await database.write(async () => {
      await collection.create((d) => {
        d.userId = userId
        d.remoteId = serverRecord.id as string
        d.filename = serverRecord.filename as string
        d.remoteUrl = (serverRecord.remote_url as string) ?? null
        d.mimeType = serverRecord.mime_type as string
        d.size = (serverRecord.size as number) ?? 0
        d.syncStatus = 'synced'
        d.isDeleted = false
      })
    })
  }
}
