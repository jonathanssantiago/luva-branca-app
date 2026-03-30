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
  } = usePermissions()

  const [showPermissionsSetup, setShowPermissionsSetup] = useState(false)

  useEffect(() => {
    if (!userId || loading) return

    const shouldShowSetup =
      firstTimeSetup ||
      permissions.location !== 'granted' ||
      permissions.notifications !== 'granted' ||
      permissions.audio !== 'granted'

    setShowPermissionsSetup(shouldShowSetup)
  }, [userId, loading, firstTimeSetup, permissions])

  const handlePermissionsComplete = (granted: boolean) => {
    setShowPermissionsSetup(false)
  }

  const handlePermissionsSkip = () => {
    setShowPermissionsSetup(false)
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
