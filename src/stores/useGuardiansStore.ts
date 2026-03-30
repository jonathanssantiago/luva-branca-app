import { create } from 'zustand'
import { database } from '@/src/database'
import { Guardian } from '@/src/database/models/Guardian'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'

interface AddGuardianInput {
  name: string
  phone: string
  relationship: string
}

function guardianInputToSnakeCase(
  input: Partial<AddGuardianInput & { isActive: boolean }>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (input.name !== undefined) result.name = input.name
  if (input.phone !== undefined) result.phone = input.phone
  if (input.relationship !== undefined) result.relationship = input.relationship
  if (input.isActive !== undefined) result.is_active = input.isActive
  return result
}

interface GuardiansState {
  guardians: Guardian[]
  loading: boolean
  error: string | null
  setGuardians: (guardians: Guardian[]) => void
  addGuardian: (input: AddGuardianInput, userId: string) => Promise<void>
  updateGuardian: (
    localId: string,
    input: Partial<AddGuardianInput & { isActive: boolean }>,
  ) => Promise<void>
  removeGuardian: (localId: string) => Promise<void>
}

export const useGuardiansStore = create<GuardiansState>((set) => ({
  guardians: [],
  loading: false,
  error: null,

  setGuardians: (guardians) => set({ guardians }),

  addGuardian: async (input, userId) => {
    set({ loading: true, error: null })
    try {
      await database.write(async () => {
        const record = await database.get<Guardian>('guardians').create((g) => {
          g.userId = userId
          g.name = input.name
          g.phone = input.phone
          g.relationship = input.relationship
          g.isActive = true
          g.syncStatus = 'pending'
          g.isDeleted = false
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'guardians'
          q.entityLocalId = record.id
          q.operation = 'create'
          q.payload = JSON.stringify({
            name: input.name,
            phone: input.phone,
            relationship: input.relationship,
            is_active: true,
            user_id: userId,
          })
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar guardião'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateGuardian: async (localId, input) => {
    set({ loading: true, error: null })
    try {
      let remoteId: string | null = null
      await database.write(async () => {
        const record = await database.get<Guardian>('guardians').find(localId)
        remoteId = record.remoteId
        await record.update((g) => {
          if (input.name !== undefined) g.name = input.name
          if (input.phone !== undefined) g.phone = input.phone
          if (input.relationship !== undefined) g.relationship = input.relationship
          if (input.isActive !== undefined) g.isActive = input.isActive
          g.syncStatus = 'pending'
          g.updatedAt = new Date()
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'guardians'
          q.entityLocalId = localId
          q.entityRemoteId = remoteId
          q.operation = 'update'
          q.payload = JSON.stringify(guardianInputToSnakeCase(input))
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar guardião'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  removeGuardian: async (localId) => {
    set({ loading: true, error: null })
    try {
      let remoteId: string | null = null
      await database.write(async () => {
        const record = await database.get<Guardian>('guardians').find(localId)
        remoteId = record.remoteId
        await record.update((g) => {
          g.isDeleted = true
          g.syncStatus = 'pending'
          g.updatedAt = new Date()
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'guardians'
          q.entityLocalId = localId
          q.entityRemoteId = remoteId
          q.operation = 'delete'
          q.payload = JSON.stringify({ id: remoteId })
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao remover guardião'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
