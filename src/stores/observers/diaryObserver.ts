import { Q } from '@nozbe/watermelondb'
import { Subscription } from 'rxjs'
import { database } from '@/src/database'
import { SafetyDiaryEntry } from '@/src/database/models/SafetyDiaryEntry'
import { useDiaryStore } from '../useDiaryStore'

export function subscribeDiary(userId: string): () => void {
  const subscription: Subscription = database
    .get<SafetyDiaryEntry>('safety_diary_entries')
    .query(
      Q.where('user_id', userId),
      Q.where('is_deleted', false),
      Q.sortBy('entry_date', Q.desc),
    )
    .observe()
    .subscribe((entries) => {
      useDiaryStore.getState().setEntries(entries)
    })

  return () => subscription.unsubscribe()
}
