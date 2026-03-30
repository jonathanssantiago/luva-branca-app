import { Q } from '@nozbe/watermelondb'
import { Subscription } from 'rxjs'
import { database } from '@/src/database'
import { EmergencyAlert } from '@/src/database/models/EmergencyAlert'
import { useEmergencyAlertsStore } from '../useEmergencyAlertsStore'

export function subscribeEmergencyAlerts(userId: string): () => void {
  const subscription: Subscription = database
    .get<EmergencyAlert>('emergency_alerts')
    .query(
      Q.where('user_id', userId),
      Q.sortBy('created_at', Q.desc),
    )
    .observe()
    .subscribe((alerts) => {
      useEmergencyAlertsStore.getState().setEmergencyAlerts(alerts)
    })

  return () => subscription.unsubscribe()
}
