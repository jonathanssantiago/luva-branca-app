/**
 * Hook simplificado para gerenciamento de Guardiões
 * Implementa operações CRUD básicas e sincronização offline otimizada
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { supabase, Guardian } from '@/lib/supabase'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import * as SecureStore from 'expo-secure-store'
import {
  GuardianInput,
  validateGuardianInput,
  formatGuardianForDatabase,
  sortGuardiansByName,
  getActiveGuardians,
  GUARDIAN_LIMITS,
  OFFLINE_STORAGE_KEY,
  guardiansEventEmitter
} from '@/src/utils/guardians'

interface GuardiansState {
  guardians: Guardian[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

interface UseGuardiansReturn extends GuardiansState {
  addGuardian: (guardian: GuardianInput) => Promise<Guardian | null>
  updateGuardian: (id: string, updates: Partial<GuardianInput>) => Promise<boolean>
  removeGuardian: (id: string) => Promise<boolean>
  toggleActive: (id: string) => Promise<boolean>
  refreshGuardians: () => Promise<void>
  getEmergencyContacts: () => Guardian[]
  syncOfflineChanges: () => Promise<void>
  forceRefresh: () => Promise<void>
}

interface OfflineChange {
  action: 'add' | 'update' | 'delete'
  data: any
  timestamp: string
}

export { GuardianInput }

export const useGuardians = (): UseGuardiansReturn => {
  const { user } = useAuth()
  const [state, setState] = useState<GuardiansState>({
    guardians: [],
    loading: false,
    error: null,
    lastUpdated: null,
  })

  // Helper para atualizar estado
  const updateState = useCallback((updates: Partial<GuardiansState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString()
    }))
  }, [])

  // Helper para salvar mudanças offline
  const saveOfflineChange = useCallback(async (change: Omit<OfflineChange, 'timestamp'>) => {
    try {
      const existingChanges = await SecureStore.getItemAsync(OFFLINE_STORAGE_KEY)
      const changes: OfflineChange[] = existingChanges ? JSON.parse(existingChanges) : []
      
      changes.push({
        ...change,
        timestamp: new Date().toISOString()
      })

      await SecureStore.setItemAsync(OFFLINE_STORAGE_KEY, JSON.stringify(changes))
      console.log('💾 Mudança offline salva:', change.action)
    } catch (error) {
      console.error('❌ Erro ao salvar mudança offline:', error)
    }
  }, [])

  // Carregar guardiões do Supabase
  const loadGuardians = useCallback(async (showLoading = true) => {
    if (!user?.id) return

    if (showLoading) {
      updateState({ loading: true, error: null })
    }

    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      updateState({
        guardians: sortGuardiansByName(data || []),
        loading: false,
        error: null
      })

      console.log('✅ Guardiões carregados:', data?.length || 0)
    } catch (error: any) {
      console.error('❌ Erro ao carregar guardiões:', error)
      updateState({
        loading: false,
        error: error.message || 'Erro ao carregar guardiões'
      })
    }
  }, [user?.id, updateState])

  // Adicionar guardião
  const addGuardian = useCallback(async (guardian: GuardianInput): Promise<Guardian | null> => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado')
      return null
    }

    // Validar entrada
    const validation = validateGuardianInput(guardian)
    if (!validation.isValid) {
      Alert.alert('Erro', validation.errors.map(e => e.message).join('\n'))
      return null
    }

    // Verificar limite
    if (state.guardians.length >= GUARDIAN_LIMITS.MAX_GUARDIANS) {
      Alert.alert('Limite atingido', `Você pode ter no máximo ${GUARDIAN_LIMITS.MAX_GUARDIANS} guardiões ativos`)
      return null
    }

    updateState({ loading: true, error: null })

    try {
      const guardianData = formatGuardianForDatabase(guardian, user.id)
      const { data, error } = await supabase
        .from('guardians')
        .insert(guardianData)
        .select()
        .single()

      if (error) throw error

      updateState({
        loading: false,
        guardians: sortGuardiansByName([...state.guardians, data]),
        error: null
      })

      console.log('✅ Guardião adicionado:', data.name)
      
      // Notificar outras instâncias sobre a mudança
      guardiansEventEmitter.emit()
      
      // Force refresh para garantir sincronização entre telas
      setTimeout(() => {
        console.log('🔄 Refresh automático após adicionar guardião')
        loadGuardians(false)
      }, 500)
      
      return data
    } catch (error: any) {
      console.error('❌ Erro ao adicionar guardião:', error)
      
      if (error.message?.includes('fetch')) {
        await saveOfflineChange({ action: 'add', data: guardian })
        Alert.alert('Offline', 'Guardião será adicionado quando a conexão for reestabelecida')
      } else {
        Alert.alert('Erro', error.message || 'Erro ao adicionar guardião')
      }

      updateState({ loading: false, error: error.message })
      return null
    }
  }, [user?.id, state.guardians, updateState, saveOfflineChange, loadGuardians])

  // Atualizar guardião
  const updateGuardian = useCallback(async (id: string, updates: Partial<GuardianInput>): Promise<boolean> => {
    if (!user?.id) return false

    updateState({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('guardians')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      updateState({
        loading: false,
        guardians: sortGuardiansByName(
          state.guardians.map(g => g.id === id ? { ...g, ...updates } : g)
        ),
        error: null
      })

      console.log('✅ Guardião atualizado:', id)
      
      // Notificar outras instâncias sobre a mudança
      guardiansEventEmitter.emit()
      
      // Force refresh para garantir sincronização entre telas
      setTimeout(() => {
        console.log('🔄 Refresh automático após atualizar guardião')
        loadGuardians(false)
      }, 500)
      
      return true
    } catch (error: any) {
      console.error('❌ Erro ao atualizar guardião:', error)
      
      if (error.message?.includes('fetch')) {
        await saveOfflineChange({ action: 'update', data: { id, ...updates } })
        Alert.alert('Offline', 'Alteração será aplicada quando a conexão for reestabelecida')
        return true
      }

      updateState({ loading: false, error: error.message })
      Alert.alert('Erro', error.message || 'Erro ao atualizar guardião')
      return false
    }
  }, [user?.id, state.guardians, updateState, saveOfflineChange, loadGuardians])

  // Remover guardião
  const removeGuardian = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) return false

    updateState({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('guardians')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      updateState({
        loading: false,
        guardians: state.guardians.filter(g => g.id !== id),
        error: null
      })

      console.log('✅ Guardião removido:', id)
      
      // Notificar outras instâncias sobre a mudança
      guardiansEventEmitter.emit()
      
      // Force refresh para garantir sincronização entre telas
      setTimeout(() => {
        console.log('🔄 Refresh automático após remover guardião')
        loadGuardians(false)
      }, 500)
      
      return true
    } catch (error: any) {
      console.error('❌ Erro ao remover guardião:', error)
      
      if (error.message?.includes('fetch')) {
        await saveOfflineChange({ action: 'delete', data: { id } })
        Alert.alert('Offline', 'Remoção será aplicada quando a conexão for reestabelecida')
        return true
      }

      updateState({ loading: false, error: error.message })
      Alert.alert('Erro', error.message || 'Erro ao remover guardião')
      return false
    }
  }, [user?.id, state.guardians, updateState, saveOfflineChange, loadGuardians])

  // Toggle ativo/inativo
  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    const guardian = state.guardians.find(g => g.id === id)
    if (!guardian) return false

    return await updateGuardian(id, { is_active: !guardian.is_active })
  }, [state.guardians, updateGuardian])

  // Refresh manual
  const refreshGuardians = useCallback(async () => {
    await loadGuardians()
  }, [loadGuardians])

  // Força refresh (usado em casos críticos)
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Força refresh dos guardiões')
    await loadGuardians(true)
  }, [loadGuardians])

  // Obter contatos de emergência
  const getEmergencyContacts = useCallback((): Guardian[] => {
    return getActiveGuardians(state.guardians)
  }, [state.guardians])

  // Sincronizar mudanças offline
  const syncOfflineChanges = useCallback(async () => {
    if (!user?.id) return

    try {
      const offlineChanges = await SecureStore.getItemAsync(OFFLINE_STORAGE_KEY)
      if (!offlineChanges) return

      const changes: OfflineChange[] = JSON.parse(offlineChanges)
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
          console.error('❌ Erro ao sincronizar mudança:', error)
        }
      }

      if (successCount > 0) {
        await SecureStore.deleteItemAsync(OFFLINE_STORAGE_KEY)
        Alert.alert('Sincronizado', `${successCount} alteração(ões) sincronizada(s)`)
        await refreshGuardians()
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
    }
  }, [user?.id, addGuardian, updateGuardian, removeGuardian, refreshGuardians])

  // Effects
  useEffect(() => {
    if (user?.id) {
      loadGuardians()
    }
  }, [user?.id, loadGuardians])

  // Effect para escutar mudanças de outras instâncias do hook
  useEffect(() => {
    const unsubscribe = guardiansEventEmitter.subscribe(() => {
      console.log('🔄 Evento de mudança nos guardiões recebido - atualizando lista')
      loadGuardians(false)
    })

    return unsubscribe
  }, [loadGuardians])

  useEffect(() => {
    const interval = setInterval(syncOfflineChanges, 30000)
    return () => clearInterval(interval)
  }, [syncOfflineChanges])

  return {
    ...state,
    addGuardian,
    updateGuardian,
    removeGuardian,
    toggleActive,
    refreshGuardians,
    getEmergencyContacts,
    syncOfflineChanges,
    forceRefresh,
  }
}
