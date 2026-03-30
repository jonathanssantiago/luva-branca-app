import { Model } from '@nozbe/watermelondb'
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators'

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export class Document extends Model {
  static table = 'documents'

  @text('user_id') userId!: string
  @text('filename') filename!: string
  @text('local_uri') localUri!: string | null
  @text('remote_url') remoteUrl!: string | null
  @text('mime_type') mimeType!: string
  @field('size') size!: number
  @text('remote_id') remoteId!: string | null
  @text('sync_status') syncStatus!: SyncStatus
  @field('is_deleted') isDeleted!: boolean
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
}
