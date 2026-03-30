import { create } from 'zustand'
import { database } from '@/src/database'
import { Profile } from '@/src/database/models/Profile'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'

export interface UpdateProfileInput {
  fullName?: string | null
  email?: string | null
  cpf?: string | null
  phone?: string | null
  birthDate?: string | null
  gender?: string | null
  avatarUrl?: string | null
}

interface ProfileState {
  profile: Profile | null
  loading: boolean
  error: string | null
  setProfile: (profile: Profile | null) => void
  updateProfile: (localId: string, input: UpdateProfileInput) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  setProfile: (profile) => set({ profile }),

  updateProfile: async (localId, input) => {
    set({ loading: true, error: null })
    try {
      await database.write(async () => {
        const record = await database.get<Profile>('profiles').find(localId)
        await record.update((p) => {
          if (input.fullName !== undefined) p.fullName = input.fullName ?? null
          if (input.email !== undefined) p.email = input.email ?? null
          if (input.cpf !== undefined) p.cpf = input.cpf ?? null
          if (input.phone !== undefined) p.phone = input.phone ?? null
          if (input.birthDate !== undefined) p.birthDate = input.birthDate ?? null
          if (input.gender !== undefined) p.gender = input.gender ?? null
          if (input.avatarUrl !== undefined) p.avatarUrl = input.avatarUrl ?? null
          p.syncStatus = 'pending'
          p.updatedAt = new Date()
        })

        await database.get<SyncQueueItem>('sync_queue').create((q) => {
          q.entityType = 'profiles'
          q.entityLocalId = localId
          q.entityRemoteId = null
          q.operation = 'update'
          q.payload = JSON.stringify(input)
          q.status = 'pending'
          q.attempts = 0
        })
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
