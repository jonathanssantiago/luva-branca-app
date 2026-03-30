import { create } from 'zustand'
import { database } from '@/src/database'
import { SafetyDiaryEntry, DiaryEmotion } from '@/src/database/models/SafetyDiaryEntry'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'

export interface CreateDiaryInput {
  title: string
  content: string
  location?: string
  entryDate?: Date
  emotion?: DiaryEmotion
  tags?: string[]
  images?: string[]
  isPrivate?: boolean
}

interface DiaryState {
  entries: SafetyDiaryEntry[]
  loading: boolean
  error: string | null
  setEntries: (entries: SafetyDiaryEntry[]) => void
  createEntry: (input: CreateDiaryInput, userId: string) => Promise<void>
  updateEntry: (localId: string, input: Partial<CreateDiaryInput>) => Promise<void>
  deleteEntry: (localId: string) => Promise<void>
}

export const useDiaryStore = create<DiaryState>((set) => ({
  entries: [],
  loading: false,
  error: null,

  setEntries: (entries) => set({ entries }),

  createEntry: async (input, userId) => {
    set({ loading: true, error: null })
    try {
      await database.write(async () => {
        const now = new Date()
        const record = await database
          .get<SafetyDiaryEntry>('safety_diary_entries')
          .create((e) => {
            e.userId = userId
            e.title = input.title
            e.content = input.content
            e.location = input.location ?? null
            e.entryDate = input.entryDate ?? now
            e.emotion = input.emotion ?? null
            e.isPrivate = input.isPrivate ?? true
            e.syncStatus = 'pending'
            e.isDeleted = false
            ;(e as unknown as Record<string, unknown>)['_raw']['tags'] = JSON.stringify(
              input.tags ?? [],
            )
            ;(e as unknown as Record<string, unknown>)['_raw']['images'] = JSON.stringify(
              input.images ?? [],
            )
          })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'safety_diary_entries'
          q.entityLocalId = record.id
          q.operation = 'create'
          q.payload = JSON.stringify({ ...input, userId })
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar entrada'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateEntry: async (localId, input) => {
    set({ loading: true, error: null })
    try {
      let remoteId: string | null = null
      await database.write(async () => {
        const record = await database
          .get<SafetyDiaryEntry>('safety_diary_entries')
          .find(localId)
        remoteId = record.remoteId
        await record.update((e) => {
          if (input.title !== undefined) e.title = input.title
          if (input.content !== undefined) e.content = input.content
          if (input.location !== undefined) e.location = input.location ?? null
          if (input.entryDate !== undefined) e.entryDate = input.entryDate
          if (input.emotion !== undefined) e.emotion = input.emotion ?? null
          if (input.isPrivate !== undefined) e.isPrivate = input.isPrivate
          if (input.tags !== undefined) {
            ;(e as unknown as Record<string, unknown>)['_raw']['tags'] = JSON.stringify(input.tags)
          }
          if (input.images !== undefined) {
            ;(e as unknown as Record<string, unknown>)['_raw']['images'] = JSON.stringify(
              input.images,
            )
          }
          e.syncStatus = 'pending'
          e.updatedAt = new Date()
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'safety_diary_entries'
          q.entityLocalId = localId
          q.entityRemoteId = remoteId
          q.operation = 'update'
          q.payload = JSON.stringify(input)
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar entrada'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteEntry: async (localId) => {
    set({ loading: true, error: null })
    try {
      let remoteId: string | null = null
      await database.write(async () => {
        const record = await database
          .get<SafetyDiaryEntry>('safety_diary_entries')
          .find(localId)
        remoteId = record.remoteId
        await record.update((e) => {
          e.isDeleted = true
          e.syncStatus = 'pending'
          e.updatedAt = new Date()
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'safety_diary_entries'
          q.entityLocalId = localId
          q.entityRemoteId = remoteId
          q.operation = 'delete'
          q.payload = JSON.stringify({ id: remoteId })
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar entrada'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
