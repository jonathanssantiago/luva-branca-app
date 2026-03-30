import { Model } from '@nozbe/watermelondb'
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators'

export type SyncStatus = 'synced' | 'pending' | 'conflict'
export type DiaryEmotion =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'anxious'
  | 'calm'
  | 'worried'
  | 'hopeful'

export class SafetyDiaryEntry extends Model {
  static table = 'safety_diary_entries'

  @text('user_id') userId!: string
  @text('title') title!: string
  @text('content') content!: string
  @text('location') location!: string | null
  @date('entry_date') entryDate!: Date
  @text('emotion') emotion!: DiaryEmotion | null
  @field('is_private') isPrivate!: boolean
  @text('remote_id') remoteId!: string | null
  @text('sync_status') syncStatus!: SyncStatus
  @field('is_deleted') isDeleted!: boolean
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  get tags(): string[] {
    const raw = this._getRaw('tags') as string
    try {
      return JSON.parse(raw || '[]')
    } catch {
      return []
    }
  }

  get images(): string[] {
    const raw = this._getRaw('images') as string
    try {
      return JSON.parse(raw || '[]')
    } catch {
      return []
    }
  }
}
