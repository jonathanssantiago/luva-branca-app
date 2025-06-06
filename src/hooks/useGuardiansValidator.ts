/**
 * Hook simplificado para validação de guardiões
 * Integra com os utilitários para validação consistente
 */

import { useCallback, useMemo } from 'react'
import { Alert } from 'react-native'
import { Guardian } from '@/lib/supabase'
import { useGuardians } from './useGuardians'
import {
  validateGuardianForAlert,
  getValidationSummary
} from '@/src/utils/guardians'

interface GuardiansValidationSummary {
  validGuardians: Guardian[]
  invalidGuardians: Guardian[]
  totalCount: number
  validCount: number
  isReadyForAlert: boolean
  validationSummary: string
}

export const useGuardiansValidator = () => {
  const { guardians, getEmergencyContacts, refreshGuardians } = useGuardians()

  // Validação completa dos guardiões em tempo real
  const validation = useMemo((): GuardiansValidationSummary => {
    const emergencyContacts = getEmergencyContacts()
    const validGuardians: Guardian[] = []
    const invalidGuardians: Guardian[] = []

    emergencyContacts.forEach(guardian => {
      const result = validateGuardianForAlert(guardian)
      if (result.isValid) {
        validGuardians.push(guardian)
      } else {
        invalidGuardians.push(guardian)
      }
    })

    const totalCount = emergencyContacts.length
    const validCount = validGuardians.length
    const isReadyForAlert = validCount > 0

    return {
      validGuardians,
      invalidGuardians,
      totalCount,
      validCount,
      isReadyForAlert,
      validationSummary: getValidationSummary(emergencyContacts)
    }
  }, [getEmergencyContacts])

  // Verificar guardiões para alerta (com refresh)
  const checkGuardiansForAlert = useCallback(async (): Promise<{
    canSendAlert: boolean
    guardians: Guardian[]
    issues: string[]
  }> => {
    console.log('🔍 Verificando guardiões para alerta...')
    
    // Refresh para garantir dados atualizados
    await refreshGuardians()
    
    const { validGuardians, invalidGuardians, totalCount, validCount } = validation
    const issues: string[] = []

    if (totalCount === 0) {
      issues.push('Nenhum guardião cadastrado')
    }

    if (validCount === 0) {
      issues.push('Nenhum guardião válido disponível')
    }

    if (invalidGuardians.length > 0) {
      issues.push(`${invalidGuardians.length} guardião(ões) com problemas`)
    }

    console.log('📊 Resultado:', { total: totalCount, válidos: validCount })

    return {
      canSendAlert: validCount > 0,
      guardians: validGuardians,
      issues
    }
  }, [refreshGuardians, validation])

  // Mostrar relatório detalhado
  const showValidationReport = useCallback(() => {
    const { validGuardians, invalidGuardians, totalCount, validCount } = validation
    
    if (totalCount === 0) {
      Alert.alert(
        'Nenhum Guardião',
        'Você precisa cadastrar pelo menos um guardião antes de enviar alertas de emergência.',
        [{ text: 'OK' }]
      )
      return
    }

    if (validCount === totalCount) {
      Alert.alert(
        'Guardiões Válidos',
        `Todos os ${validCount} guardiões estão prontos para receber alertas.`,
        [{ text: 'OK' }]
      )
      return
    }

    // Mostrar detalhes dos problemas
    let message = `${validCount} de ${totalCount} guardiões válidos.\n\n`
    
    if (invalidGuardians.length > 0) {
      message += 'Problemas encontrados:\n'
      invalidGuardians.forEach((guardian, index) => {
        const validationResult = validateGuardianForAlert(guardian)
        message += `\n${index + 1}. ${guardian.name}:\n`
        validationResult.errors.forEach(error => {
          message += `   • ${error.message}\n`
        })
      })
    }

    Alert.alert('Status dos Guardiões', message, [{ text: 'OK' }])
  }, [validation])

  return {
    // Estado atual
    validGuardians: validation.validGuardians,
    invalidGuardians: validation.invalidGuardians,
    totalCount: validation.totalCount,
    validCount: validation.validCount,
    isReadyForAlert: validation.isReadyForAlert,
    validationSummary: validation.validationSummary,
    
    // Funções
    checkGuardiansForAlert,
    showValidationReport,
  }
} 