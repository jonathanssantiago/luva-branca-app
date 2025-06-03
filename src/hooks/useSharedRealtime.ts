/**
 * Hook para gerenciamento compartilhado de canais Realtime
 * Evita múltiplas subscrições ao mesmo canal
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface ChannelSubscriber {
  id: string
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void
}

interface SharedChannel {
  channel: RealtimeChannel
  subscribers: Map<string, ChannelSubscriber>
  isConnected: boolean
}

// Gerenciador global de canais compartilhados
class RealtimeChannelManager {
  private channels = new Map<string, SharedChannel>()

  subscribe(
    table: string,
    subscriberId: string,
    callbacks: {
      onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void
      onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
      onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void
    },
  ): boolean {
    const channelKey = `public:${table}`

    // Se o canal já existe, apenas adiciona o subscriber
    if (this.channels.has(channelKey)) {
      const sharedChannel = this.channels.get(channelKey)!
      sharedChannel.subscribers.set(subscriberId, {
        id: subscriberId,
        ...callbacks,
      })
      console.log(`📡 Subscriber ${subscriberId} adicionado ao canal ${table}`)
      return sharedChannel.isConnected
    }

    // Cria novo canal compartilhado
    console.log(`🆕 Criando novo canal compartilhado para ${table}`)

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => {
          console.log(`INSERT em ${table}:`, payload)
          const sharedChannel = this.channels.get(channelKey)
          if (sharedChannel) {
            sharedChannel.subscribers.forEach((subscriber) => {
              subscriber.onInsert?.(payload)
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        (payload) => {
          console.log(`UPDATE em ${table}:`, payload)
          const sharedChannel = this.channels.get(channelKey)
          if (sharedChannel) {
            sharedChannel.subscribers.forEach((subscriber) => {
              subscriber.onUpdate?.(payload)
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table },
        (payload) => {
          console.log(`DELETE em ${table}:`, payload)
          const sharedChannel = this.channels.get(channelKey)
          if (sharedChannel) {
            sharedChannel.subscribers.forEach((subscriber) => {
              subscriber.onDelete?.(payload)
            })
          }
        },
      )
      .subscribe((status) => {
        const sharedChannel = this.channels.get(channelKey)
        if (!sharedChannel) return

        if (status === 'SUBSCRIBED') {
          sharedChannel.isConnected = true
          console.log(`✅ Conectado ao realtime da tabela ${table}`)
        } else if (status === 'CHANNEL_ERROR') {
          sharedChannel.isConnected = false
          console.error(`❌ Erro no realtime da tabela ${table}`)
        } else if (status === 'TIMED_OUT') {
          sharedChannel.isConnected = false
          console.warn(`⏰ Timeout no realtime da tabela ${table}`)
        } else if (status === 'CLOSED') {
          sharedChannel.isConnected = false
          console.log(`🔌 Desconectado do realtime da tabela ${table}`)
        }
      })

    const sharedChannel: SharedChannel = {
      channel,
      subscribers: new Map([
        [subscriberId, { id: subscriberId, ...callbacks }],
      ]),
      isConnected: false,
    }

    this.channels.set(channelKey, sharedChannel)
    return false // Canal ainda não conectado
  }

  unsubscribe(table: string, subscriberId: string): void {
    const channelKey = `public:${table}`
    const sharedChannel = this.channels.get(channelKey)

    if (!sharedChannel) return

    // Remove o subscriber
    sharedChannel.subscribers.delete(subscriberId)
    console.log(`📡 Subscriber ${subscriberId} removido do canal ${table}`)

    // Se não há mais subscribers, remove o canal
    if (sharedChannel.subscribers.size === 0) {
      console.log(`🗑️ Removendo canal ${table} (sem subscribers)`)
      supabase.removeChannel(sharedChannel.channel)
      this.channels.delete(channelKey)
    }
  }

  isConnected(table: string): boolean {
    const channelKey = `public:${table}`
    return this.channels.get(channelKey)?.isConnected ?? false
  }

  getSubscriberCount(table: string): number {
    const channelKey = `public:${table}`
    return this.channels.get(channelKey)?.subscribers.size ?? 0
  }
}

// Instância global do gerenciador
const realtimeManager = new RealtimeChannelManager()

export interface SharedRealtimeHookReturn {
  isConnected: boolean
  subscriberCount: number
}

// Hook para usar realtime compartilhado
export const useSharedRealtime = (
  table: string,
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void,
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void,
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void,
): SharedRealtimeHookReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const subscriberId = useRef(`${table}_${Date.now()}_${Math.random()}`)

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
    const connected = realtimeManager.subscribe(table, subscriberId.current, {
      onInsert: (payload) => onInsertRef.current?.(payload),
      onUpdate: (payload) => onUpdateRef.current?.(payload),
      onDelete: (payload) => onDeleteRef.current?.(payload),
    })

    setIsConnected(connected)
    setSubscriberCount(realtimeManager.getSubscriberCount(table))
  }, [table])

  const unsubscribe = useCallback(() => {
    realtimeManager.unsubscribe(table, subscriberId.current)
    setIsConnected(false)
    setSubscriberCount(realtimeManager.getSubscriberCount(table))
  }, [table])

  // Verificar status da conexão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = realtimeManager.isConnected(table)
      const count = realtimeManager.getSubscriberCount(table)
      setIsConnected(connected)
      setSubscriberCount(count)
    }, 1000)

    return () => clearInterval(interval)
  }, [table])

  // Subscrever automaticamente
  useEffect(() => {
    subscribe()
    return () => unsubscribe()
  }, [subscribe, unsubscribe])

  return {
    isConnected,
    subscriberCount,
  }
}
