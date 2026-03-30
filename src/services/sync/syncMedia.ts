import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase'
import { database } from '@/src/database'
import { AudioRecording } from '@/src/database/models/AudioRecording'
import { Document } from '@/src/database/models/Document'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

function decodeBase64(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function uploadLocalFileToStorage(
  localUri: string,
  bucket: string,
  storagePath: string,
  contentType: string,
): Promise<string | null> {
  const fileInfo = await FileSystem.getInfoAsync(localUri)
  if (!fileInfo.exists) return null

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, decodeBase64(base64), {
      contentType,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
      const { data: urlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 604800)
      return urlData?.signedUrl ?? storagePath
    }
    throw error
  }

  const { data: urlData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 604800)

  return urlData?.signedUrl ?? storagePath
}

async function findLocalAudio(localId: string): Promise<AudioRecording | null> {
  try {
    return await database.get<AudioRecording>('audio_recordings').find(localId)
  } catch {
    return null
  }
}

async function findLocalDocument(localId: string): Promise<Document | null> {
  try {
    return await database.get<Document>('documents').find(localId)
  } catch {
    return null
  }
}

export async function syncAudioRecordingItem(item: SyncQueueItem): Promise<void> {
  const payload = { ...item.parsedPayload }
  const localRecord = await findLocalAudio(item.entityLocalId)

  if (item.operation === 'create') {
    if (!localRecord || localRecord.isDeleted) return

    if (!payload.remote_url && localRecord.localUri) {
      const storagePath = `${payload.user_id}/${localRecord.filename}`
      const signedUrl = await uploadLocalFileToStorage(
        localRecord.localUri,
        'audios',
        storagePath,
        'audio/mp4',
      )
      if (signedUrl) {
        payload.remote_url = signedUrl
      }
    }

    const { data } = await apiClient.post('/sync-push', {
      entityType: 'audio-recordings',
      operation: 'create',
      payload,
    })
    await database.write(async () => {
      await localRecord.update((r) => {
        r.remoteId = data.id
        r.remoteUrl = data.remote_url ?? payload.remote_url ?? null
        r.syncStatus = 'synced'
      })
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
      entityType: 'audio-recordings',
      operation: 'delete',
      payload,
      remoteId,
    })
    if (localRecord) {
      await database.write(async () => { await localRecord.destroyPermanently() })
    }
  }
}

export async function syncDocumentItem(item: SyncQueueItem): Promise<void> {
  const payload = { ...item.parsedPayload }
  const localRecord = await findLocalDocument(item.entityLocalId)

  if (item.operation === 'create') {
    if (!localRecord || localRecord.isDeleted) return

    if (!payload.remote_url && localRecord.localUri) {
      const storagePath = `${payload.user_id}/${localRecord.filename}`
      const signedUrl = await uploadLocalFileToStorage(
        localRecord.localUri,
        'documentos',
        storagePath,
        (localRecord.mimeType as string) || 'application/octet-stream',
      )
      if (signedUrl) {
        payload.remote_url = signedUrl
      }
    }

    const { data } = await apiClient.post('/sync-push', {
      entityType: 'documents',
      operation: 'create',
      payload,
    })
    await database.write(async () => {
      await localRecord.update((d) => {
        d.remoteId = data.id
        d.remoteUrl = data.remote_url ?? payload.remote_url ?? null
        d.syncStatus = 'synced'
      })
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
      entityType: 'documents',
      operation: 'delete',
      payload,
      remoteId,
    })
    if (localRecord) {
      await database.write(async () => { await localRecord.destroyPermanently() })
    }
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
        r.userId     = userId
        r.remoteId   = serverRecord.id as string
        r.filename   = serverRecord.filename as string
        r.remoteUrl  = (serverRecord.remote_url as string) ?? null
        r.duration   = (serverRecord.duration as number)  ?? 0
        r.syncStatus = 'synced'
        r.isDeleted  = false
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
        d.userId     = userId
        d.remoteId   = serverRecord.id as string
        d.filename   = serverRecord.filename as string
        d.remoteUrl  = (serverRecord.remote_url as string) ?? null
        d.mimeType   = serverRecord.mime_type as string
        d.size       = (serverRecord.size as number) ?? 0
        d.syncStatus = 'synced'
        d.isDeleted  = false
      })
    })
  }
}
