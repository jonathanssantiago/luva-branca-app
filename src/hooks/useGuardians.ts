/**
 * Hook para gerenciamento de Guardiões (contatos de emergência)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { supabase, Guardian } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import * as SecureStore from 'expo-secure-store'

// Tipos específicos para o hook
export interface GuardianInput {
  name: string
  phone: string
  relationship: string
  is_active?: boolean
}

export interface GuardiansState {
  guardians: Guardian[]
  loading: boolean
  error: string | null
}

interface UseGuardiansReturn extends GuardiansState {
  addGuardian: (guardian: GuardianInput) => Promise<Guardian | null>
  updateGuardian: (
    id: string,
    updates: Partial<GuardianInput>,
  ) => Promise<boolean>
  removeGuardian: (id: string) => Promise<boolean>
  toggleActive: (id: string) => Promise<boolean>
  refreshGuardians: () => Promise<void>
  getEmergencyContacts: () => Guardian[]
  syncOfflineChanges: () => Promise<void>
}

// Chave para armazenamento offline
const OFFLINE_GUARDIANS_KEY = 'offline_guardians_changes'

export const useGuardians = (): UseGuardiansReturn => {
  const { user } = useAuth()
  const [state, setState] = useState<GuardiansState>({
    guardians: [],
    loading: false,
    error: null,
  })

  // Carregar guardiões do Supabase
  const loadGuardians = useCallback(async () => {
    if (!user?.id) return

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      setState((prev) => ({
        ...prev,
        guardians: data || [],
        loading: false,
      }))
    } catch (error: any) {
      console.error('Erro ao carregar guardiões:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar guardiões',
      }))
    }
  }, [user?.id])

  // Adicionar guardião
  const addGuardian = useCallback(
    async (guardian: GuardianInput): Promise<Guardian | null> => {
      if (!user?.id) {
        Alert.alert('Erro', 'Usuário não autenticado')
        return null
      }

      // Validações
      if (
        !guardian.name.trim() ||
        !guardian.phone.trim() ||
        !guardian.relationship.trim()
      ) {
        Alert.alert('Erro', 'Nome, telefone e parentesco são obrigatórios')
        return null
      }

      if (state.guardians.length >= 5) {
        Alert.alert(
          'Limite atingido',
          'Você pode ter no máximo 5 guardiões ativos',
        )
        return null
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const guardianData = {
          user_id: user.id,
          name: guardian.name.trim(),
          phone: guardian.phone.trim(),
          relationship: guardian.relationship.trim(),
          is_active: true,
        }

        const { data, error } = await supabase
          .from('guardians')
          .insert(guardianData)
          .select()
          .single()

        if (error) {
          throw error
        }

        // Atualizar o estado local imediatamente (otimistic update)
        setState((prev) => ({
          ...prev,
          loading: false,
          guardians: [...prev.guardians, data].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        }))

        return data
      } catch (error: any) {
        console.error('Erro ao adicionar guardião:', error)

        // Se estiver offline, salvar para sincronizar depois
        if (error.message?.includes('fetch')) {
          await saveOfflineChange('add', guardian)
          Alert.alert(
            'Offline',
            'Guardião será adicionado quando a conexão for reestabelecida',
          )
        } else {
          Alert.alert('Erro', error.message || 'Erro ao adicionar guardião')
        }

        setState((prev) => ({ ...prev, loading: false, error: error.message }))
        return null
      }
    },
    [user?.id, state.guardians.length],
  )

  // Atualizar guardião
  const updateGuardian = useCallback(
    async (id: string, updates: Partial<GuardianInput>): Promise<boolean> => {
      if (!user?.id) return false

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const { error } = await supabase
          .from('guardians')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) {
          throw error
        }

        // Atualizar o estado local imediatamente (optimistic update)
        setState((prev) => ({
          ...prev,
          loading: false,
          guardians: prev.guardians
            .map((g) => (g.id === id ? { ...g, ...updates } : g))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))

        return true
      } catch (error: any) {
        console.error('Erro ao atualizar guardião:', error)

        // Se estiver offline, salvar para sincronizar depois
        if (error.message?.includes('fetch')) {
          await saveOfflineChange('update', { id, ...updates })
          Alert.alert(
            'Offline',
            'Alteração será aplicada quando a conexão for reestabelecida',
          )
          return true
        }

        setState((prev) => ({ ...prev, loading: false, error: error.message }))
        Alert.alert('Erro', error.message || 'Erro ao atualizar guardião')
        return false
      }
    },
    [user?.id],
  )

  // Remover guardião
  const removeGuardian = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const { error } = await supabase
          .from('guardians')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) {
          throw error
        }

        // Atualizar o estado local imediatamente (optimistic update)
        setState((prev) => ({
          ...prev,
          loading: false,
          guardians: prev.guardians.filter((g) => g.id !== id),
        }))

        return true
      } catch (error: any) {
        console.error('Erro ao remover guardião:', error)

        // Se estiver offline, salvar para sincronizar depois
        if (error.message?.includes('fetch')) {
          await saveOfflineChange('delete', { id })
          Alert.alert(
            'Offline',
            'Remoção será aplicada quando a conexão for reestabelecida',
          )
          return true
        }

        setState((prev) => ({ ...prev, loading: false, error: error.message }))
        Alert.alert('Erro', error.message || 'Erro ao remover guardião')
        return false
      }
    },
    [user?.id],
  )

  // Toggle ativo/inativo
  const toggleActive = useCallback(
    async (id: string): Promise<boolean> => {
      const guardian = state.guardians.find((g) => g.id === id)
      if (!guardian) return false

      return await updateGuardian(id, { is_active: !guardian.is_active })
    },
    [state.guardians, updateGuardian],
  )

  // Refresh manual
  const refreshGuardians = useCallback(async () => {
    await loadGuardians()
  }, [loadGuardians])

  // Obter todos os guardiões ativos (todos são contatos de emergência)
  const getEmergencyContacts = useCallback((): Guardian[] => {
    return state.guardians.filter((g) => g.is_active)
  }, [state.guardians])

  // Salvar mudanças offline para sincronizar depois
  const saveOfflineChange = async (
    action: 'add' | 'update' | 'delete',
    data: any,
  ) => {
    try {
      const existingChanges = await SecureStore.getItemAsync(
        OFFLINE_GUARDIANS_KEY,
      )
      const changes = existingChanges ? JSON.parse(existingChanges) : []

      changes.push({
        action,
        data,
        timestamp: new Date().toISOString(),
      })

      await SecureStore.setItemAsync(
        OFFLINE_GUARDIANS_KEY,
        JSON.stringify(changes),
      )
    } catch (error) {
      console.error('Erro ao salvar mudança offline:', error)
    }
  }

  // Sincronizar mudanças offline
  const syncOfflineChanges = useCallback(async () => {
    if (!user?.id) return

    try {
      const offlineChanges = await SecureStore.getItemAsync(
        OFFLINE_GUARDIANS_KEY,
      )
      if (!offlineChanges) return

      const changes = JSON.parse(offlineChanges)
      let successCount = 0

      for (const change of changes) {
        try {
          switch (change.action) {
            case 'add':
              await addGuardian(change.data)
              successCount++
              break
            case 'update':
              const { id, ...updateData } = change.data
              await updateGuardian(id, updateData)
              successCount++
              break
            case 'delete':
              await removeGuardian(change.data.id)
              successCount++
              break
          }
        } catch (error) {
          console.error('Erro ao sincronizar mudança:', error)
        }
      }

      if (successCount > 0) {
        await SecureStore.deleteItemAsync(OFFLINE_GUARDIANS_KEY)
        Alert.alert(
          'Sincronizado',
          `${successCount} alteração(ões) foi(ram) sincronizada(s)`,
        )
      }
    } catch (error) {
      console.error('Erro ao sincronizar mudanças offline:', error)
    }
  }, [user?.id, addGuardian, updateGuardian, removeGuardian])

  // Efeitos
  useEffect(() => {
    if (user?.id) {
      loadGuardians()
    }
  }, [user?.id, loadGuardians])

  return {
    ...state,
    addGuardian,
    updateGuardian,
    removeGuardian,
    toggleActive,
    refreshGuardians,
    getEmergencyContacts,
    syncOfflineChanges,
  }
}
