import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { appDbSchema } from './schema'
import { migrations } from './migrations'
import { Profile } from './models/Profile'
import { Guardian } from './models/Guardian'
import { SafetyDiaryEntry } from './models/SafetyDiaryEntry'
import { AudioRecording } from './models/AudioRecording'
import { Document } from './models/Document'
import { EmergencyAlert } from './models/EmergencyAlert'
import { SyncQueueItem } from './models/SyncQueueItem'

const adapter = new SQLiteAdapter({
  schema: appDbSchema,
  migrations,
  dbName: 'luva_branca',
  jsi: true,
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Setup error:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [
    Profile,
    Guardian,
    SafetyDiaryEntry,
    AudioRecording,
    Document,
    EmergencyAlert,
    SyncQueueItem,
  ],
})
