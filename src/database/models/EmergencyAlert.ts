import { Model } from '@nozbe/watermelondb'
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators'

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export class EmergencyAlert extends Model {
  static table = 'emergency_alerts'

  @text('user_id') userId!: string
  @text('message') message!: string
  @field('location_lat') locationLat!: number | null
  @field('location_lng') locationLng!: number | null
  @field('is_police_emergency') isPoliceEmergency!: boolean
  @text('remote_id') remoteId!: string | null
  @text('sync_status') syncStatus!: SyncStatus
  @date('sent_at') sentAt!: Date | null
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date

  get guardians(): unknown[] {
    const raw = this._getRaw('guardians_json') as string
    try {
      return JSON.parse(raw || '[]')
    } catch {
      return []
    }
  }
}
