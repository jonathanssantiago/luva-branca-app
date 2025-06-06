/**
 * Utilitários compartilhados para gerenciamento de Guardiões
 */

import { Guardian } from '@/lib/supabase'

export interface GuardianInput {
  name: string
  phone: string
  relationship: string
  is_active?: boolean
}

export interface ValidationError {
  field: string
  message: string
}

export interface GuardianValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Valida os dados de entrada de um guardião
 */
export const validateGuardianInput = (guardian: GuardianInput): GuardianValidationResult => {
  const errors: ValidationError[] = []

  // Validar nome
  if (!guardian.name?.trim() || guardian.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Nome deve ter pelo menos 2 caracteres' })
  }

  // Validar telefone (formato brasileiro)
  const cleanPhone = guardian.phone?.replace(/\D/g, '') || ''
  if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
    errors.push({ field: 'phone', message: 'Telefone deve ter 10 ou 11 dígitos' })
  }

  // Validar relacionamento
  if (!guardian.relationship?.trim() || guardian.relationship.trim().length < 2) {
    errors.push({ field: 'relationship', message: 'Parentesco deve ser informado' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida um guardião existente para alertas de emergência
 */
export const validateGuardianForAlert = (guardian: Guardian): GuardianValidationResult => {
  const errors: ValidationError[] = []

  // Verificar se está ativo
  if (!guardian.is_active) {
    errors.push({ field: 'is_active', message: 'Guardião está inativo' })
  }

  // Validar dados básicos
  const basicValidation = validateGuardianInput(guardian)
  errors.push(...basicValidation.errors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Formata os dados do guardião para inserção no banco
 */
export const formatGuardianForDatabase = (guardian: GuardianInput, userId: string) => ({
  user_id: userId,
  name: guardian.name.trim(),
  phone: guardian.phone.trim(),
  relationship: guardian.relationship.trim(),
  is_active: guardian.is_active ?? true,
})

/**
 * Ordena lista de guardiões por nome
 */
export const sortGuardiansByName = (guardians: Guardian[]): Guardian[] => {
  return [...guardians].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Filtra apenas guardiões ativos
 */
export const getActiveGuardians = (guardians: Guardian[]): Guardian[] => {
  return guardians.filter(g => g.is_active)
}

/**
 * Gera mensagem de validação resumida
 */
export const getValidationSummary = (guardians: Guardian[]): string => {
  const totalCount = guardians.length
  const validGuardians = guardians.filter(g => validateGuardianForAlert(g).isValid)
  const validCount = validGuardians.length

  if (totalCount === 0) {
    return 'Nenhum guardião cadastrado'
  }
  
  if (validCount === totalCount) {
    return `Todos os ${validCount} guardiões estão válidos`
  }
  
  if (validCount === 0) {
    return 'Nenhum guardião válido encontrado'
  }
  
  return `${validCount} de ${totalCount} guardiões válidos`
}

/**
 * Constantes
 */
export const GUARDIAN_LIMITS = {
  MAX_GUARDIANS: 5,
  MIN_NAME_LENGTH: 2,
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 11,
} as const

export const OFFLINE_STORAGE_KEY = 'offline_guardians_changes' as const

/**
 * Sistema de eventos para sincronização entre instâncias do hook
 */
class GuardiansEventEmitter {
  private listeners: Array<() => void> = []

  subscribe(callback: () => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  emit() {
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Erro ao executar listener de guardiões:', error)
      }
    })
  }
}

export const guardiansEventEmitter = new GuardiansEventEmitter() 