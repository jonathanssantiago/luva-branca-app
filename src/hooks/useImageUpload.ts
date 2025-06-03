import { useState } from 'react'
import { Platform, Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'

// Import dinâmico para evitar problemas de módulos nativos
let ImagePicker: any = null

// Inicializar ImagePicker de forma segura
const initializeImagePicker = async () => {
  if (ImagePicker) return ImagePicker

  try {
    ImagePicker = await import('expo-image-picker')
    return ImagePicker
  } catch (error) {
    console.warn('expo-image-picker não está disponível:', error)
    return null
  }
}

export interface ImageUploadResult {
  url: string | null
  path: string | null
  error: string | null
}

export const useImageUpload = () => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)

  // Verificar se o ImagePicker está disponível
  const isImagePickerAvailable = async (): Promise<boolean> => {
    const picker = await initializeImagePicker()
    return picker !== null
  }

  // Solicitar permissões para acessar a galeria
  const requestPermissions = async () => {
    const picker = await initializeImagePicker()
    if (!picker) {
      throw new Error('ImagePicker não está disponível')
    }

    const { status } = await picker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Permissão para acessar a galeria é necessária!')
    }
    return true
  }

  // Selecionar imagem da galeria
  const pickImage = async (): Promise<any | null> => {
    try {
      const picker = await initializeImagePicker()
      if (!picker) {
        Alert.alert('Erro', 'Funcionalidade de imagem não está disponível')
        return null
      }

      await requestPermissions()

      const result = await picker.launchImageLibraryAsync({
        mediaTypes: picker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1], // Formato quadrado para avatares
        quality: 0.8,
        base64: false,
      })

      return result
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error)
      Alert.alert('Erro', 'Não foi possível acessar a galeria')
      return null
    }
  }

  // Tirar foto com a câmera
  const takePhoto = async (): Promise<any | null> => {
    try {
      const picker = await initializeImagePicker()
      if (!picker) {
        Alert.alert('Erro', 'Funcionalidade de câmera não está disponível')
        return null
      }

      const { status } = await picker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Permissão para acessar a câmera é necessária!')
      }

      const result = await picker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      })

      return result
    } catch (error) {
      console.error('Erro ao tirar foto:', error)
      Alert.alert('Erro', 'Não foi possível acessar a câmera')
      return null
    }
  }

  // Converter URI local para ArrayBuffer
  const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
    const response = await fetch(uri)
    return await response.arrayBuffer()
  }

  // Upload de avatar do usuário
  const uploadAvatar = async (imageUri: string): Promise<ImageUploadResult> => {
    if (!user) {
      return { url: null, path: null, error: 'Usuário não autenticado' }
    }

    setUploading(true)

    try {
      // Converter URI para ArrayBuffer
      const arrayBuffer = await uriToArrayBuffer(imageUri)

      // Gerar nome único para o arquivo
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${user.id}/avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true, // Substitui se já existir
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return {
        url: urlData.publicUrl,
        path: filePath,
        error: null,
      }
    } catch (error: any) {
      console.error('Erro no upload:', error)

      let errorMessage = 'Erro ao fazer upload da imagem'

      // Tratar erros específicos
      if (
        error?.error === 'Bucket not found' ||
        error?.message?.includes('Bucket not found')
      ) {
        errorMessage =
          'Bucket de storage não encontrado. Verifique a configuração do Supabase.'
      } else if (error?.message?.includes('unauthorized')) {
        errorMessage =
          'Você não tem permissão para fazer upload. Faça login novamente.'
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
    } finally {
      setUploading(false)
    }
  }

  // Upload genérico de imagem
  const uploadImage = async (
    imageUri: string,
    bucket: string,
    folder: string,
    fileName?: string,
  ): Promise<ImageUploadResult> => {
    if (!user) {
      return { url: null, path: null, error: 'Usuário não autenticado' }
    }

    setUploading(true)

    try {
      const arrayBuffer = await uriToArrayBuffer(imageUri)

      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg'
      const finalFileName = fileName || `${Date.now()}.${fileExt}`
      const filePath = `${folder}/${user.id}/${finalFileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        url: urlData.publicUrl,
        path: filePath,
        error: null,
      }
    } catch (error: any) {
      console.error('Erro no upload:', error)

      let errorMessage = 'Erro ao fazer upload da imagem'

      // Tratar erros específicos
      if (
        error?.error === 'Bucket not found' ||
        error?.message?.includes('Bucket not found')
      ) {
        errorMessage =
          'Bucket de storage não encontrado. Verifique a configuração do Supabase.'
      } else if (error?.message?.includes('unauthorized')) {
        errorMessage =
          'Você não tem permissão para fazer upload. Faça login novamente.'
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
    } finally {
      setUploading(false)
    }
  }

  // Deletar imagem
  const deleteImage = async (bucket: string, filePath: string) => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([filePath])

      if (error) {
        throw error
      }

      return { error: null }
    } catch (error: any) {
      console.error('Erro ao deletar imagem:', error)
      return { error: error.message }
    }
  }

  // Listar imagens de um usuário
  const listUserImages = async (bucket: string, folder: string) => {
    if (!user) return { data: [], error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(`${folder}/${user.id}`)

      if (error) {
        throw error
      }

      return { data: data || [], error: null }
    } catch (error: any) {
      console.error('Erro ao listar imagens:', error)
      return { data: [], error: error.message }
    }
  }

  return {
    uploading,
    isImagePickerAvailable,
    pickImage,
    takePhoto,
    uploadAvatar,
    uploadImage,
    deleteImage,
    listUserImages,
  }
}
