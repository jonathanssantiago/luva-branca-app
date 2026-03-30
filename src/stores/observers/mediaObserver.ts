import { Q } from '@nozbe/watermelondb'
import { Subscription } from 'rxjs'
import { database } from '@/src/database'
import { AudioRecording } from '@/src/database/models/AudioRecording'
import { Document } from '@/src/database/models/Document'
import { useMediaStore } from '../useMediaStore'

export function subscribeMedia(userId: string): () => void {
  const audioSub: Subscription = database
    .get<AudioRecording>('audio_recordings')
    .query(
      Q.where('user_id', userId),
      Q.where('is_deleted', false),
      Q.sortBy('created_at', Q.desc),
    )
    .observe()
    .subscribe((recordings) => {
      useMediaStore.getState().setAudioRecordings(recordings)
    })

  const docSub: Subscription = database
    .get<Document>('documents')
    .query(
      Q.where('user_id', userId),
      Q.where('is_deleted', false),
      Q.sortBy('created_at', Q.desc),
    )
    .observe()
    .subscribe((documents) => {
      useMediaStore.getState().setDocuments(documents)
    })

  return () => {
    audioSub.unsubscribe()
    docSub.unsubscribe()
  }
}
