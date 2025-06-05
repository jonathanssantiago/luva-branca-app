import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

/**
 * Storage adapter que funciona tanto para web quanto para mobile
 * Na web usa localStorage, no mobile usa SecureStore
 */
export const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Para web, usar localStorage com fallback
    return {
      getItemAsync: async (key: string): Promise<string | null> => {
        try {
          if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            return (globalThis as any).localStorage.getItem(key)
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
        return null
      },
      setItemAsync: async (key: string, value: string): Promise<void> => {
        try {
          if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            ;(globalThis as any).localStorage.setItem(key, value)
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
      },
      deleteItemAsync: async (key: string): Promise<void> => {
        try {
          if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            ;(globalThis as any).localStorage.removeItem(key)
          }
        } catch (error) {
          console.warn('LocalStorage not available:', error)
        }
      },
    }
  } else {
    // Para mobile, usar SecureStore
    return {
      getItemAsync: SecureStore.getItemAsync,
      setItemAsync: SecureStore.setItemAsync,
      deleteItemAsync: SecureStore.deleteItemAsync,
    }
  }
}

// Instância global do storage adapter
export const storage = createStorageAdapter()

/**
 * Helper functions para uso comum
 */
export const StorageUtils = {
  // Salvar objeto JSON
  setObject: async (key: string, value: any): Promise<void> => {
    await storage.setItemAsync(key, JSON.stringify(value))
  },

  // Obter objeto JSON
  getObject: async <T = any>(key: string): Promise<T | null> => {
    try {
      const value = await storage.getItemAsync(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.warn(`Error parsing JSON for key ${key}:`, error)
      return null
    }
  },

  // Verificar se uma chave existe
  hasKey: async (key: string): Promise<boolean> => {
    const value = await storage.getItemAsync(key)
    return value !== null
  },

  // Limpar múltiplas chaves
  clearKeys: async (keys: string[]): Promise<void> => {
    await Promise.all(keys.map(key => storage.deleteItemAsync(key)))
  },

  // Obter todas as chaves (apenas web)
  getAllKeys: (): string[] => {
    if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const localStorage = (globalThis as any).localStorage
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) keys.push(key)
      }
      return keys
    }
    return []
  },
} 