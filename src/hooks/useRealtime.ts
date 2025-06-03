import { useEffect, useRef, useState, useCallback } from 'react'
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/src/types/supabase'

export interface RealtimeHookReturn {
  isConnected: boolean
  error: string | null
  subscribe: () => void
  unsubscribe: () => void
}

// Hook genérico para Realtime - versão estável
export const useRealtimeStable = (
  table: string,
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void,
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void,
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void,
): RealtimeHookReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribingRef = useRef(false)

  // Usar refs para callbacks para evitar dependências em useEffect
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)

  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
  })

  const subscribe = useCallback(() => {
    if (channelRef.current || isSubscribingRef.current) {
      return // Evita múltiplas subscrições
    }

    isSubscribingRef.current = true

    try {
      const channel = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table },
          (payload) => {
            console.log(`INSERT em ${table}:`, payload)
            onInsertRef.current?.(payload)
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table },
          (payload) => {
            console.log(`UPDATE em ${table}:`, payload)
            onUpdateRef.current?.(payload)
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table },
          (payload) => {
            console.log(`DELETE em ${table}:`, payload)
            onDeleteRef.current?.(payload)
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            setError(null)
            console.log(`✅ Conectado ao realtime da tabela ${table}`)
          } else if (status === 'CHANNEL_ERROR') {
            setError(`Erro ao conectar com realtime da tabela ${table}`)
            setIsConnected(false)
            console.error(`❌ Erro no realtime da tabela ${table}`)
          } else if (status === 'TIMED_OUT') {
            setError(`Timeout ao conectar com realtime da tabela ${table}`)
            setIsConnected(false)
            console.warn(`⏰ Timeout no realtime da tabela ${table}`)
          } else if (status === 'CLOSED') {
            setIsConnected(false)
            console.log(`🔌 Desconectado do realtime da tabela ${table}`)
          }

          isSubscribingRef.current = false
        })

      channelRef.current = channel
    } catch (err: any) {
      setError(err.message || 'Erro ao configurar realtime')
      console.error('❌ Erro no realtime:', err)
      isSubscribingRef.current = false
    }
  }, [table]) // Apenas 'table' como dependência

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setIsConnected(false)
    }
    isSubscribingRef.current = false
  }, [])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
  }
}

// Hook específico para perfis
export const useProfilesRealtime = (
  onProfilesChange?: (profiles: Profile[]) => void,
) => {
  const [profiles, setProfiles] = useState<Profile[]>([])

  const handleInsert = (payload: RealtimePostgresChangesPayload<any>) => {
    const newProfile = payload.new as Profile
    setProfiles((prev) => {
      const updated = [...prev, newProfile]
      onProfilesChange?.(updated)
      return updated
    })
  }

  const handleUpdate = (payload: RealtimePostgresChangesPayload<any>) => {
    const updatedProfile = payload.new as Profile
    setProfiles((prev) => {
      const updated = prev.map((profile) =>
        profile.id === updatedProfile.id ? updatedProfile : profile,
      )
      onProfilesChange?.(updated)
      return updated
    })
  }

  const handleDelete = (payload: RealtimePostgresChangesPayload<any>) => {
    const deletedProfile = payload.old as Profile
    setProfiles((prev) => {
      const updated = prev.filter((profile) => profile.id !== deletedProfile.id)
      onProfilesChange?.(updated)
      return updated
    })
  }

  const realtimeHook = useRealtimeStable(
    'profiles',
    handleInsert,
    handleUpdate,
    handleDelete,
  )

  // Carregar perfis iniciais
  const loadInitialProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProfiles(data || [])
      onProfilesChange?.(data || [])
    } catch (err) {
      console.error('Erro ao carregar perfis iniciais:', err)
    }
  }

  useEffect(() => {
    loadInitialProfiles()
    realtimeHook.subscribe()

    return () => {
      realtimeHook.unsubscribe()
    }
  }, [realtimeHook.subscribe, realtimeHook.unsubscribe])

  return {
    profiles,
    ...realtimeHook,
    refreshProfiles: loadInitialProfiles,
  }
}

// Hook para presença (usuários online)
export const usePresence = (roomName: string = 'general') => {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [isPresenceConnected, setIsPresenceConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const joinPresence = (userData: any) => {
    if (channelRef.current) {
      leavePresence()
    }

    const channel = supabase.channel(roomName, {
      config: {
        presence: {
          key: userData.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users = Object.values(newState).flat()
        setOnlineUsers(users)
        console.log('Usuários online:', users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Usuário entrou:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Usuário saiu:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsPresenceConnected(true)
          await channel.track(userData)
        }
      })

    channelRef.current = channel
  }

  const leavePresence = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setIsPresenceConnected(false)
      setOnlineUsers([])
    }
  }

  useEffect(() => {
    return () => {
      leavePresence()
    }
  }, [])

  return {
    onlineUsers,
    isPresenceConnected,
    joinPresence,
    leavePresence,
  }
}
