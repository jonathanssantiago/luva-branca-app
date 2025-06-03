import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Button,
  Text,
  Card,
  useTheme,
  ActivityIndicator,
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

const VerifyEmail = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { email } = useLocalSearchParams<{ email: string }>()
  const { resendVerificationEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  const handleResendEmail = async () => {
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

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={LuvaBrancaColors.primary}
      />
      <LinearGradient
        colors={[
          LuvaBrancaColors.primary,
          LuvaBrancaColors.primaryWithOpacity(0.8),
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
                style={styles.logo}
              />
            </View>

            <Text style={styles.appTitle}>Luva Branca</Text>

            <View style={styles.iconRow}>
              <MaterialCommunityIcons
                name="email-check"
                size={24}
                color={LuvaBrancaColors.onPrimary}
              />
            </View>
          </Animated.View>

          {/* Content Section */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.contentWrapper}
          >
            <Card style={styles.contentCard}>
              <View style={styles.contentHeader}>
                <Text style={styles.contentTitle}>Verifique seu e-mail</Text>
                <Text style={styles.contentSubtitle}>
                  Enviamos um link de verificação para {email}
                </Text>
              </View>

              <View style={styles.content}>
                <Text style={styles.instructions}>
                  Para continuar, por favor:
                </Text>
                <View style={styles.steps}>
                  <Text style={styles.step}>1. Abra seu e-mail</Text>
                  <Text style={styles.step}>
                    2. Clique no link de verificação
                  </Text>
                  <Text style={styles.step}>3. Volte para o aplicativo</Text>
                </View>

                {error && (
                  <AuthErrorDisplay
                    error={error}
                    onRetry={handleRetry}
                    onActionPress={handleErrorAction}
                    style={styles.errorContainer}
                  />
                )}

                {success && (
                  <Text style={styles.successText}>
                    E-mail reenviado com sucesso!
                  </Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleResendEmail}
                  disabled={loading}
                  loading={loading}
                  icon="email-sync"
                  style={styles.resendButton}
                  contentStyle={styles.resendButtonContent}
                  buttonColor={LuvaBrancaColors.primary}
                >
                  {loading ? 'Enviando...' : 'Reenviar e-mail'}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => router.push('/(auth)/login')}
                  style={styles.loginButton}
                  textColor={LuvaBrancaColors.primary}
                  icon="login"
                >
                  Voltar para o login
                </Button>
              </View>
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
    borderColor: LuvaBrancaColors.onPrimary,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LuvaBrancaColors.onPrimary,
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
    backgroundColor: 'white',
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 4,
  },
  contentSubtitle: {
    fontSize: 14,
    color: LuvaBrancaColors.textSecondary,
    textAlign: 'center',
  },
  content: {
    gap: 16,
  },
  instructions: {
    fontSize: 16,
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 8,
  },
  steps: {
    gap: 8,
    marginBottom: 16,
  },
  step: {
    fontSize: 14,
    color: LuvaBrancaColors.textSecondary,
  },
  errorContainer: {
    marginTop: 8,
  },
  successText: {
    color: LuvaBrancaColors.success,
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
    borderColor: LuvaBrancaColors.primary,
  },
})

export default VerifyEmail
