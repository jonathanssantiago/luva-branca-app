import { Q } from '@nozbe/watermelondb'
import { Subscription } from 'rxjs'
import { database } from '@/src/database'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { useSyncStore, SyncBreakdown } from '../useSyncStore'
import { SyncService } from '@/src/services/SyncService'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
const SYNC_DEBOUNCE_MS = 2000

function buildBreakdown(items: SyncQueueItem[]): SyncBreakdown {
  const b: SyncBreakdown = {
    diaries: 0,
    documents: 0,
    audioRecordings: 0,
    guardians: 0,
    profiles: 0,
    emergencyAlerts: 0,
  }
  for (const item of items) {
    switch (item.entityType) {
      case 'safety_diary_entries': b.diaries++; break
      case 'documents': b.documents++; break
      case 'audio_recordings': b.audioRecordings++; break
      case 'guardians': b.guardians++; break
      case 'profiles': b.profiles++; break
      case 'emergency_alerts': b.emergencyAlerts++; break
    }
  }
  return b
}

export function subscribeSyncQueue(): () => void {
  const pendingSub: Subscription = database
    .get<SyncQueueItem>('sync_queue')
    .query(Q.where('status', Q.oneOf(['pending', 'processing'])))
    .observe()
    .subscribe((items) => {
      const store = useSyncStore.getState()
      store.setPendingCount(items.length)
      store.setPendingBreakdown(buildBreakdown(items))

      if (items.length > 0) {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          SyncService.runPendingSync().catch((err) =>
            console.warn('[syncQueueObserver] runPendingSync error:', err),
          )
        }, SYNC_DEBOUNCE_MS)
      }
    })

  const failedSub: Subscription = database
    .get<SyncQueueItem>('sync_queue')
    .query(Q.where('status', 'failed'))
    .observe()
    .subscribe((items) => {
      const store = useSyncStore.getState()
      store.setFailedCount(items.length)
      store.setFailedBreakdown(buildBreakdown(items))
    })

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    pendingSub.unsubscribe()
    failedSub.unsubscribe()
  }
}
