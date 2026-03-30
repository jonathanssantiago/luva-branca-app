import NetInfo from '@react-native-community/netinfo'
import { Mutex } from 'async-mutex'
import { Q } from '@nozbe/watermelondb'

import { database } from '@/src/database'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from './ApiClient'
import { syncGuardianItem, upsertGuardianFromServer, deleteGuardianFromServer } from './sync/syncGuardians'
import { syncDiaryItem, upsertDiaryEntryFromServer, deleteDiaryEntryFromServer } from './sync/syncDiary'
import { syncProfileItem, upsertProfileFromServer } from './sync/syncProfile'
import {
  syncAudioRecordingItem,
  syncDocumentItem,
  upsertAudioRecordingFromServer,
  upsertDocumentFromServer,
} from './sync/syncMedia'
import { syncEmergencyAlertItem } from './sync/syncEmergencyAlerts'

const MAX_ATTEMPTS = 5
const mutex = new Mutex()

function backoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 60_000)
}

async function shouldRetry(item: SyncQueueItem): Promise<boolean> {
  if (item.attempts >= MAX_ATTEMPTS) return false
  if (!item.lastAttemptedAt) return true
  const elapsed = Date.now() - item.lastAttemptedAt.getTime()
  return elapsed >= backoffDelay(item.attempts)
}

async function processSingleItem(item: SyncQueueItem): Promise<void> {
  await database.write(async () => {
    await item.update((i) => {
      i.status = 'processing'
      i.attempts = i.attempts + 1
      i.lastAttemptedAt = new Date()
    })
  })

  try {
    switch (item.entityType) {
      case 'guardians':
        await syncGuardianItem(item)
        break
      case 'safety_diary_entries':
        await syncDiaryItem(item)
        break
      case 'profiles':
        await syncProfileItem(item)
        break
      case 'audio_recordings':
        await syncAudioRecordingItem(item)
        break
      case 'documents':
        await syncDocumentItem(item)
        break
      case 'emergency_alerts':
        await syncEmergencyAlertItem(item)
        break
      default:
        throw new Error(`Unknown entity type: ${item.entityType}`)
    }

    await database.write(async () => {
      await item.update((i) => {
        i.status = 'done'
        i.errorMessage = null
      })
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await database.write(async () => {
      await item.update((i) => {
        i.status = item.attempts >= MAX_ATTEMPTS ? 'failed' : 'pending'
        i.errorMessage = message
      })
    })
    throw error
  }
}

export interface PullSyncResponse {
  serverTime: number
  guardians?: Record<string, unknown>[]
  diary_entries?: Record<string, unknown>[]
  audio_recordings?: Record<string, unknown>[]
  documents?: Record<string, unknown>[]
  deleted_ids?: {
    guardians?: string[]
    diary_entries?: string[]
    audio_recordings?: string[]
    documents?: string[]
  }
}

export const SyncService = {
  async runPendingSync(): Promise<void> {
    const state = await NetInfo.fetch()
    if (!state.isConnected) return

    await mutex.runExclusive(async () => {
      const pendingItems = await database
        .get<SyncQueueItem>('sync_queue')
        .query(
          Q.where('status', Q.oneOf(['pending', 'failed'])),
          Q.sortBy('created_at', Q.asc),
        )
        .fetch()

      for (const item of pendingItems) {
        if (await shouldRetry(item)) {
          try {
            await processSingleItem(item)
          } catch {
            // Error already recorded; continue with next item
          }
        }
      }
    })
  },

  async pullFromServer(userId: string, lastSyncAt: number): Promise<void> {
    const state = await NetInfo.fetch()
    if (!state.isConnected) return

    const { data } = await apiClient.get<PullSyncResponse>('/sync-pull', {
      params: { since: lastSyncAt },
    })

    for (const record of data.guardians ?? []) {
      await upsertGuardianFromServer(record, userId)
    }
    for (const record of data.diary_entries ?? []) {
      await upsertDiaryEntryFromServer(record, userId)
    }
    for (const record of data.audio_recordings ?? []) {
      await upsertAudioRecordingFromServer(record, userId)
    }
    for (const record of data.documents ?? []) {
      await upsertDocumentFromServer(record, userId)
    }

    for (const remoteId of data.deleted_ids?.guardians ?? []) {
      await deleteGuardianFromServer(remoteId)
    }
    for (const remoteId of data.deleted_ids?.diary_entries ?? []) {
      await deleteDiaryEntryFromServer(remoteId)
    }

    // Perfil incluso na resposta do sync-pull
    if ((data as PullSyncResponse & { profile?: Record<string, unknown> }).profile) {
      await upsertProfileFromServer(
        (data as PullSyncResponse & { profile?: Record<string, unknown> }).profile!,
        userId,
      )
    }
  },

  startNetworkListener(): () => void {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        SyncService.runPendingSync().catch((err) =>
          console.warn('[SyncService] runPendingSync error:', err),
        )
      }
    })
    return unsubscribe
  },
}
