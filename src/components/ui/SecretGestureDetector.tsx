import React, { useState, useRef } from 'react'
import { View, TouchableOpacity, ViewStyle } from 'react-native'

interface SecretGestureDetectorProps {
  onSecretActivated: () => void
  onGestureProgress?: (progress: number) => void
  children?: React.ReactNode
  style?: ViewStyle
  requiredTaps?: number
  timeWindow?: number // milliseconds
  tapSequence?: 'anywhere' | 'same-area'
}

export const SecretGestureDetector: React.FC<SecretGestureDetectorProps> = ({
  onSecretActivated,
  onGestureProgress,
  children,
  style,
  requiredTaps = 3,
  timeWindow = 1000,
  tapSequence = 'same-area',
}) => {
  const [tapCount, setTapCount] = useState(0)
  const [firstTapTime, setFirstTapTime] = useState(0)
  const [firstTapLocation, setFirstTapLocation] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePress = (event: any) => {
    const currentTime = Date.now()
    const tapLocation = {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    }

    // Reset se passou muito tempo desde o primeiro toque
    if (firstTapTime && currentTime - firstTapTime > timeWindow) {
      resetTaps()
      startNewSequence(currentTime, tapLocation)
      return
    }

    // Primeiro toque da sequência
    if (tapCount === 0) {
      startNewSequence(currentTime, tapLocation)
      return
    }

    // Verificar se o toque está na mesma área (se necessário)
    if (tapSequence === 'same-area') {
      const distance = Math.sqrt(
        Math.pow(tapLocation.x - firstTapLocation.x, 2) +
          Math.pow(tapLocation.y - firstTapLocation.y, 2),
      )

      // Se o toque está muito longe do primeiro, resetar
      if (distance > 50) {
        resetTaps()
        startNewSequence(currentTime, tapLocation)
        return
      }
    }

    const newTapCount = tapCount + 1
    
    // Notificar progresso
    onGestureProgress?.(newTapCount)

    if (newTapCount >= requiredTaps) {
      // Sequência secreta completada!
      onSecretActivated()
      resetTaps()
    } else {
      setTapCount(newTapCount)
    }
  }

  const startNewSequence = (
    time: number,
    location: { x: number; y: number },
  ) => {
    setTapCount(1)
    setFirstTapTime(time)
    setFirstTapLocation(location)
    
    // Notificar progresso do primeiro toque
    onGestureProgress?.(1)

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Configurar timeout para resetar a sequência
    timeoutRef.current = setTimeout(() => {
      resetTaps()
    }, timeWindow)
  }

  const resetTaps = () => {
    setTapCount(0)
    setFirstTapTime(0)
    setFirstTapLocation({ x: 0, y: 0 })
    
    // Notificar reset do progresso
    onGestureProgress?.(0)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={style}
      activeOpacity={1}
      accessible={false}
      accessibilityElementsHidden={true}
    >
      {children}
    </TouchableOpacity>
  )
}

export default SecretGestureDetector
