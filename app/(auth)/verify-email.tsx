import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Button,
  Text,
  Card,
  useTheme,
} from 'react-native-paper'
import { useState } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import EmailVerificationComponent from '@/src/components/auth/EmailVerificationComponent'

const VerifyEmail = () => {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const { email } = useLocalSearchParams<{ email?: string }>()
  const { resendVerificationEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  const handleResend = async () => {
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
        message: 'Erro ao reenviar e-mail. Por favor, tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleResend()
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
        handleResend()
        break
      default:
        break
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <LinearGradient
        colors={[
          colors.primary,
          colors.primary + 'CC',
        ]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                  alt="Logo SIAPeP-M"
                  source={require('@/assets/images/siapep-splash.png')}
                  style={[styles.logo, { borderColor: colors.onPrimary }]}
                />
              </View>

              <Text style={[styles.appTitle, { color: colors.onPrimary }]}>
                Luva Branca
              </Text>

              <View style={styles.iconRow}>
                <MaterialCommunityIcons
                  name="email-check"
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
                    Verifique seu e-mail
                  </Text>
                  <Text
                    style={[
                      styles.contentSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {email
                      ? `Enviamos um link de verificação para ${email}`
                      : 'Verifique sua caixa de entrada'}
                  </Text>
                </View>

                {email ? (
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
        </KeyboardAvoidingView>
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
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
  },
})

export default VerifyEmail
