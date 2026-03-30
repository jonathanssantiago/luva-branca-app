import { create } from 'zustand'

export interface SyncBreakdown {
  diaries: number
  documents: number
  audioRecordings: number
  guardians: number
  profiles: number
  emergencyAlerts: number
}

const emptyBreakdown: SyncBreakdown = {
  diaries: 0,
  documents: 0,
  audioRecordings: 0,
  guardians: 0,
  profiles: 0,
  emergencyAlerts: 0,
}

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  failedCount: number
  pendingBreakdown: SyncBreakdown
  failedBreakdown: SyncBreakdown
  lastSyncAt: number
  lastError: string | null
  setOnline: (isOnline: boolean) => void
  setSyncing: (isSyncing: boolean) => void
  setPendingCount: (count: number) => void
  setFailedCount: (count: number) => void
  setPendingBreakdown: (breakdown: SyncBreakdown) => void
  setFailedBreakdown: (breakdown: SyncBreakdown) => void
  setLastSyncAt: (timestamp: number) => void
  setLastError: (error: string | null) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  pendingBreakdown: { ...emptyBreakdown },
  failedBreakdown: { ...emptyBreakdown },
  lastSyncAt: 0,
  lastError: null,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setFailedCount: (failedCount) => set({ failedCount }),
  setPendingBreakdown: (pendingBreakdown) => set({ pendingBreakdown }),
  setFailedBreakdown: (failedBreakdown) => set({ failedBreakdown }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setLastError: (lastError) => set({ lastError }),
}))
