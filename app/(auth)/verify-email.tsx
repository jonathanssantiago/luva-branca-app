import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Button,
  Text,
  Card,
  useTheme,
  ActivityIndicator,
  TextInput,
  HelperText,
} from 'react-native-paper'
import { useState } from 'react'
import { View, StyleSheet, StatusBar, ScrollView } from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import EmailVerificationComponent from '@/src/components/auth/EmailVerificationComponent'
import SmsVerificationComponent from '@/src/components/auth/SmsVerificationComponent'

const VerifyEmail = () => {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const { email, phone } = useLocalSearchParams<{
    email?: string
    phone?: string
  }>()
  const { resendVerificationEmail, resendOtp, verifyOtp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)

  // Determinar se é verificação por email ou telefone
  const isPhoneVerification = !!phone
  const contactInfo = phone || email

  const handleVerifyOtp = async () => {
    if (!phone || !otpCode) return

    setVerifying(true)
    setError(null)

    try {
      const { error } = await verifyOtp(phone, otpCode)
      if (error) {
        setError(error)
      } else {
        // Sucesso na verificação - mostrar mensagem e redirecionar
        setVerificationSuccess(true)
        setTimeout(() => {
          router.replace('/(tabs)')
        }, 1500) // Aguarda 1.5s para mostrar a mensagem de sucesso
      }
    } catch (error) {
      console.error('Erro na verificação OTP:', error)
      setError({
        message: 'Erro na verificação. Por favor, tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await resendVerificationEmail(email)
      if (error) {
        setError(error)
      } else {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Erro ao reenviar e-mail:', error)
      setError({
        message: 'Erro ao reenviar o e-mail. Por favor, tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleErrorAction = (action: string) => {
    switch (action) {
      case 'Fazer login':
        router.push('/(auth)/login')
        break
      case 'Criar conta':
        router.push('/(auth)/signup')
        break
      case 'Reenviar e-mail':
        handleResendEmail()
        break
      default:
        break
    }
  }

  const handleRetry = () => {
    setError(null)
    handleResendEmail()
  }

  const handleResend = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (isPhoneVerification && phone) {
        const { error } = await resendOtp(phone)
        if (error) {
          setError(error)
        } else {
          setSuccess(true)
        }
      } else if (email) {
        const { error } = await resendVerificationEmail(email)
        if (error) {
          setError(error)
        } else {
          setSuccess(true)
        }
      }
    } catch (error) {
      console.error('Erro ao reenviar:', error)
      setError({
        message: isPhoneVerification
          ? 'Erro ao reenviar SMS. Por favor, tente novamente.'
          : 'Erro ao reenviar e-mail. Por favor, tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <LinearGradient
        colors={[
          colors.primary,
          colors.primary + 'CC', // 80% opacity
        ]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            style={styles.headerSection}
          >
            <View style={styles.logoContainer}>
              <Image
                alt="Logo Luva Branca"
                source={require('@/assets/images/luva-branca-icon.png')}
                style={[styles.logo, { borderColor: colors.onPrimary }]}
              />
            </View>

            <Text style={[styles.appTitle, { color: colors.onPrimary }]}>
              Luva Branca
            </Text>

            <View style={styles.iconRow}>
              <MaterialCommunityIcons
                name={isPhoneVerification ? 'message-text' : 'email-check'}
                size={24}
                color={colors.onPrimary}
              />
            </View>
          </Animated.View>

          {/* Content Section */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.contentWrapper}
          >
            <Card
              style={[styles.contentCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.contentHeader}>
                <Text
                  style={[styles.contentTitle, { color: colors.textPrimary }]}
                >
                  {isPhoneVerification
                    ? 'Verifique seu telefone'
                    : 'Verifique seu e-mail'}
                </Text>
                <Text
                  style={[
                    styles.contentSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {isPhoneVerification
                    ? `Enviamos um código SMS para ${phone}`
                    : `Enviamos um link de verificação para ${email}`}
                </Text>
              </View>

              {isPhoneVerification && phone ? (
                <SmsVerificationComponent
                  phone={phone}
                  otpCode={otpCode}
                  loading={loading}
                  verifying={verifying}
                  error={error}
                  success={success}
                  verificationSuccess={verificationSuccess}
                  colors={colors}
                  onOtpChange={setOtpCode}
                  onVerifyOtp={handleVerifyOtp}
                  onResend={handleResend}
                  onRetry={handleRetry}
                  onErrorAction={handleErrorAction}
                />
              ) : email ? (
                <EmailVerificationComponent
                  email={email}
                  loading={loading}
                  error={error}
                  success={success}
                  colors={colors}
                  onResend={handleResend}
                  onRetry={handleRetry}
                  onErrorAction={handleErrorAction}
                />
              ) : null}

              <Button
                mode="outlined"
                onPress={() => router.push('/(auth)/login')}
                style={[styles.loginButton, { borderColor: colors.primary }]}
                textColor={colors.primary}
                icon="login"
              >
                Voltar para o login
              </Button>
            </Card>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    height: 80,
    width: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  contentCard: {
    padding: 24,
    borderRadius: 16,
    elevation: 8,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    gap: 16,
  },
  instructions: {
    fontSize: 16,
    marginBottom: 8,
  },
  steps: {
    gap: 8,
    marginBottom: 16,
  },
  step: {
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 8,
  },
  successText: {
    textAlign: 'center',
    marginTop: 8,
  },
  resendButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  resendButtonContent: {
    height: 48,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  otpInput: {
    marginVertical: 16,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  verifyButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
})

export default VerifyEmail
