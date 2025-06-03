import React, { createContext, useContext, ReactNode } from 'react'
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings'

interface DisguisedModeContextType {
  isDisguisedMode: boolean
  toggleDisguisedMode: () => void
  exitDisguisedMode: () => void
  enterDisguisedMode: () => void
}

const DisguisedModeContext = createContext<
  DisguisedModeContextType | undefined
>(undefined)

interface DisguisedModeProviderProps {
  children: ReactNode
}

export const DisguisedModeProvider: React.FC<DisguisedModeProviderProps> = ({
  children,
}) => {
  const { settings, updateSetting } = usePrivacySettings()

  const toggleDisguisedMode = () => {
    updateSetting('disguisedMode', !settings.disguisedMode)
  }

  const exitDisguisedMode = () => {
    updateSetting('disguisedMode', false)
  }

  const enterDisguisedMode = () => {
    updateSetting('disguisedMode', true)
  }

  const value: DisguisedModeContextType = {
    isDisguisedMode: settings.disguisedMode,
    toggleDisguisedMode,
    exitDisguisedMode,
    enterDisguisedMode,
  }

  return (
    <DisguisedModeContext.Provider value={value}>
      {children}
    </DisguisedModeContext.Provider>
  )
}

export const useDisguisedMode = (): DisguisedModeContextType => {
  const context = useContext(DisguisedModeContext)
  if (context === undefined) {
    throw new Error(
      'useDisguisedMode must be used within a DisguisedModeProvider',
    )
  }
  return context
}

export default DisguisedModeProvider
