import { Model } from '@nozbe/watermelondb'
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators'

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export class Profile extends Model {
  static table = 'profiles'

  @text('user_id') userId!: string
  @text('full_name') fullName!: string | null
  @text('email') email!: string | null
  @text('cpf') cpf!: string | null
  @text('phone') phone!: string | null
  @text('birth_date') birthDate!: string | null
  @text('gender') gender!: string | null
  @text('avatar_url') avatarUrl!: string | null
  @text('remote_id') remoteId!: string | null
  @text('sync_status') syncStatus!: SyncStatus
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
}
