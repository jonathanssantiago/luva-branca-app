import { database } from '@/src/database'
import { Profile } from '@/src/database/models/Profile'
import { SyncQueueItem } from '@/src/database/models/SyncQueueItem'
import { apiClient } from '../ApiClient'

export async function syncProfileItem(item: SyncQueueItem): Promise<void> {
  const payload = item.parsedPayload
  await apiClient.post('/sync-push', {
    entityType: 'profiles',
    operation:  'create', // upsert no servidor
    payload,
  })
  await database.write(async () => {
    const record = await database.get<Profile>('profiles').find(item.entityLocalId)
    await record.update((p) => { p.syncStatus = 'synced' })
  })
}

export async function upsertProfileFromServer(
  serverRecord: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const collection = database.get<Profile>('profiles')
  const existing = await collection
    .query()
    .fetch()
    .then((all) => all.find((p) => p.userId === userId))

  await database.write(async () => {
    if (existing) {
      // Server wins for profile
      await existing.update((p) => {
        p.fullName  = (serverRecord.full_name as string)  ?? null
        p.email     = (serverRecord.email     as string)  ?? null
        p.cpf       = (serverRecord.cpf       as string)  ?? null
        p.phone     = (serverRecord.phone     as string)  ?? null
        p.birthDate = (serverRecord.birth_date as string) ?? null
        p.gender    = (serverRecord.gender    as string)  ?? null
        p.avatarUrl = (serverRecord.avatar_url as string) ?? null
        p.syncStatus = 'synced'
      })
    } else {
      await collection.create((p) => {
        p.userId    = userId
        p.remoteId  = serverRecord.id as string
        p.fullName  = (serverRecord.full_name as string)  ?? null
        p.email     = (serverRecord.email     as string)  ?? null
        p.cpf       = (serverRecord.cpf       as string)  ?? null
        p.phone     = (serverRecord.phone     as string)  ?? null
        p.birthDate = (serverRecord.birth_date as string) ?? null
        p.gender    = (serverRecord.gender    as string)  ?? null
        p.avatarUrl = (serverRecord.avatar_url as string) ?? null
        p.syncStatus = 'synced'
      })
    }
  })
}
