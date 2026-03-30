import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase'
import { database } from '@/src/database'
import { SafetyDiaryEntry } from '@/src/database/models/SafetyDiaryEntry'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

async function uploadLocalDiaryImages(
  images: unknown[],
  userId: string,
): Promise<string[]> {
  const result: string[] = []
  for (const img of images) {
    const uri = String(img)
    if (!uri.startsWith('file://') && !uri.startsWith(FileSystem.documentDirectory ?? '__none__')) {
      result.push(uri)
      continue
    }
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        result.push(uri)
        continue
      }
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      const timestamp = Date.now()
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${userId}/temp/diary_${timestamp}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('diary-photos')
        .upload(filePath, bytes, {
          contentType: `image/${fileExt}`,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { data: urlData, error: urlError } = await supabase.storage
        .from('diary-photos')
        .createSignedUrl(filePath, 3600 * 24 * 7)
      if (urlError) throw urlError

      result.push(urlData.signedUrl)
    } catch (err) {
      console.warn('[syncDiary] Failed to upload local image, keeping URI:', err)
      result.push(uri)
    }
  }
  return result
}

export async function syncDiaryItem(item: SyncQueueItem): Promise<void> {
  const payload = { ...item.parsedPayload }

  if (item.operation === 'create' || item.operation === 'update') {
    if (Array.isArray(payload.images) && payload.images.length > 0) {
      const userId = (payload.user_id as string) || ''
      if (userId) {
        payload.images = await uploadLocalDiaryImages(payload.images, userId)
      }
    }
  }

  if (item.operation === 'create') {
    const { data } = await apiClient.post('/sync-push', {
      entityType: 'diary-entries',
      operation: 'create',
      payload,
    })
    await database.write(async () => {
      const record = await database
        .get<SafetyDiaryEntry>('safety_diary_entries')
        .find(item.entityLocalId)
      await record.update((e) => {
        e.remoteId = data.id
        e.syncStatus = 'synced'
        if (Array.isArray(payload.images)) {
          const raw = (e as unknown as Record<string, Record<string, unknown>>)['_raw']
          raw['images'] = JSON.stringify(payload.images)
        }
      })
    })
  } else if (item.operation === 'update') {
    await apiClient.post('/sync-push', {
      entityType: 'diary-entries',
      operation: 'update',
      payload,
      remoteId: item.entityRemoteId,
    })
    await database.write(async () => {
      const record = await database
        .get<SafetyDiaryEntry>('safety_diary_entries')
        .find(item.entityLocalId)
      await record.update((e) => {
        e.syncStatus = 'synced'
        if (Array.isArray(payload.images)) {
          const raw = (e as unknown as Record<string, Record<string, unknown>>)['_raw']
          raw['images'] = JSON.stringify(payload.images)
        }
      })
    })
  } else if (item.operation === 'delete') {
    await apiClient.post('/sync-push', {
      entityType: 'diary-entries',
      operation: 'delete',
      payload,
      remoteId: item.entityRemoteId,
    })
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
      await existing.update((e) => { e.syncStatus = 'synced' })
    } else {
      await collection.create((e) => {
        e.userId    = userId
        e.remoteId  = serverRecord.id as string
        e.title     = serverRecord.title as string
        e.content   = serverRecord.content as string
        e.location  = (serverRecord.location as string) ?? null
        e.entryDate = new Date(serverRecord.entry_date as string)
        e.emotion   = (serverRecord.emotion as SafetyDiaryEntry['emotion']) ?? null
        e.isPrivate = serverRecord.is_private as boolean
        e.syncStatus = 'synced'
        e.isDeleted = false
        const raw = (e as unknown as Record<string, Record<string, unknown>>)['_raw']
        raw['tags']   = JSON.stringify(serverRecord.tags   ?? [])
        raw['images'] = JSON.stringify(serverRecord.images ?? [])
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
    await database.write(async () => { await existing.destroyPermanently() })
  }
}
