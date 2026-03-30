import React, { useEffect } from 'react'
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

  // Mount observers when user is authenticated
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

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected)
    })
    return unsubscribe
  }, [setOnline])

  // Start sync listener (push queue when online)
  useEffect(() => {
    const stopListener = SyncService.startNetworkListener()
    return stopListener
  }, [])

  // Pull from server on login
  useEffect(() => {
    if (!user?.id) return

    async function pullOnLogin() {
      try {
        const stored = await SecureStore.getItemAsync(LAST_SYNC_KEY)
        const lastSyncAt = stored ? parseInt(stored, 10) : 0
        await SyncService.pullFromServer(user!.id, lastSyncAt)
        const now = Date.now()
        await SecureStore.setItemAsync(LAST_SYNC_KEY, String(now))
        setLastSyncAt(now)
      } catch (err) {
        console.warn('[DatabaseProvider] Pull failed:', err)
      }

      SyncService.runPendingSync().catch((err) =>
        console.warn('[DatabaseProvider] Push after pull failed:', err),
      )
    }

    pullOnLogin()
  }, [user?.id, setLastSyncAt])

  return <>{children}</>
}
