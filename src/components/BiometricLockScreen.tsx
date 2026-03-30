import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native'
import { Button, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as LocalAuthentication from 'expo-local-authentication'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

const { width } = Dimensions.get('window')

interface BiometricLockScreenProps {
  onSuccess: () => void
  onFallbackLogin: () => void
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  onSuccess,
  onFallbackLogin,
}) => {
  const [authFailed, setAuthFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const hasAttempted = useRef(false)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, scaleAnim])

  const attemptBiometric = useCallback(async () => {
    if (Platform.OS === 'web') {
      onSuccess()
      return
    }

    try {
      setAuthFailed(false)
      setErrorMessage('')

      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()

      if (!hasHardware || !isEnrolled) {
        onSuccess()
        return
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o app',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
        biometricsSecurityLevel: 'weak',
      })

      if (result.success) {
        onSuccess()
      } else {
        setAuthFailed(true)
        setErrorMessage(result.error || 'Autenticação cancelada')
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error)
      setAuthFailed(true)
      setErrorMessage('Erro ao verificar biometria')
    }
  }, [onSuccess])

  useEffect(() => {
    if (!hasAttempted.current) {
      hasAttempted.current = true
      const timer = setTimeout(attemptBiometric, 300)
      return () => clearTimeout(timer)
    }
  }, [attemptBiometric])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/siapep-splash.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.lockIconContainer}>
          <MaterialCommunityIcons
            name={authFailed ? 'lock-alert' : 'fingerprint'}
            size={48}
            color={
              authFailed
                ? LuvaBrancaColors.error
                : LuvaBrancaColors.primary
            }
          />
        </View>

        <Text style={styles.title}>
          {authFailed ? 'Autenticação necessária' : 'Verificando identidade...'}
        </Text>

        {authFailed && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => {
                hasAttempted.current = false
                attemptBiometric()
              }}
              style={styles.retryButton}
              buttonColor={LuvaBrancaColors.primary}
              textColor={LuvaBrancaColors.onPrimary}
              icon="fingerprint"
            >
              Tentar novamente
            </Button>

            <Button
              mode="outlined"
              onPress={onFallbackLogin}
              style={styles.fallbackButton}
              textColor={LuvaBrancaColors.onPrimary}
              icon="login"
            >
              Entrar com telefone
            </Button>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: width * 0.25,
    height: width * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  lockIconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: LuvaBrancaColors.textDisabled,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  retryButton: {
    borderRadius: 12,
  },
  fallbackButton: {
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
})

export default BiometricLockScreen
