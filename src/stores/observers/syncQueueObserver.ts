import { Q } from '@nozbe/watermelondb'
import { Subscription } from 'rxjs'
import { database } from '@/src/database'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { useSyncStore } from '../useSyncStore'

export function subscribeSyncQueue(): () => void {
  const subscription: Subscription = database
    .get<SyncQueueItem>('sync_queue')
    .query(Q.where('status', Q.oneOf(['pending', 'processing', 'failed'])))
    .observeCount()
    .subscribe((count) => {
      useSyncStore.getState().setPendingCount(count)
    })

  return () => subscription.unsubscribe()
}
