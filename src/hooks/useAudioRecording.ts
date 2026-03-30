import { useState, useRef, useEffect } from 'react'
import { Alert, Linking, Platform } from 'react-native'
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio'
import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'

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

      let cloudRecordings: AudioRecording[] = []

      if (data && data.length > 0) {
        cloudRecordings = await Promise.all(
          data.map(async (file) => {
            // URL assinada válida por 7 dias
            const { data: urlData } = await supabase.storage
              .from('audios')
              .createSignedUrl(`${user.id}/${file.name}`, 604800)

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
              syncStatus: 'synced' as const,
            }
          }),
        )
      }

      // Merge via functional setter evita stale closure com o estado recordings
      setRecordings((prev) => {
        const currentLocalRecordings = prev.filter(
          (rec) => rec.uri.startsWith('file://') && !rec.isUploaded,
        )

        const allRecordings = [...currentLocalRecordings]

        for (const cloudRec of cloudRecordings) {
          const existsLocallyIdx = allRecordings.findIndex(
            (localRec) => localRec.fileName === cloudRec.fileName,
          )

          if (existsLocallyIdx < 0) {
            allRecordings.push(cloudRec)
          } else {
            allRecordings[existsLocallyIdx] = {
              ...allRecordings[existsLocallyIdx],
              isUploaded: true,
              syncStatus: 'synced',
              publicUrl: cloudRec.publicUrl,
              uri: cloudRec.uri,
            }
          }
        }

        for (let i = 0; i < allRecordings.length; i++) {
          const rec = allRecordings[i]
          if (rec.uri.startsWith('file://') && !rec.isUploaded) {
            const existsInCloud = cloudRecordings.some(
              (cr) => cr.fileName === rec.fileName,
            )
            allRecordings[i] = {
              ...rec,
              syncStatus: existsInCloud ? 'synced' : 'local_only',
            }
          }
        }

        return allRecordings
      })
    } catch (error) {
      console.error('Error loading user recordings:', error)
    }
  }

  // Converter URI local para ArrayBuffer para upload
  // Usa FileSystem.readAsStringAsync para URIs file:// (mais confiável em builds Android)
  const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
    if (uri.startsWith('file://')) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes.buffer
    }
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
      // Solicitar permissão de microfone
      const permission = await AudioModule.requestRecordingPermissionsAsync()
      if (!permission.granted) {
        Alert.alert(
          'Permissão de Microfone',
          'O acesso ao microfone é necessário para gravar áudios de emergência. Habilite nas configurações do dispositivo.',
          [
            { text: 'Agora Não', style: 'cancel' },
            {
              text: 'Abrir Configurações',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:')
                } else {
                  Linking.openSettings()
                }
              },
            },
          ],
        )
        return { success: false, error: 'Permissão de microfone necessária' }
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
        // Limpar estado mesmo com URI inválida
        setIsRecording(false)
        setRecordingTime(0)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        return { success: false, error: 'URI da gravação não disponível' }
      }

      // Obter informações do arquivo
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        return { success: false, error: 'Arquivo de áudio não encontrado' }
      }
      if ('size' in fileInfo && fileInfo.size === 0) {
        return { success: false, error: 'Arquivo de áudio vazio — grave por mais tempo' }
      }

      // Usar o recordingTime como duração
      const duration = recordingTime

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
                syncStatus: uploadResult.url ? 'synced' : 'local_only',
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
          contentType: 'audio/mp4',
          upsert: false, // Não substituir, cada gravação é única
        })

      if (uploadError) {
        throw uploadError
      }

      // Como o bucket é privado, criar URL assinada válida por 7 dias
      const { data: urlData, error: urlError } = await supabase.storage
        .from('audios')
        .createSignedUrl(filePath, 604800) // 7 dias

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
              syncStatus: uploadResult.url ? 'synced' : 'local_only',
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
            .createSignedUrl(`${user.id}/${file.name}`, 604800)

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
    try {
      // Snapshot do estado atual para evitar stale closure
      const currentRecordings = await new Promise<AudioRecording[]>((resolve) => {
        setRecordings((prev) => { resolve(prev); return prev })
      })

      const localRecordings = currentRecordings.filter(
        (rec) => rec.uri.startsWith('file://') && (!rec.isUploaded || rec.uploadError),
      )

      const cloudRecordings = await getCloudRecordings()

      const localOnly = localRecordings.filter(
        (local) => !cloudRecordings.some((cloud) => cloud.fileName === local.fileName),
      )

      const cloudOnly = cloudRecordings.filter(
        (cloud) => !currentRecordings.some((local) => local.fileName === cloud.fileName),
      )

      const conflicts: AudioRecording[] = []
      const actions = { uploaded: 0, downloaded: 0, deleted: 0 }

      // Upload gravações que existem apenas localmente
      for (const recording of localOnly) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(recording.uri)
          if (!fileInfo.exists) continue
        } catch {
          continue
        }

        setRecordings((prev) =>
          prev.map((rec) =>
            rec.id === recording.id
              ? { ...rec, isUploading: true, syncStatus: 'local_only', uploadError: undefined }
              : rec,
          ),
        )

        const uploadResult = await uploadAudioToSupabase(
          recording.uri,
          recording.fileName,
        )

        if (uploadResult.url) {
          actions.uploaded++
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

      // Adicionar gravações que existem apenas na nuvem
      for (const cloudRecording of cloudOnly) {
        setRecordings((prev) => {
          const exists = prev.some((rec) => rec.fileName === cloudRecording.fileName)
          if (!exists) {
            actions.downloaded++
            return [cloudRecording, ...prev]
          }
          return prev
        })
      }

      // Atualizar syncStatus de arquivos já sincronizados
      setRecordings((prev) =>
        prev.map((rec) => {
          if (rec.uri.startsWith('file://') && rec.isUploaded && !rec.uploadError) {
            const existsInCloud = cloudRecordings.some(
              (cloud) => cloud.fileName === rec.fileName,
            )
            if (existsInCloud) return { ...rec, syncStatus: 'synced' }
          }
          return rec
        }),
      )

      return { success: true, localOnly, cloudOnly, conflicts, actions }
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
      // Usar functional setter para evitar stale closure com recordings
      const foundIds: string[] = []

      await new Promise<void>((resolve) => {
        setRecordings((prev) => {
          const localRecs = prev.filter(
            (rec) => rec.uri.startsWith('file://') && !rec.isUploaded,
          )
          // Processar asíncronamente após capturar o snapshot
          Promise.allSettled(
            localRecs.map(async (recording) => {
              try {
                const fileInfo = await FileSystem.getInfoAsync(recording.uri)
                if (fileInfo.exists) {
                  foundIds.push(recording.id)
                }
              } catch {
                // ignorar erros individuais
              }
            }),
          ).then(() => resolve())
          return prev
        })
      })

      // Remover e atualizar em um único passe
      setRecordings((prev) => {
        return prev
          .filter((rec) => {
            if (rec.uri.startsWith('file://') && !rec.isUploaded) {
              return foundIds.includes(rec.id)
            }
            return true
          })
          .map((rec) => {
            if (foundIds.includes(rec.id)) {
              return { ...rec, syncStatus: 'local_only' as const }
            }
            return rec
          })
      })

      return { success: true, found: foundIds.length }
    } catch (error: any) {
      console.error('Error re-scanning local files:', error)
      return {
        success: false,
        found: 0,
        error: error.message || 'Erro ao re-escanear arquivos locais',
      }
    }
  }

  // Renovar a signedUrl de uma gravação da nuvem (URLs expiram após 7 dias)
  const refreshSignedUrl = async (recordingId: string): Promise<string | null> => {
    if (!user?.id) return null

    let fileName: string | undefined
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === recordingId)
      fileName = rec?.fileName
      return prev
    })

    if (!fileName) return null

    try {
      const { data } = await supabase.storage
        .from('audios')
        .createSignedUrl(`${user.id}/${fileName}`, 604800)

      if (data?.signedUrl) {
        setRecordings((prev) =>
          prev.map((r) =>
            r.id === recordingId
              ? { ...r, uri: data.signedUrl!, publicUrl: data.signedUrl! }
              : r,
          ),
        )
        return data.signedUrl
      }
    } catch (error) {
      console.error('Erro ao renovar URL assinada:', error)
    }
    return null
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
    refreshSignedUrl,
  }
}
