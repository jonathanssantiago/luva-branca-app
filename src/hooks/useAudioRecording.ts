import { useState, useRef, useEffect } from 'react'
import { useAudioRecorder, RecordingPresets } from 'expo-audio'
import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { AudioModule } from 'expo-audio'

export interface AudioRecording {
  id: string
  uri: string
  duration: number
  data: string
  fileName: string
  publicUrl?: string
  isUploaded: boolean
  isUploading: boolean
  uploadError?: string
  syncStatus?: 'synced' | 'local_only' | 'cloud_only' | 'conflict'
}

export interface AudioUploadResult {
  url: string | null
  path: string | null
  error: string | null
}

export interface SyncResult {
  success: boolean
  localOnly: AudioRecording[]
  cloudOnly: AudioRecording[]
  conflicts: AudioRecording[]
  actions: {
    uploaded: number
    downloaded: number
    deleted: number
  }
}

export const useAudioRecording = () => {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Carregar gravações existentes do usuário
  useEffect(() => {
    if (user?.id) {
      loadUserRecordings()
    }
  }, [user?.id])

  const loadUserRecordings = async () => {
    if (!user?.id) return

    try {
      console.log('Loading user recordings for user:', user.id)

      // Manter gravações locais existentes
      const currentLocalRecordings = recordings.filter(
        (rec) => rec.uri.startsWith('file://') && !rec.isUploaded,
      )

      const { data, error } = await supabase.storage
        .from('audios')
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (error) {
        console.error('Error loading recordings:', error)
        return
      }

      console.log('Recordings data from Supabase:', data)

      let cloudRecordings: AudioRecording[] = []

      if (data && data.length > 0) {
        console.log(`Found ${data.length} recordings in cloud`)

        cloudRecordings = await Promise.all(
          data.map(async (file) => {
            console.log('Processing file:', file.name)

            // Criar URL assinada válida por 24h
            const { data: urlData } = await supabase.storage
              .from('audios')
              .createSignedUrl(`${user.id}/${file.name}`, 86400) // 24 hours

            // Extrair informações do nome do arquivo se possível
            const timestamp = file.name.match(/_emergency_(.+)\.m4a$/)?.[1]
            let dateCreated: string

            if (timestamp) {
              try {
                // Tentar converter timestamp do formato: 2025-01-05T15-30-45-123Z
                const dateStr = timestamp.replace(
                  /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
                  'T$1:$2:$3.$4Z',
                )
                const date = new Date(dateStr)
                if (!isNaN(date.getTime())) {
                  dateCreated = date.toLocaleString('pt-BR')
                } else {
                  throw new Error('Invalid date')
                }
              } catch {
                // Fallback para created_at do arquivo
                dateCreated = new Date(
                  file.created_at || Date.now(),
                ).toLocaleString('pt-BR')
              }
            } else {
              dateCreated = new Date(
                file.created_at || Date.now(),
              ).toLocaleString('pt-BR')
            }

            const recording = {
              id: file.id || file.name,
              uri: urlData?.signedUrl || '', // URL remota, não local
              duration: 0, // Não podemos saber a duração sem baixar o arquivo
              data: dateCreated,
              fileName: file.name,
              publicUrl: urlData?.signedUrl,
              isUploaded: true,
              isUploading: false,
              syncStatus: 'synced' as const, // Arquivos na nuvem são considerados sincronizados
            }

            console.log('Created recording object:', recording)
            return recording
          }),
        )
      } else {
        console.log('No recordings found in cloud')
      }

      // Combinar gravações locais + nuvem, evitando duplicatas
      const allRecordings = [...currentLocalRecordings]

      // Adicionar gravações da nuvem que não existem localmente
      for (const cloudRec of cloudRecordings) {
        const existsLocally = allRecordings.find(
          (localRec) => localRec.fileName === cloudRec.fileName,
        )

        if (!existsLocally) {
          allRecordings.push(cloudRec)
        } else {
          // Se existe localmente, atualizar status para sincronizado
          const index = allRecordings.findIndex(
            (localRec) => localRec.fileName === cloudRec.fileName,
          )
          if (index >= 0) {
            allRecordings[index] = {
              ...allRecordings[index],
              isUploaded: true,
              syncStatus: 'synced',
              publicUrl: cloudRec.publicUrl,
            }
          }
        }
      }

      // Marcar gravações locais que não estão na nuvem
      for (let i = 0; i < allRecordings.length; i++) {
        const recording = allRecordings[i]
        if (recording.uri.startsWith('file://') && !recording.isUploaded) {
          const existsInCloud = cloudRecordings.find(
            (cloudRec) => cloudRec.fileName === recording.fileName,
          )

          allRecordings[i] = {
            ...recording,
            syncStatus: existsInCloud ? 'synced' : 'local_only',
          }
        }
      }

      console.log('Final recordings list:', allRecordings.length)
      setRecordings(allRecordings)
    } catch (error) {
      console.error('Error loading user recordings:', error)
    }
  }

  // Converter URI local para ArrayBuffer para upload
  const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
    const response = await fetch(uri)
    return response.arrayBuffer()
  }

  // Gerar nome único para o arquivo de áudio
  const generateFileName = (userId: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `${userId}_emergency_${timestamp}.m4a`
  }

  // Iniciar gravação
  const startRecording = async (): Promise<{
    success: boolean
    error?: string
  }> => {
    try {
      // Verificar permissão de microfone antes de iniciar
      const permission = await AudioModule.getRecordingPermissionsAsync()
      if (!permission.granted) {
        return {
          success: false,
          error:
            'Permissão de microfone negada. Conceda a permissão nas configurações.',
        }
      }
      await recorder.prepareToRecordAsync()
      recorder.record()

      setIsRecording(true)
      setRecordingTime(0)

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error)
      return {
        success: false,
        error: error.message || 'Erro ao iniciar gravação',
      }
    }
  }

  // Parar gravação e fazer upload automaticamente
  const stopAndUploadRecording = async (): Promise<{
    success: boolean
    error?: string
    recording?: AudioRecording
  }> => {
    if (!recorder || !user) {
      return {
        success: false,
        error: 'Gravação não encontrada ou usuário não autenticado',
      }
    }

    try {
      // Parar gravação
      await recorder.stop()

      const uri = recorder.uri
      if (!uri) {
        return { success: false, error: 'URI da gravação não disponível' }
      }

      // Obter informações do arquivo
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        return { success: false, error: 'Arquivo de áudio não encontrado' }
      }

      // Tentar obter a duração real da gravação, se possível
      let duration = recordingTime
      if (recorder.getStatus) {
        try {
          const status = await recorder.getStatus()
          if (status && typeof status.durationMillis === 'number') {
            duration = Math.round(status.durationMillis / 1000)
          }
        } catch (e) {
          // fallback para recordingTime
        }
      }

      // Criar objeto de gravação
      const fileName = generateFileName(user.id)
      const newRecording: AudioRecording = {
        id: Date.now().toString(),
        uri,
        duration,
        data: new Date().toLocaleString('pt-BR'),
        fileName,
        isUploaded: false,
        isUploading: true,
      }

      // Adicionar à lista imediatamente
      setRecordings((prev) => [newRecording, ...prev])
      setIsRecording(false)
      setRecordingTime(0)

      // Limpar timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Fazer upload em background
      setIsUploading(true)
      const uploadResult = await uploadAudioToSupabase(uri, fileName)

      // Atualizar status da gravação
      setRecordings((prev) =>
        prev.map((rec) =>
          rec.id === newRecording.id
            ? {
                ...rec,
                isUploading: false,
                isUploaded: uploadResult.url !== null,
                publicUrl: uploadResult.url || undefined,
                uploadError: uploadResult.error || undefined,
              }
            : rec,
        ),
      )

      setIsUploading(false)

      if (uploadResult.error) {
        return {
          success: false,
          error: `Gravação salva localmente, mas erro no upload: ${uploadResult.error}`,
          recording: newRecording,
        }
      }

      return {
        success: true,
        recording: {
          ...newRecording,
          isUploading: false,
          isUploaded: true,
          publicUrl: uploadResult.url || undefined,
        },
      }
    } catch (error: any) {
      console.error('Erro ao parar gravação:', error)
      setIsRecording(false)
      setIsUploading(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      return {
        success: false,
        error: error.message || 'Erro ao parar gravação',
      }
    }
  }

  // Upload para Supabase Storage
  const uploadAudioToSupabase = async (
    uri: string,
    fileName: string,
  ): Promise<AudioUploadResult> => {
    if (!user) {
      return { url: null, path: null, error: 'Usuário não autenticado' }
    }

    try {
      // Converter para ArrayBuffer
      const arrayBuffer = await uriToArrayBuffer(uri)

      // Definir caminho do arquivo
      const filePath = `${user.id}/${fileName}`

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audios')
        .upload(filePath, arrayBuffer, {
          contentType: 'audio/m4a',
          upsert: false, // Não substituir, cada gravação é única
        })

      if (uploadError) {
        throw uploadError
      }

      // Como o bucket é privado, vamos criar uma URL assinada válida por 24h
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audios')
        .createSignedUrl(filePath, 86400) // 24 horas

      if (urlError) {
        console.warn('Erro ao gerar URL assinada:', urlError)
        // Retornar sucesso mesmo sem URL, o arquivo foi salvo
        return {
          url: null,
          path: filePath,
          error: null,
        }
      }

      return {
        url: urlData.signedUrl,
        path: filePath,
        error: null,
      }
    } catch (error: any) {
      console.error('Erro no upload para Supabase:', error)

      let errorMessage = 'Erro ao fazer upload do áudio'

      if (error?.message?.includes('Bucket not found')) {
        errorMessage =
          'Bucket de áudios não encontrado. Verifique a configuração.'
      } else if (error?.message?.includes('unauthorized')) {
        errorMessage = 'Sem permissão para upload. Faça login novamente.'
      } else if (error?.message?.includes('quota')) {
        errorMessage = 'Limite de armazenamento excedido.'
      } else if (error?.message) {
        errorMessage = error.message
      }

      return {
        url: null,
        path: null,
        error: errorMessage,
      }
    }
  }

  // Retry upload para gravações que falharam
  const retryUpload = async (
    recordingId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const recording = recordings.find((r) => r.id === recordingId)
    if (!recording || recording.isUploaded) {
      return { success: false, error: 'Gravação não encontrada ou já enviada' }
    }

    // Marcar como fazendo upload
    setRecordings((prev) =>
      prev.map((rec) =>
        rec.id === recordingId
          ? { ...rec, isUploading: true, uploadError: undefined }
          : rec,
      ),
    )

    const uploadResult = await uploadAudioToSupabase(
      recording.uri,
      recording.fileName,
    )

    // Atualizar status
    setRecordings((prev) =>
      prev.map((rec) =>
        rec.id === recordingId
          ? {
              ...rec,
              isUploading: false,
              isUploaded: uploadResult.url !== null,
              publicUrl: uploadResult.url || undefined,
              uploadError: uploadResult.error || undefined,
            }
          : rec,
      ),
    )

    return {
      success: uploadResult.url !== null,
      error: uploadResult.error || undefined,
    }
  }

  // Deletar gravação
  const deleteRecording = async (
    recordingId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const recording = recordings.find((r) => r.id === recordingId)
    if (!recording) {
      return { success: false, error: 'Gravação não encontrada' }
    }

    try {
      // Se é uma gravação local (tem URI local), deletar arquivo local
      if (recording.uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(recording.uri)
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(recording.uri)
        }
      }

      // Se foi feito upload, deletar do Supabase
      if (recording.isUploaded && user?.id) {
        const filePath = `${user.id}/${recording.fileName}`
        const { error } = await supabase.storage
          .from('audios')
          .remove([filePath])

        if (error) {
          console.warn('Erro ao deletar do Supabase:', error)
          // Continuar mesmo com erro no Supabase
        }
      }

      // Remover da lista
      setRecordings((prev) => prev.filter((r) => r.id !== recordingId))

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao deletar gravação:', error)
      return {
        success: false,
        error: error.message || 'Erro ao deletar gravação',
      }
    }
  }

  // Formatar tempo em MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Obter gravações locais (arquivos no dispositivo)
  const getLocalRecordings = async (): Promise<AudioRecording[]> => {
    try {
      // Filtrar gravações que têm URI local (file://)
      const localRecordings = recordings.filter((rec) =>
        rec.uri.startsWith('file://'),
      )

      // Verificar se os arquivos ainda existem
      const validLocalRecordings: AudioRecording[] = []

      for (const recording of localRecordings) {
        const fileInfo = await FileSystem.getInfoAsync(recording.uri)
        if (fileInfo.exists) {
          validLocalRecordings.push({
            ...recording,
            syncStatus: recording.isUploaded ? 'synced' : 'local_only',
          })
        }
      }

      return validLocalRecordings
    } catch (error) {
      console.error('Error getting local recordings:', error)
      return []
    }
  }

  // Obter gravações da nuvem
  const getCloudRecordings = async (): Promise<AudioRecording[]> => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase.storage
        .from('audios')
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (error || !data) {
        console.error('Error loading cloud recordings:', error)
        return []
      }

      const cloudRecordings: AudioRecording[] = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from('audios')
            .createSignedUrl(`${user.id}/${file.name}`, 86400)

          const timestamp = file.name.match(/_emergency_(.+)\.m4a$/)?.[1]
          let dateCreated: string

          if (timestamp) {
            try {
              const dateStr = timestamp.replace(
                /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
                'T$1:$2:$3.$4Z',
              )
              const date = new Date(dateStr)
              if (!isNaN(date.getTime())) {
                dateCreated = date.toLocaleString('pt-BR')
              } else {
                throw new Error('Invalid date')
              }
            } catch {
              dateCreated = new Date(
                file.created_at || Date.now(),
              ).toLocaleString('pt-BR')
            }
          } else {
            dateCreated = new Date(
              file.created_at || Date.now(),
            ).toLocaleString('pt-BR')
          }

          return {
            id: file.id || file.name,
            uri: urlData?.signedUrl || '',
            duration: 0,
            data: dateCreated,
            fileName: file.name,
            publicUrl: urlData?.signedUrl,
            isUploaded: true,
            isUploading: false,
            syncStatus: 'cloud_only' as const,
          }
        }),
      )

      return cloudRecordings
    } catch (error) {
      console.error('Error getting cloud recordings:', error)
      return []
    }
  }

  // Sincronizar gravações entre local e nuvem
  const syncRecordings = async (): Promise<SyncResult> => {
    console.log('Starting sync process...')
    console.log('Current recordings in state:', recordings.length)

    try {
      // Obter gravações locais direto do estado atual
      const localRecordings = recordings.filter((rec) => {
        const isLocal = rec.uri.startsWith('file://')
        const isNotUploaded = !rec.isUploaded || rec.uploadError
        console.log(
          `Recording ${rec.fileName}: isLocal=${isLocal}, isNotUploaded=${isNotUploaded}`,
        )
        return isLocal && isNotUploaded
      })

      // Obter gravações da nuvem
      const cloudRecordings = await getCloudRecordings()

      console.log('Local recordings found:', localRecordings.length)
      console.log(
        'Local recording details:',
        localRecordings.map((r) => ({
          fileName: r.fileName,
          isUploaded: r.isUploaded,
          uploadError: !!r.uploadError,
          syncStatus: r.syncStatus,
        })),
      )
      console.log('Cloud recordings found:', cloudRecordings.length)

      // Identificar gravações apenas locais (não estão na nuvem)
      const localOnly = localRecordings.filter((local) => {
        const existsInCloud = cloudRecordings.find(
          (cloud) => cloud.fileName === local.fileName,
        )
        console.log(
          `Local file ${local.fileName} exists in cloud: ${!!existsInCloud}`,
        )
        return !existsInCloud
      })

      // Identificar gravações apenas na nuvem (não estão localmente)
      const cloudOnly = cloudRecordings.filter(
        (cloud) =>
          !recordings.find((local) => local.fileName === cloud.fileName),
      )

      const conflicts: AudioRecording[] = []

      const actions = {
        uploaded: 0,
        downloaded: 0,
        deleted: 0,
      }

      console.log(
        `Sync analysis: ${localOnly.length} local-only, ${cloudOnly.length} cloud-only recordings`,
      )

      // Auto-sync: Upload gravações que existem apenas localmente
      for (const recording of localOnly) {
        console.log(`Uploading local-only recording: ${recording.fileName}`)
        console.log(`Recording URI: ${recording.uri}`)

        // Verificar se o arquivo ainda existe
        try {
          const fileInfo = await FileSystem.getInfoAsync(recording.uri)
          if (!fileInfo.exists) {
            console.log(
              `File ${recording.fileName} no longer exists locally, skipping upload`,
            )
            continue
          }
          console.log(
            `File ${recording.fileName} exists, size: ${fileInfo.size} bytes`,
          )
        } catch (error) {
          console.error(`Error checking file ${recording.fileName}:`, error)
          continue
        }

        // Marcar como fazendo upload
        setRecordings((prev) =>
          prev.map((rec) =>
            rec.id === recording.id
              ? {
                  ...rec,
                  isUploading: true,
                  syncStatus: 'local_only',
                  uploadError: undefined,
                }
              : rec,
          ),
        )

        const uploadResult = await uploadAudioToSupabase(
          recording.uri,
          recording.fileName,
        )

        if (uploadResult.url) {
          console.log(`Successfully uploaded ${recording.fileName}`)
          actions.uploaded++

          // Atualizar status
          setRecordings((prev) =>
            prev.map((rec) =>
              rec.id === recording.id
                ? {
                    ...rec,
                    isUploading: false,
                    isUploaded: true,
                    publicUrl: uploadResult.url || undefined,
                    syncStatus: 'synced',
                  }
                : rec,
            ),
          )
        } else {
          console.error(
            `Failed to upload ${recording.fileName}:`,
            uploadResult.error,
          )
          // Marcar erro no upload
          setRecordings((prev) =>
            prev.map((rec) =>
              rec.id === recording.id
                ? {
                    ...rec,
                    isUploading: false,
                    uploadError: uploadResult.error || undefined,
                    syncStatus: 'local_only',
                  }
                : rec,
            ),
          )
        }
      }

      // Adicionar gravações que existem apenas na nuvem à lista local
      for (const cloudRecording of cloudOnly) {
        setRecordings((prev) => {
          // Verificar se já existe na lista
          const exists = prev.find(
            (rec) => rec.fileName === cloudRecording.fileName,
          )
          if (!exists) {
            console.log(
              `Adding cloud-only recording: ${cloudRecording.fileName}`,
            )
            actions.downloaded++
            return [cloudRecording, ...prev]
          }
          return prev
        })
      }

      // Atualizar status de arquivos que agora estão sincronizados
      setRecordings((prev) =>
        prev.map((rec) => {
          if (
            rec.uri.startsWith('file://') &&
            rec.isUploaded &&
            !rec.uploadError
          ) {
            const existsInCloud = cloudRecordings.find(
              (cloud) => cloud.fileName === rec.fileName,
            )
            if (existsInCloud) {
              return { ...rec, syncStatus: 'synced' }
            }
          }
          return rec
        }),
      )

      console.log(
        `Sync completed: ${actions.uploaded} uploaded, ${actions.downloaded} downloaded`,
      )

      return {
        success: true,
        localOnly,
        cloudOnly,
        conflicts,
        actions,
      }
    } catch (error) {
      console.error('Error during sync:', error)
      return {
        success: false,
        localOnly: [],
        cloudOnly: [],
        conflicts: [],
        actions: { uploaded: 0, downloaded: 0, deleted: 0 },
      }
    }
  }

  // Limpar arquivos órfãos (existem localmente mas não na nuvem)
  const cleanupOrphanFiles = async (): Promise<{
    success: boolean
    cleaned: number
    error?: string
  }> => {
    try {
      const localRecordings = await getLocalRecordings()
      const cloudRecordings = await getCloudRecordings()

      let cleaned = 0

      for (const local of localRecordings) {
        const existsInCloud = cloudRecordings.find(
          (cloud) => cloud.fileName === local.fileName,
        )

        if (!existsInCloud && local.uri.startsWith('file://')) {
          // Arquivo existe localmente mas não na nuvem - deletar local
          try {
            await FileSystem.deleteAsync(local.uri)
            setRecordings((prev) => prev.filter((rec) => rec.id !== local.id))
            cleaned++
          } catch (error) {
            console.warn('Error deleting orphan file:', error)
          }
        }
      }

      return { success: true, cleaned }
    } catch (error: any) {
      return {
        success: false,
        cleaned: 0,
        error: error.message || 'Erro ao limpar arquivos órfãos',
      }
    }
  }

  // Forçar re-scan de arquivos locais (para debug/troubleshooting)
  const rescanLocalFiles = async (): Promise<{
    success: boolean
    found: number
    error?: string
  }> => {
    if (!user?.id) {
      return { success: false, found: 0, error: 'Usuário não autenticado' }
    }

    try {
      console.log('Re-scanning for local files...')

      // Buscar por arquivos locais que podem ter sido perdidos do estado
      const currentLocalRecordings = recordings.filter(
        (rec) => rec.uri.startsWith('file://') && !rec.isUploaded,
      )

      console.log(
        `Found ${currentLocalRecordings.length} local recordings in current state`,
      )

      // Verificar se existem arquivos locais válidos
      const validLocalRecordings: AudioRecording[] = []

      for (const recording of currentLocalRecordings) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(recording.uri)
          if (fileInfo.exists) {
            validLocalRecordings.push({
              ...recording,
              syncStatus: 'local_only',
            })
            console.log(`Valid local file found: ${recording.fileName}`)
          } else {
            console.log(`Local file no longer exists: ${recording.fileName}`)
            // Remover da lista se o arquivo não existe mais
            setRecordings((prev) =>
              prev.filter((rec) => rec.id !== recording.id),
            )
          }
        } catch (error) {
          console.error(`Error checking file ${recording.fileName}:`, error)
        }
      }

      // Atualizar status dos arquivos encontrados
      if (validLocalRecordings.length > 0) {
        setRecordings((prev) =>
          prev.map((rec) => {
            const validLocal = validLocalRecordings.find(
              (vl) => vl.id === rec.id,
            )
            if (validLocal) {
              return { ...rec, syncStatus: 'local_only' }
            }
            return rec
          }),
        )
      }

      return {
        success: true,
        found: validLocalRecordings.length,
      }
    } catch (error: any) {
      console.error('Error re-scanning local files:', error)
      return {
        success: false,
        found: 0,
        error: error.message || 'Erro ao re-escanear arquivos locais',
      }
    }
  }

  return {
    // Estados
    isRecording,
    isUploading,
    recordings,
    recordingTime,

    // Funções principais
    startRecording,
    stopAndUploadRecording,

    // Funções auxiliares
    retryUpload,
    deleteRecording,
    formatTime,
    loadUserRecordings,

    // Funções de sincronização
    syncRecordings,
    cleanupOrphanFiles,
    rescanLocalFiles,
    getLocalRecordings,
    getCloudRecordings,
  }
}
