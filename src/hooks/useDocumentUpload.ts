import { useState, useEffect } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'

export interface Document {
  id: string
  fileName: string
  fileType: string
  size: number
  uri: string
  uploadDate: string
  isUploading?: boolean
  isUploaded?: boolean
  uploadError?: string
  publicUrl?: string
}

interface UploadResult {
  success: boolean
  document?: Document
  error?: string
}

interface SelectionResult {
  success: boolean
  error?: string
}

const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/tiff'
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Helper function to decode base64
const decode = (str: string): Uint8Array => {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export const useDocumentUpload = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Carregar documentos existentes do usuário
  useEffect(() => {
    if (user?.id) {
      loadUserDocuments()
    }
  }, [user?.id])

  const loadUserDocuments = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Error loading documents:', error)
        return
      }

      if (data) {
        const documentsWithUrls: Document[] = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = await supabase.storage
              .from('documentos')
              .createSignedUrl(`${user.id}/${file.name}`, 3600) // 1 hour

            return {
              id: file.id || file.name,
              fileName: file.name,
              fileType: file.metadata?.mimetype || 'unknown',
              size: file.metadata?.size || 0,
              uri: '',
              uploadDate: new Date(file.created_at || Date.now()).toLocaleDateString('pt-BR'),
              isUploaded: true,
              publicUrl: urlData?.signedUrl
            }
          })
        )

        setDocuments(documentsWithUrls)
      }
    } catch (error) {
      console.error('Error loading user documents:', error)
    }
  }

  const selectDocument = async (): Promise<SelectionResult> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [...SUPPORTED_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES],
        copyToCacheDirectory: true,
        multiple: false
      })

      if (result.canceled) {
        return { success: false, error: 'Seleção cancelada' }
      }

      const file = result.assets[0]

      // Validar tamanho do arquivo
      if (file.size && file.size > MAX_FILE_SIZE) {
        return { 
          success: false, 
          error: 'Arquivo muito grande. Tamanho máximo: 50MB' 
        }
      }

      // Validar tipo do arquivo
      if (file.mimeType && ![...SUPPORTED_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES].includes(file.mimeType)) {
        return { 
          success: false, 
          error: 'Tipo de arquivo não suportado' 
        }
      }

      await uploadDocument(file.uri, file.mimeType || 'application/octet-stream', file.name)
      return { success: true }

    } catch (error) {
      console.error('Document selection error:', error)
      return { 
        success: false, 
        error: 'Erro ao selecionar documento' 
      }
    }
  }

  const selectImageFromCamera = async (): Promise<SelectionResult> => {
    try {
      // Solicitar permissão da câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        return { 
          success: false, 
          error: 'Permissão da câmera é necessária' 
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (result.canceled) {
        return { success: false, error: 'Captura cancelada' }
      }

      const asset = result.assets[0]
      const fileName = `foto_documento_${Date.now()}.jpg`

      await uploadDocument(asset.uri, 'image/jpeg', fileName)
      return { success: true }

    } catch (error) {
      console.error('Camera selection error:', error)
      return { 
        success: false, 
        error: 'Erro ao capturar foto' 
      }
    }
  }

  const selectImageFromGallery = async (): Promise<SelectionResult> => {
    try {
      // Solicitar permissão da galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        return { 
          success: false, 
          error: 'Permissão da galeria é necessária' 
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (result.canceled) {
        return { success: false, error: 'Seleção cancelada' }
      }

      const asset = result.assets[0]
      const fileName = `documento_galeria_${Date.now()}.jpg`

      await uploadDocument(asset.uri, 'image/jpeg', fileName)
      return { success: true }

    } catch (error) {
      console.error('Gallery selection error:', error)
      return { 
        success: false, 
        error: 'Erro ao selecionar da galeria' 
      }
    }
  }

  const uploadDocument = async (
    fileUri: string, 
    fileType: string, 
    originalFileName?: string
  ): Promise<UploadResult> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const timestamp = Date.now()

    try {
      setIsUploading(true)

      // Gerar nome único para o arquivo
      const extension = originalFileName?.split('.').pop() || 'unknown'
      const fileName = `documento_${user.id}_${timestamp}.${extension}`
      const filePath = `${user.id}/${fileName}`

      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(fileUri)
      if (!fileInfo.exists) {
        throw new Error('Arquivo não encontrado')
      }

      // Criar documento temporário para mostrar progresso
      const tempDocument: Document = {
        id: `temp_${timestamp}`,
        fileName: originalFileName || fileName,
        fileType,
        size: fileInfo.size || 0,
        uri: fileUri,
        uploadDate: new Date().toLocaleDateString('pt-BR'),
        isUploading: true
      }

      setDocuments(prev => [tempDocument, ...prev])

      // Ler arquivo como base64 para upload
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Fazer upload usando o cliente Supabase com decode da base64
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(filePath, decode(base64), {
          contentType: fileType,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Obter URL assinada
      const { data: urlData } = await supabase.storage
        .from('documentos')
        .createSignedUrl(filePath, 3600) // 1 hour

      // Atualizar documento com sucesso
      const uploadedDocument: Document = {
        ...tempDocument,
        id: data.path,
        isUploading: false,
        isUploaded: true,
        publicUrl: urlData?.signedUrl
      }

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === tempDocument.id ? uploadedDocument : doc
        )
      )

      return { success: true, document: uploadedDocument }

    } catch (error: any) {
      console.error('Upload error:', error)

      // Atualizar documento com erro
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === `temp_${timestamp}` 
            ? { ...doc, isUploading: false, uploadError: error.message }
            : doc
        )
      )

      return { 
        success: false, 
        error: error.message || 'Erro ao fazer upload do documento' 
      }
    } finally {
      setIsUploading(false)
    }
  }

  const retryUpload = async (documentId: string): Promise<UploadResult> => {
    const document = documents.find(doc => doc.id === documentId)
    if (!document || !document.uploadError) {
      return { success: false, error: 'Documento não encontrado ou sem erro' }
    }

    return await uploadDocument(document.uri, document.fileType, document.fileName)
  }

  const deleteDocument = async (documentId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    try {
      const document = documents.find(doc => doc.id === documentId)
      if (!document) {
        return { success: false, error: 'Documento não encontrado' }
      }

      // Se for um documento temporário, apenas remover da lista
      if (documentId.startsWith('temp_')) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        return { success: true }
      }

      // Deletar do Supabase Storage
      const { error } = await supabase.storage
        .from('documentos')
        .remove([documentId])

      if (error) {
        throw error
      }

      // Remover da lista local
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))

      return { success: true }

    } catch (error: any) {
      console.error('Delete error:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar documento' 
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return 'image'
    if (fileType === 'application/pdf') return 'file-pdf-box'
    if (fileType.includes('word')) return 'file-word-box'
    if (fileType === 'text/plain') return 'file-document'
    return 'file'
  }

  return {
    documents,
    isUploading,
    selectDocument,
    selectImageFromCamera,
    selectImageFromGallery,
    uploadDocument,
    retryUpload,
    deleteDocument,
    formatFileSize,
    getFileIcon,
    loadUserDocuments
  }
} 