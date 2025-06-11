/**
 * Hook para gerenciamento do Diário de Segurança da Mulher
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import {
  SafetyDiaryEntry,
  CreateDiaryEntryInput,
  UpdateDiaryEntryInput,
  DiaryStatistics,
  DiaryImageUploadResult,
} from '@/src/types/diary'
import * as FileSystem from 'expo-file-system'

interface UseSafetyDiaryState {
  entries: SafetyDiaryEntry[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

interface UseSafetyDiaryReturn extends UseSafetyDiaryState {
  addEntry: (entry: CreateDiaryEntryInput) => Promise<SafetyDiaryEntry | null>
  updateEntry: (id: string, updates: UpdateDiaryEntryInput) => Promise<boolean>
  deleteEntry: (id: string) => Promise<boolean>
  getEntry: (id: string) => SafetyDiaryEntry | null
  refreshEntries: () => Promise<void>
  uploadDiaryImage: (
    imageUri: string,
    entryId?: string,
  ) => Promise<DiaryImageUploadResult>
  deleteDiaryImage: (imagePath: string) => Promise<boolean>
  getStatistics: () => Promise<DiaryStatistics>
  searchEntries: (searchTerm: string) => SafetyDiaryEntry[]
}

export const useSafetyDiary = (): UseSafetyDiaryReturn => {
  const { user } = useAuth()
  const [state, setState] = useState<UseSafetyDiaryState>({
    entries: [],
    loading: false,
    error: null,
    lastUpdated: null,
  })

  // Helper para atualizar estado
  const updateState = useCallback((updates: Partial<UseSafetyDiaryState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }))
  }, [])

  // Carregar entradas do Supabase
  const loadEntries = useCallback(
    async (showLoading = true) => {
      if (!user?.id) return

      if (showLoading) {
        updateState({ loading: true, error: null })
      }

      try {
        const { data, error } = await supabase
          .from('safety_diary_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('entry_date', { ascending: false })

        if (error) throw error

        updateState({
          entries: data || [],
          loading: false,
          error: null,
        })

        console.log('✅ Entradas do diário carregadas:', data?.length || 0)
      } catch (error: any) {
        console.error('❌ Erro ao carregar entradas do diário:', error)
        updateState({
          loading: false,
          error: error.message || 'Erro ao carregar entradas do diário',
        })
      }
    },
    [user?.id, updateState],
  )

  // Adicionar nova entrada
  const addEntry = useCallback(
    async (
      entryData: CreateDiaryEntryInput,
    ): Promise<SafetyDiaryEntry | null> => {
      if (!user?.id) {
        Alert.alert('Erro', 'Usuário não autenticado')
        return null
      }

      // Validação básica
      if (!entryData.title?.trim() || !entryData.content?.trim()) {
        Alert.alert('Erro', 'Título e relato são obrigatórios')
        return null
      }

      updateState({ loading: true, error: null })

      try {
        const entryToInsert = {
          user_id: user.id,
          title: entryData.title.trim(),
          content: entryData.content.trim(),
          location: entryData.location?.trim() || null,
          entry_date: entryData.entry_date || new Date().toISOString(),
          emotion: entryData.emotion || null,
          tags: entryData.tags || [],
          images: entryData.images || [],
          is_private: entryData.is_private ?? true,
        }

        const { data, error } = await supabase
          .from('safety_diary_entries')
          .insert(entryToInsert)
          .select()
          .single()

        if (error) throw error

        // Atualizar estado imediatamente e fazer refresh para garantir consistência
        updateState({
          loading: false,
          entries: [data, ...state.entries],
          error: null,
        })

        // Fazer refresh para garantir que temos os dados mais atualizados
        await loadEntries(false)

        console.log('✅ Entrada do diário adicionada:', data.title)
        return data
      } catch (error: any) {
        console.error('❌ Erro ao adicionar entrada do diário:', error)
        updateState({ loading: false, error: error.message })
        Alert.alert('Erro', error.message || 'Erro ao adicionar entrada')
        return null
      }
    },
    [user?.id, state.entries, updateState],
  )

  // Atualizar entrada
  const updateEntry = useCallback(
    async (id: string, updates: UpdateDiaryEntryInput): Promise<boolean> => {
      if (!user?.id) return false

      updateState({ loading: true, error: null })

      try {
        const { error } = await supabase
          .from('safety_diary_entries')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error

        // Atualizar estado imediatamente
        updateState({
          loading: false,
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, ...updates, updated_at: new Date().toISOString() }
              : entry,
          ),
          error: null,
        })

        // Fazer refresh para garantir que temos os dados mais atualizados
        await loadEntries(false)

        console.log('✅ Entrada do diário atualizada:', id)
        return true
      } catch (error: any) {
        console.error('❌ Erro ao atualizar entrada do diário:', error)
        updateState({ loading: false, error: error.message })
        Alert.alert('Erro', error.message || 'Erro ao atualizar entrada')
        return false
      }
    },
    [user?.id, state.entries, updateState],
  )

  // Deletar entrada
  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false

      updateState({ loading: true, error: null })

      try {
        // Primeiro, buscar a entrada para deletar imagens associadas
        const entryToDelete = state.entries.find((e) => e.id === id)

        // Deletar imagens do storage se existirem
        if (entryToDelete?.images && entryToDelete.images.length > 0) {
          const deletePromises = entryToDelete.images.map(async (imageUrl) => {
            try {
              // Extrair path da URL
              const urlParts = imageUrl.split('/')
              const fileName = urlParts[urlParts.length - 1]
              const imagePath = `${user.id}/${id}/${fileName}`

              const { error } = await supabase.storage
                .from('diary-photos')
                .remove([imagePath])

              if (error) {
                console.warn('Erro ao deletar imagem:', error)
              }
            } catch (error) {
              console.warn('Erro ao processar deleção de imagem:', error)
            }
          })

          await Promise.allSettled(deletePromises)
        }

        // Deletar entrada do banco
        const { error } = await supabase
          .from('safety_diary_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error

        updateState({
          loading: false,
          entries: state.entries.filter((entry) => entry.id !== id),
          error: null,
        })

        console.log('✅ Entrada do diário deletada:', id)
        return true
      } catch (error: any) {
        console.error('❌ Erro ao deletar entrada do diário:', error)
        updateState({ loading: false, error: error.message })
        Alert.alert('Erro', error.message || 'Erro ao deletar entrada')
        return false
      }
    },
    [user?.id, state.entries, updateState],
  )

  // Obter entrada específica
  const getEntry = useCallback(
    (id: string): SafetyDiaryEntry | null => {
      return state.entries.find((entry) => entry.id === id) || null
    },
    [state.entries],
  )

  // Refresh manual
  const refreshEntries = useCallback(async () => {
    await loadEntries()
  }, [loadEntries])

  // Upload de imagem do diário
  const uploadDiaryImage = useCallback(
    async (
      imageUri: string,
      entryId?: string,
    ): Promise<DiaryImageUploadResult> => {
      if (!user?.id) {
        console.error('❌ Upload falhou: Usuário não autenticado')
        return { url: null, path: null, error: 'Usuário não autenticado' }
      }

      console.log('📸 Iniciando upload de imagem:', imageUri)

      try {
        // Verificar se o arquivo existe
        const fileInfo = await FileSystem.getInfoAsync(imageUri)
        if (!fileInfo.exists) {
          throw new Error('Arquivo de imagem não encontrado')
        }

        console.log('📁 Arquivo encontrado:', fileInfo)

        // Converter URI para ArrayBuffer
        console.log('🔄 Convertendo imagem para ArrayBuffer...')
        const response = await fetch(imageUri)

        if (!response.ok) {
          throw new Error(`Erro ao ler arquivo: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        console.log('✅ ArrayBuffer criado:', arrayBuffer.byteLength, 'bytes')

        // Gerar nome único para o arquivo
        const timestamp = Date.now()
        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `diary_${timestamp}.${fileExt}`
        const folderPath = entryId ? `${user.id}/${entryId}` : `${user.id}/temp`
        const filePath = `${folderPath}/${fileName}`

        console.log('📋 Caminho do arquivo:', filePath)

        // Upload para o Supabase Storage
        console.log('⬆️ Fazendo upload para o Supabase Storage...')
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('diary-photos')
          .upload(filePath, arrayBuffer, {
            contentType: `image/${fileExt}`,
            upsert: false,
          })

        if (uploadError) {
          console.error('❌ Erro no upload:', uploadError)
          throw uploadError
        }

        console.log('✅ Upload concluído:', uploadData)

        // Obter URL pública (signed URL para bucket privado)
        console.log('🔗 Criando URL assinada...')
        const { data: urlData, error: urlError } = await supabase.storage
          .from('diary-photos')
          .createSignedUrl(filePath, 3600 * 24 * 7) // 1 semana

        if (urlError) {
          console.error('❌ Erro ao criar URL assinada:', urlError)
          throw urlError
        }

        console.log('✅ URL assinada criada:', urlData.signedUrl)

        return {
          url: urlData.signedUrl,
          path: filePath,
          error: null,
        }
      } catch (error: any) {
        console.error('❌ Erro no upload da imagem do diário:', error)
        return {
          url: null,
          path: null,
          error: error.message || 'Erro ao fazer upload da imagem',
        }
      }
    },
    [user?.id],
  )

  // Deletar imagem do diário
  const deleteDiaryImage = useCallback(
    async (imagePath: string): Promise<boolean> => {
      try {
        const { error } = await supabase.storage
          .from('diary-photos')
          .remove([imagePath])

        if (error) throw error

        console.log('✅ Imagem do diário deletada:', imagePath)
        return true
      } catch (error: any) {
        console.error('❌ Erro ao deletar imagem do diário:', error)
        return false
      }
    },
    [],
  )

  // Obter estatísticas
  const getStatistics = useCallback(async (): Promise<DiaryStatistics> => {
    if (!user?.id) {
      return {
        totalEntries: 0,
        entriesThisMonth: 0,
        mostUsedEmotion: null,
        mostUsedTags: [],
      }
    }

    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('safety_diary_entries')
        .select('emotion, tags, entry_date')
        .eq('user_id', user.id)

      if (error) throw error

      const entries = data || []
      const totalEntries = entries.length

      const entriesThisMonth = entries.filter(
        (entry) => new Date(entry.entry_date) >= startOfMonth,
      ).length

      // Calcular emoção mais usada
      const emotionCounts: Record<string, number> = {}
      entries.forEach((entry) => {
        if (entry.emotion) {
          emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1
        }
      })

      const mostUsedEmotion =
        Object.keys(emotionCounts).length > 0
          ? (Object.keys(emotionCounts).reduce((a, b) =>
              emotionCounts[a] > emotionCounts[b] ? a : b,
            ) as any)
          : null

      // Calcular tags mais usadas
      const tagCounts: Record<string, number> = {}
      entries.forEach((entry) => {
        entry.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      const mostUsedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]: [string, number]) => tag)

      return {
        totalEntries,
        entriesThisMonth,
        mostUsedEmotion,
        mostUsedTags,
      }
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error)
      return {
        totalEntries: 0,
        entriesThisMonth: 0,
        mostUsedEmotion: null,
        mostUsedTags: [],
      }
    }
  }, [user?.id])

  // Buscar entradas
  const searchEntries = useCallback(
    (searchTerm: string): SafetyDiaryEntry[] => {
      if (!searchTerm.trim()) return state.entries

      const term = searchTerm.toLowerCase().trim()
      return state.entries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(term) ||
          entry.content.toLowerCase().includes(term) ||
          entry.location?.toLowerCase().includes(term) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(term)),
      )
    },
    [state.entries],
  )

  // Effects
  useEffect(() => {
    if (user?.id) {
      loadEntries()
    }
  }, [user?.id, loadEntries])

  return {
    ...state,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    refreshEntries,
    uploadDiaryImage,
    deleteDiaryImage,
    getStatistics,
    searchEntries,
  }
}
