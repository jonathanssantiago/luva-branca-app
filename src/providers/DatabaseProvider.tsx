import React, { useEffect } from 'react'
import { InteractionManager } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import * as SecureStore from 'expo-secure-store'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import { SyncService } from '@/src/services/SyncService'
import { useSyncStore } from '@/src/stores/useSyncStore'
import { subscribeGuardians } from '@/src/stores/observers/guardiansObserver'
import { subscribeDiary } from '@/src/stores/observers/diaryObserver'
import { subscribeProfile } from '@/src/stores/observers/profileObserver'
import { subscribeMedia } from '@/src/stores/observers/mediaObserver'
import { subscribeSyncQueue } from '@/src/stores/observers/syncQueueObserver'
import { subscribeEmergencyAlerts } from '@/src/stores/observers/emergencyAlertsObserver'

const LAST_SYNC_KEY = 'offline_last_sync_at'

interface DatabaseProviderProps {
  children: React.ReactNode
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { user } = useAuth()
  const { setOnline, setLastSyncAt } = useSyncStore()

  useEffect(() => {
    if (!user?.id) return

    const cleanups = [
      subscribeGuardians(user.id),
      subscribeDiary(user.id),
      subscribeProfile(user.id),
      subscribeMedia(user.id),
      subscribeEmergencyAlerts(user.id),
      subscribeSyncQueue(),
    ]

    return () => cleanups.forEach((fn) => fn())
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected)
    })
    return unsubscribe
  }, [setOnline])

  useEffect(() => {
    const stopListener = SyncService.startNetworkListener()
    return stopListener
  }, [])

  // Defer sync pull so the UI can render first
  useEffect(() => {
    if (!user?.id) return

    const userId = user.id
    const handle = InteractionManager.runAfterInteractions(() => {
      ;(async () => {
        try {
          const stored = await SecureStore.getItemAsync(LAST_SYNC_KEY)
          const lastSyncAt = stored ? parseInt(stored, 10) : 0
          await SyncService.pullFromServer(userId, lastSyncAt)
          const now = Date.now()
          await SecureStore.setItemAsync(LAST_SYNC_KEY, String(now))
          setLastSyncAt(now)
        } catch (err) {
          console.warn('DatabaseProvider pull failed:', err)
        }

        SyncService.runPendingSync().catch((err) =>
          console.warn('DatabaseProvider push after pull failed:', err),
        )
      })()
    })

    return () => handle.cancel()
  }, [user?.id, setLastSyncAt])

  return <>{children}</>
}
