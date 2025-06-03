import React, { useEffect, useState } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import PermissionsSetup from './PermissionsSetup'

interface PermissionsManagerProps {
  children: React.ReactNode
  userId?: string
}

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({
  children,
  userId,
}) => {
  const {
    permissions,
    firstTimeSetup,
    allGranted,
    loading,
    recheckPermissions,
  } = usePermissions()

  const [showPermissionsSetup, setShowPermissionsSetup] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Verificar permissões quando o usuário estiver logado
  useEffect(() => {
    const initializePermissions = async () => {
      if (!userId) {
        setIsInitialized(true)
        return
      }

      try {
        // Aguardar carregamento das permissões
        if (loading) {
          return
        }

        // Mostrar setup se for primeira vez ou se permissões críticas estiverem negadas
        const shouldShowSetup =
          firstTimeSetup ||
          permissions.location !== 'granted' ||
          permissions.notifications !== 'granted'

        setShowPermissionsSetup(shouldShowSetup)
      } catch (error) {
        console.error('Erro ao inicializar permissões:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializePermissions()
  }, [userId, loading, firstTimeSetup, permissions])

  const handlePermissionsComplete = (allGranted: boolean) => {
    setShowPermissionsSetup(false)
    // Se necessário, pode fazer algo com o resultado
    if (allGranted) {
      console.log('Todas as permissões foram concedidas')
    }
  }

  const handlePermissionsSkip = () => {
    setShowPermissionsSetup(false)
  }

  // Não renderizar nada até que as permissões sejam verificadas
  if (!isInitialized || loading) {
    return null
  }

  return (
    <>
      {children}
      <PermissionsSetup
        visible={showPermissionsSetup}
        onComplete={handlePermissionsComplete}
        onSkip={handlePermissionsSkip}
      />
    </>
  )
}
