import { Q } from '@nozbe/watermelondb'
import { Subscription } from 'rxjs'
import { database } from '@/src/database'
import { Profile } from '@/src/database/models/Profile'
import { useProfileStore } from '../useProfileStore'

export function subscribeProfile(userId: string): () => void {
  const subscription: Subscription = database
    .get<Profile>('profiles')
    .query(Q.where('user_id', userId))
    .observe()
    .subscribe((profiles) => {
      useProfileStore.getState().setProfile(profiles[0] ?? null)
    })

  return () => subscription.unsubscribe()
}
