import { Image } from 'expo-image'
import { Button, Text, Card, useTheme } from 'react-native-paper'
import { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import {
  useThemeExtendedColors,
  useTheme as useCustomTheme,
} from '@/src/context/ThemeContext'
import { useBiometricAuth } from '@/src/hooks/useBiometricAuth'
import EmailLoginForm from '@/src/components/auth/EmailLoginForm'
import PhonePasswordLoginForm from '@/src/components/auth/PhonePasswordLoginForm'

const { width, height } = Dimensions.get('window')

const Login = () => {
  const theme = useTheme()
  const { isDark } = useCustomTheme()
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const { checkOfflineAccess } = useAuth()
  const {
    isEnabled: biometricEnabled,
    isAvailable: biometricAvailable,
    canAutoAuthenticate,
  } = useBiometricAuth()
  const [loading, setLoading] = useState(false)
  const [biometricChecked, setBiometricChecked] = useState(false)

  // Flag para determinar qual tipo de autenticação usar
  const usePhoneAuth = process.env.EXPO_PUBLIC_USE_PHONE_AUTH === 'true'

  useEffect(() => {
    checkAutomaticBiometricAccess()
  }, [biometricEnabled, biometricAvailable])

  // Verificação automática de biometria quando ativada nas configurações
  const checkAutomaticBiometricAccess = async () => {
    if (biometricChecked) return

    try {
      setBiometricChecked(true)
      console.log('🔐 Verificando acesso automático com biometria...')

      // Verificar se pode fazer autenticação automática
      const canAuto = await canAutoAuthenticate()

      if (!canAuto) {
        console.log('❌ Autenticação automática não disponível:', {
          biometricEnabled,
          biometricAvailable,
        })
        return
      }

      console.log('🔐 Tentando autenticação biométrica automática...')

      // Verificar se há sessão offline e se biometria está configurada
      const result = await checkOfflineAccess()

      if (result.biometricVerified) {
        console.log('✅ Biometria verificada automaticamente - redirecionando')
        router.replace('/(tabs)')
        return
      }

      if (result.requiresBiometric && result.hasAccess) {
        console.log(
          '⚠️ Biometria necessária mas não verificada automaticamente',
        )
        // Pode tentar novamente ou aguardar ação do usuário
      }
    } catch (error) {
      console.error('Erro na verificação automática de biometria:', error)
    }
  }

  const handleLoginStart = () => {
    setLoading(true)
  }

  const handleLoginEnd = () => {
    setLoading(false)
  }

  const handleLoginError = (error: any) => {
    console.error('Erro no login:', error)
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'light-content'}
        backgroundColor={colors.primary}
      />
      <LinearGradient
        colors={[
          colors.primary,
          colors.primary + 'CC', // 80% opacity
        ]}
        style={loginStyles.container}
      >
        <ScrollView
          contentContainerStyle={[
            loginStyles.scrollContainer,
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
            style={loginStyles.headerSection}
          >
            <View style={loginStyles.logoContainer}>
              <Image
                alt="Logo Luva Branca"
                source={require('@/assets/images/luva-branca-icon.png')}
                style={[loginStyles.logo, { borderColor: colors.onPrimary }]}
              />
            </View>

            <Text style={[loginStyles.appTitle, { color: colors.onPrimary }]}>
              Luva Branca
            </Text>

            <View style={loginStyles.iconRow}>
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color={colors.onPrimary}
              />
              <MaterialCommunityIcons
                name="heart"
                size={24}
                color={colors.onPrimary}
              />
              <MaterialCommunityIcons
                name="hand-heart"
                size={24}
                color={colors.onPrimary}
              />
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={loginStyles.formWrapper}
          >
            <Card
              style={[
                loginStyles.formCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={loginStyles.formHeader}>
                <Text
                  style={[loginStyles.formTitle, { color: colors.textPrimary }]}
                >
                  Bem-vindo de volta
                </Text>
                <Text
                  style={[
                    loginStyles.formSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Faça login para continuar protegido
                </Text>
              </View>

              {/* Renderizar formulário baseado na configuração */}
              {usePhoneAuth ? (
                <PhonePasswordLoginForm
                  onLoginStart={handleLoginStart}
                  onLoginEnd={handleLoginEnd}
                  onError={handleLoginError}
                />
              ) : (
                <EmailLoginForm
                  onLoginStart={handleLoginStart}
                  onLoginEnd={handleLoginEnd}
                  onError={handleLoginError}
                />
              )}

              {/* Divider */}
              <View style={loginStyles.divider}>
                <View
                  style={[
                    loginStyles.dividerLine,
                    { backgroundColor: colors.outline },
                  ]}
                />
                <Text
                  style={[
                    loginStyles.dividerText,
                    { color: colors.textSecondary },
                  ]}
                >
                  ou
                </Text>
                <View
                  style={[
                    loginStyles.dividerLine,
                    { backgroundColor: colors.outline },
                  ]}
                />
              </View>

              {/* Signup Section */}
              <View style={loginStyles.signupSection}>
                <Text
                  style={[
                    loginStyles.signupText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Ainda não tem conta?
                </Text>
                <Button
                  mode="outlined"
                  textColor={colors.primary}
                  style={[
                    loginStyles.signupButton,
                    { borderColor: colors.primary },
                  ]}
                  onPress={() => router.push('/(auth)/signup')}
                  icon="account-plus"
                >
                  Cadastre-se
                </Button>
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </>
  )
}

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Header
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
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 16,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
  },

  // Form
  formWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formCard: {
    padding: 24,
    borderRadius: 16,
    elevation: 8,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {},
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  loginButtonContent: {
    height: 48,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 8,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    textTransform: 'uppercase',
  },

  // Signup
  signupSection: {
    alignItems: 'center',
    gap: 8,
  },
  signupText: {},
  signupButton: {
    borderRadius: 12,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
  },
  errorDisplay: {
    marginTop: 8,
  },
})

export default Login
