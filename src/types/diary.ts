/**
 * Tipos para o Diário de Segurança da Mulher
 */

export type DiaryEmotion =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'anxious'
  | 'calm'
  | 'worried'
  | 'hopeful'

export interface SafetyDiaryEntry {
  id: string
  user_id: string
  title: string
  content: string
  location?: string | null
  entry_date: string
  emotion?: DiaryEmotion | null
  tags: string[]
  images: string[]
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface CreateDiaryEntryInput {
  title: string
  content: string
  location?: string
  entry_date?: string
  emotion?: DiaryEmotion
  tags?: string[]
  images?: string[]
  is_private?: boolean
}

export interface UpdateDiaryEntryInput {
  title?: string
  content?: string
  location?: string
  entry_date?: string
  emotion?: DiaryEmotion
  tags?: string[]
  images?: string[]
  is_private?: boolean
}

export interface DiaryImageUploadResult {
  url: string | null
  path: string | null
  error: string | null
}

export interface DiaryStatistics {
  totalEntries: number
  entriesThisMonth: number
  mostUsedEmotion: DiaryEmotion | null
  mostUsedTags: string[]
}

// Predefined tags for better UX
export const PREDEFINED_DIARY_TAGS = [
  'trabalho',
  'família',
  'relacionamento',
  'saúde',
  'dinheiro',
  'estudo',
  'amigos',
  'casa',
  'transporte',
  'violência',
  'assédio',
  'ameaça',
  'stalking',
  'cyberbullying',
  'discriminação',
  'medo',
  'ansiedade',
  'depressão',
  'esperança',
  'superação',
] as const

export const EMOTION_LABELS: Record<DiaryEmotion, string> = {
  happy: 'Feliz',
  sad: 'Triste',
  angry: 'Raiva',
  fearful: 'Medo',
  anxious: 'Ansiosa',
  calm: 'Calma',
  worried: 'Preocupada',
  hopeful: 'Esperançosa',
}

export const EMOTION_EMOJIS: Record<DiaryEmotion, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  anxious: '😰',
  calm: '😌',
  worried: '😟',
  hopeful: '🙏',
}

export const EMOTION_COLORS: Record<DiaryEmotion, string> = {
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#DC143C',
  fearful: '#800080',
  anxious: '#FF4500',
  calm: '#32CD32',
  worried: '#FFA500',
  hopeful: '#00CED1',
}
