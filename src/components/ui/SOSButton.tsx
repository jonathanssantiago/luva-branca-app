/**
 * Componente principal de SOS para emergências
 */

import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native'
import { useTheme } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { useEmergency } from '../../hooks'
import { Card } from './Card'

const { width } = Dimensions.get('window')

interface SOSButtonProps {
  onEmergencyCreated?: () => void
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onEmergencyCreated }) => {
  const theme = useTheme()
  const { createEmergency, loading } = useEmergency()
  const [isActivated, setIsActivated] = useState(false)

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handleSOSPress = () => {
    Alert.alert(
      'Emergência SOS',
      'Você tem certeza que deseja solicitar socorro? Esta ação enviará sua localização para os serviços de emergência.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: activateSOS,
        },
      ],
    )
  }

  const activateSOS = async () => {
    try {
      setIsActivated(true)

      // Animação de pulsação
      scale.value = withRepeat(withTiming(1.1, { duration: 500 }), -1, true)
      opacity.value = withRepeat(withTiming(0.7, { duration: 500 }), -1, true)

      await createEmergency({
        type: 'general',
        priority: 'high',
        description: 'Solicitação de socorro via botão SOS',
      })

      onEmergencyCreated?.()

      // Para a animação após 3 segundos
      setTimeout(() => {
        setIsActivated(false)
        scale.value = withTiming(1)
        opacity.value = withTiming(1)
      }, 3000)
    } catch (error) {
      setIsActivated(false)
      scale.value = withTiming(1)
      opacity.value = withTiming(1)
    }
  }

  return (
    <Card style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        Emergência
      </Text>

      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Pressione para solicitar socorro imediato
      </Text>

      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.sosButton,
            {
              backgroundColor: isActivated ? '#FF1744' : theme.colors.error,
            },
          ]}
          onPress={handleSOSPress}
          disabled={loading || isActivated}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={48} color="white" />
          <Text style={styles.sosText}>{isActivated ? 'ATIVADO' : 'SOS'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.warning, { color: theme.colors.error }]}>
        ⚠️ Use apenas em casos de emergência real
      </Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  sosButton: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  sosText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  warning: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
})
