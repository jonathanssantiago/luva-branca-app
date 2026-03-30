import { Q } from '@nozbe/watermelondb'
import { Subscription } from 'rxjs'
import { database } from '@/src/database'
import { Guardian } from '@/src/database/models/Guardian'
import { useGuardiansStore } from '../useGuardiansStore'

export function subscribeGuardians(userId: string): () => void {
  const subscription: Subscription = database
    .get<Guardian>('guardians')
    .query(Q.where('user_id', userId), Q.where('is_deleted', false))
    .observe()
    .subscribe((guardians) => {
      useGuardiansStore.getState().setGuardians(guardians)
    })

  return () => subscription.unsubscribe()
}
