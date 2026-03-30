import { Model } from '@nozbe/watermelondb'
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators'

export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncItemStatus = 'pending' | 'processing' | 'failed' | 'done'

export class SyncQueueItem extends Model {
  static table = 'sync_queue'

  @text('entity_type') entityType!: string
  @text('entity_local_id') entityLocalId!: string
  @text('entity_remote_id') entityRemoteId!: string | null
  @text('operation') operation!: SyncOperation
  @text('payload') payload!: string
  @text('status') status!: SyncItemStatus
  @field('attempts') attempts!: number
  @date('last_attempted_at') lastAttemptedAt!: Date | null
  @text('error_message') errorMessage!: string | null
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  get parsedPayload(): Record<string, unknown> {
    try {
      return JSON.parse(this.payload || '{}')
    } catch {
      return {}
    }
  }
}
