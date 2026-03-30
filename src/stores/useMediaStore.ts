import { create } from 'zustand'
import { database } from '@/src/database'
import { AudioRecording } from '@/src/database/models/AudioRecording'
import { Document } from '@/src/database/models/Document'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'

interface AddAudioInput {
  filename: string
  localUri: string
  duration: number
  remoteUrl?: string | null
}

interface AddDocumentInput {
  filename: string
  localUri: string
  mimeType: string
  size: number
  remoteUrl?: string | null
}

interface MediaState {
  audioRecordings: AudioRecording[]
  documents: Document[]
  loading: boolean
  error: string | null
  setAudioRecordings: (recordings: AudioRecording[]) => void
  setDocuments: (documents: Document[]) => void
  addAudioRecording: (input: AddAudioInput, userId: string) => Promise<void>
  removeAudioRecording: (localId: string) => Promise<void>
  addDocument: (input: AddDocumentInput, userId: string) => Promise<void>
  removeDocument: (localId: string) => Promise<void>
}

export const useMediaStore = create<MediaState>((set) => ({
  audioRecordings: [],
  documents: [],
  loading: false,
  error: null,

  setAudioRecordings: (audioRecordings) => set({ audioRecordings }),
  setDocuments: (documents) => set({ documents }),

  addAudioRecording: async (input, userId) => {
    set({ loading: true, error: null })
    try {
      await database.write(async () => {
        const record = await database.get<AudioRecording>('audio_recordings').create((r) => {
          r.userId = userId
          r.filename = input.filename
          r.localUri = input.localUri
          r.remoteUrl = input.remoteUrl ?? null
          r.duration = input.duration
          r.syncStatus = 'pending'
          r.isDeleted = false
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'audio_recordings'
          q.entityLocalId = record.id
          q.operation = 'create'
          q.payload = JSON.stringify({
            user_id: userId,
            filename: input.filename,
            remote_url: input.remoteUrl ?? null,
            duration: input.duration,
          })
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar áudio'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  removeAudioRecording: async (localId) => {
    set({ loading: true, error: null })
    try {
      let remoteId: string | null = null
      await database.write(async () => {
        const record = await database.get<AudioRecording>('audio_recordings').find(localId)
        remoteId = record.remoteId
        await record.update((r) => {
          r.isDeleted = true
          r.syncStatus = 'pending'
          r.updatedAt = new Date()
        })

        if (remoteId) {
          await database.get<SyncQueueItem>('sync_queue').create((q) => {
            q.entityType = 'audio_recordings'
            q.entityLocalId = localId
            q.entityRemoteId = remoteId
            q.operation = 'delete'
            q.payload = JSON.stringify({ id: remoteId })
            q.status = 'pending'
            q.attempts = 0
          })
        }
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao remover áudio'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  addDocument: async (input, userId) => {
    set({ loading: true, error: null })
    try {
      await database.write(async () => {
        const record = await database.get<Document>('documents').create((d) => {
          d.userId = userId
          d.filename = input.filename
          d.localUri = input.localUri
          d.remoteUrl = input.remoteUrl ?? null
          d.mimeType = input.mimeType
          d.size = input.size
          d.syncStatus = 'pending'
          d.isDeleted = false
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'documents'
          q.entityLocalId = record.id
          q.operation = 'create'
          q.payload = JSON.stringify({
            user_id: userId,
            filename: input.filename,
            remote_url: input.remoteUrl ?? null,
            mime_type: input.mimeType,
            size: input.size,
          })
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar documento'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  removeDocument: async (localId) => {
    set({ loading: true, error: null })
    try {
      let remoteId: string | null = null
      await database.write(async () => {
        const record = await database.get<Document>('documents').find(localId)
        remoteId = record.remoteId
        await record.update((d) => {
          d.isDeleted = true
          d.syncStatus = 'pending'
          d.updatedAt = new Date()
        })

        if (remoteId) {
          await database.get<SyncQueueItem>('sync_queue').create((q) => {
            q.entityType = 'documents'
            q.entityLocalId = localId
            q.entityRemoteId = remoteId
            q.operation = 'delete'
            q.payload = JSON.stringify({ id: remoteId })
            q.status = 'pending'
            q.attempts = 0
          })
        }
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao remover documento'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
