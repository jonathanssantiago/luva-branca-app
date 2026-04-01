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
  deleteAudioRecordingFromServer,
  deleteDocumentFromServer,
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

const ENTITY_TABLE_MAP: Record<string, string> = {
  safety_diary_entries: 'safety_diary_entries',
  audio_recordings: 'audio_recordings',
  documents: 'documents',
  guardians: 'guardians',
  profiles: 'profiles',
  emergency_alerts: 'emergency_alerts',
}

async function cleanOrphanedQueueItems(): Promise<void> {
  const staleItems = await database
    .get<SyncQueueItem>('sync_queue')
    .query(Q.where('status', Q.oneOf(['pending', 'failed', 'processing'])))
    .fetch()

  const toRemove: SyncQueueItem[] = []

  for (const item of staleItems) {
    if (!item.entityLocalId) {
      toRemove.push(item)
      continue
    }

    const tableName = ENTITY_TABLE_MAP[item.entityType]

    if (!tableName) {
      toRemove.push(item)
      continue
    }

    if (item.operation === 'delete') {
      let hasRemoteId = !!item.entityRemoteId
      if (!hasRemoteId) {
        try {
          const record = await database.get(tableName).find(item.entityLocalId)
          hasRemoteId = !!(record as any).remoteId
        } catch {
          // Record doesn't exist locally either
        }
      }
      if (!hasRemoteId) {
        toRemove.push(item)
      }
      continue
    }

    try {
      const record = await database.get(tableName).find(item.entityLocalId)
      if ('isDeleted' in record && (record as any).isDeleted) {
        toRemove.push(item)
      }
    } catch {
      toRemove.push(item)
    }
  }

  if (toRemove.length > 0) {
    await database.write(async () => {
      for (const item of toRemove) {
        await item.update((i) => {
          i.status = 'done'
          i.errorMessage = 'Orphaned: local record no longer exists'
        })
      }
    })
    console.log(`[SyncService] Cleaned ${toRemove.length} orphaned queue items`)
  }

  // Clean up ghost records: soft-deleted locally with no remoteId and no pending sync
  const ghostTables = ['audio_recordings', 'documents', 'guardians', 'safety_diary_entries']
  let ghostCount = 0
  for (const table of ghostTables) {
    const deletedRecords = await database
      .get(table)
      .query(Q.where('is_deleted', true))
      .fetch()
    for (const record of deletedRecords) {
      if (!(record as any).remoteId) {
        const activeItems = await database
          .get<SyncQueueItem>('sync_queue')
          .query(
            Q.where('entity_local_id', record.id),
            Q.where('status', Q.oneOf(['pending', 'failed', 'processing'])),
          )
          .fetchCount()
        if (activeItems === 0) {
          await database.write(async () => { await record.destroyPermanently() })
          ghostCount++
        }
      }
    }
  }
  if (ghostCount > 0) {
    console.log(`[SyncService] Cleaned ${ghostCount} ghost records`)
  }
}

async function purgeCompletedItems(): Promise<void> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
  const doneItems = await database
    .get<SyncQueueItem>('sync_queue')
    .query(Q.where('status', 'done'), Q.where('updated_at', Q.lt(cutoff)))
    .fetch()

  if (doneItems.length > 0) {
    await database.write(async () => {
      for (const item of doneItems) {
        await item.destroyPermanently()
      }
    })
    console.log(`[SyncService] Purged ${doneItems.length} completed queue items`)
  }
}

export const SyncService = {
  async runPendingSync(): Promise<void> {
    const state = await NetInfo.fetch()
    if (!state.isConnected) return

    const { useSyncStore } = await import('@/src/stores/useSyncStore')
    useSyncStore.getState().setSyncing(true)

    try {
      await mutex.runExclusive(async () => {
        await cleanOrphanedQueueItems()

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

        await purgeCompletedItems()
      })
    } finally {
      useSyncStore.getState().setSyncing(false)
    }
  },

  async retryAllFailed(): Promise<void> {
    const failedItems = await database
      .get<SyncQueueItem>('sync_queue')
      .query(Q.where('status', 'failed'))
      .fetch()

    if (failedItems.length === 0) return

    await database.write(async () => {
      for (const item of failedItems) {
        await item.update((i) => {
          i.status = 'pending'
          i.attempts = 0
          i.errorMessage = null
          i.lastAttemptedAt = null
        })
      }
    })

    await SyncService.runPendingSync()
  },

  async getFailedCount(): Promise<number> {
    return database
      .get<SyncQueueItem>('sync_queue')
      .query(Q.where('status', 'failed'))
      .fetchCount()
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
    for (const remoteId of data.deleted_ids?.audio_recordings ?? []) {
      await deleteAudioRecordingFromServer(remoteId)
    }
    for (const remoteId of data.deleted_ids?.documents ?? []) {
      await deleteDocumentFromServer(remoteId)
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
