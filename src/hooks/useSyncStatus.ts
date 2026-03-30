import { useCallback, useMemo } from 'react'
import { useSyncStore, SyncBreakdown } from '@/src/stores/useSyncStore'
import { SyncService } from '@/src/services/SyncService'

const ENTITY_LABELS: Record<keyof SyncBreakdown, string> = {
  diaries: 'diário(s)',
  documents: 'documento(s)',
  audioRecordings: 'áudio(s)',
  guardians: 'guardião(ões)',
  profiles: 'perfil',
  emergencyAlerts: 'alerta(s)',
}

function formatBreakdown(breakdown: SyncBreakdown): string {
  const parts: string[] = []
  for (const [key, count] of Object.entries(breakdown)) {
    if (count > 0) {
      parts.push(`${count} ${ENTITY_LABELS[key as keyof SyncBreakdown]}`)
    }
  }
  return parts.join(', ')
}

export function useSyncStatus() {
  const isOnline = useSyncStore((s) => s.isOnline)
  const isSyncing = useSyncStore((s) => s.isSyncing)
  const pendingCount = useSyncStore((s) => s.pendingCount)
  const failedCount = useSyncStore((s) => s.failedCount)
  const pendingBreakdown = useSyncStore((s) => s.pendingBreakdown)
  const failedBreakdown = useSyncStore((s) => s.failedBreakdown)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)
  const lastError = useSyncStore((s) => s.lastError)

  const hasPendingData = pendingCount > 0 || failedCount > 0

  const pendingSummary = useMemo(() => formatBreakdown(pendingBreakdown), [pendingBreakdown])
  const failedSummary = useMemo(() => formatBreakdown(failedBreakdown), [failedBreakdown])

  const retrySyncNow = useCallback(async () => {
    await SyncService.runPendingSync()
  }, [])

  const retryFailed = useCallback(async () => {
    await SyncService.retryAllFailed()
  }, [])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    pendingBreakdown,
    failedBreakdown,
    pendingSummary,
    failedSummary,
    lastSyncAt,
    lastError,
    hasPendingData,
    retrySyncNow,
    retryFailed,
  }
}
