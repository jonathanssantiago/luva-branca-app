import { useState, useRef } from 'react'
import { useAudioRecorder, RecordingPresets } from 'expo-audio'
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
}

export interface AudioUploadResult {
  url: string | null
  path: string | null
  error: string | null
}

export const useAudioRecording = () => {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
  const startRecording = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await recorder.prepareToRecordAsync()
      recorder.record()
      
      setIsRecording(true)
      setRecordingTime(0)

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error)
      return { success: false, error: error.message || 'Erro ao iniciar gravação' }
    }
  }

  // Parar gravação e fazer upload automaticamente
  const stopAndUploadRecording = async (): Promise<{ success: boolean; error?: string; recording?: AudioRecording }> => {
    if (!recorder || !user) {
      return { success: false, error: 'Gravação não encontrada ou usuário não autenticado' }
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

      // Criar objeto de gravação
      const fileName = generateFileName(user.id)
      const newRecording: AudioRecording = {
        id: Date.now().toString(),
        uri,
        duration: recordingTime,
        data: new Date().toLocaleString('pt-BR'),
        fileName,
        isUploaded: false,
        isUploading: true,
      }

      // Adicionar à lista imediatamente
      setRecordings(prev => [newRecording, ...prev])
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
      setRecordings(prev => 
        prev.map(rec => 
          rec.id === newRecording.id 
            ? { 
                ...rec, 
                isUploading: false,
                isUploaded: uploadResult.url !== null,
                publicUrl: uploadResult.url || undefined,
                uploadError: uploadResult.error || undefined
              }
            : rec
        )
      )

      setIsUploading(false)

      if (uploadResult.error) {
        return { 
          success: false, 
          error: `Gravação salva localmente, mas erro no upload: ${uploadResult.error}`,
          recording: newRecording
        }
      }

      return { 
        success: true, 
        recording: { 
          ...newRecording, 
          isUploading: false, 
          isUploaded: true, 
          publicUrl: uploadResult.url || undefined 
        }
      }

    } catch (error: any) {
      console.error('Erro ao parar gravação:', error)
      setIsRecording(false)
      setIsUploading(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      return { success: false, error: error.message || 'Erro ao parar gravação' }
    }
  }

  // Upload para Supabase Storage
  const uploadAudioToSupabase = async (uri: string, fileName: string): Promise<AudioUploadResult> => {
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
        errorMessage = 'Bucket de áudios não encontrado. Verifique a configuração.'
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
  const retryUpload = async (recordingId: string): Promise<{ success: boolean; error?: string }> => {
    const recording = recordings.find(r => r.id === recordingId)
    if (!recording || recording.isUploaded) {
      return { success: false, error: 'Gravação não encontrada ou já enviada' }
    }

    // Marcar como fazendo upload
    setRecordings(prev => 
      prev.map(rec => 
        rec.id === recordingId 
          ? { ...rec, isUploading: true, uploadError: undefined }
          : rec
      )
    )

    const uploadResult = await uploadAudioToSupabase(recording.uri, recording.fileName)
    
    // Atualizar status
    setRecordings(prev => 
      prev.map(rec => 
        rec.id === recordingId 
          ? { 
              ...rec, 
              isUploading: false,
              isUploaded: uploadResult.url !== null,
              publicUrl: uploadResult.url || undefined,
              uploadError: uploadResult.error || undefined
            }
          : rec
      )
    )

    return { 
      success: uploadResult.url !== null, 
      error: uploadResult.error || undefined 
    }
  }

  // Deletar gravação
  const deleteRecording = async (recordingId: string): Promise<{ success: boolean; error?: string }> => {
    const recording = recordings.find(r => r.id === recordingId)
    if (!recording) {
      return { success: false, error: 'Gravação não encontrada' }
    }

    try {
      // Deletar arquivo local
      const fileInfo = await FileSystem.getInfoAsync(recording.uri)
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(recording.uri)
      }

      // Se foi feito upload, deletar do Supabase
      if (recording.isUploaded && recording.publicUrl) {
        const filePath = `${user?.id}/${recording.fileName}`
        const { error } = await supabase.storage
          .from('audios')
          .remove([filePath])
        
        if (error) {
          console.warn('Erro ao deletar do Supabase:', error)
          // Continuar mesmo com erro no Supabase
        }
      }

      // Remover da lista
      setRecordings(prev => prev.filter(r => r.id !== recordingId))

      return { success: true }
    } catch (error: any) {
      console.error('Erro ao deletar gravação:', error)
      return { success: false, error: error.message || 'Erro ao deletar gravação' }
    }
  }

  // Formatar tempo em MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
  }
} 