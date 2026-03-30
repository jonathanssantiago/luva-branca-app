import { Model } from '@nozbe/watermelondb'
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators'

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export class Guardian extends Model {
  static table = 'guardians'

  @text('user_id') userId!: string
  @text('name') name!: string
  @text('phone') phone!: string
  @text('relationship') relationship!: string
  @field('is_active') isActive!: boolean
  @text('remote_id') remoteId!: string | null
  @text('sync_status') syncStatus!: SyncStatus
  @field('is_deleted') isDeleted!: boolean
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
}
