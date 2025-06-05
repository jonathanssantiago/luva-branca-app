import { Image } from 'expo-image'
import { Formik } from 'formik'
import {
  Button,
  Surface,
  TextInput,
  HelperText,
  Text,
  Card,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper'
import * as Yup from 'yup'
import { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Pressable,
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'

import { styles } from '@/lib'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'
import { saveDisguisedModeCredentials } from '@/lib/utils'
import { useThemeExtendedColors, useTheme as useCustomTheme } from '@/src/context/ThemeContext'

const { width, height } = Dimensions.get('window')

const Login = () => {
  const theme = useTheme()
  const { isDark } = useCustomTheme()
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const { signIn, resendVerificationEmail, attemptBiometricLogin, saveCredentialsForBiometric } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<any>(null)
  const [currentEmail, setCurrentEmail] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  useEffect(() => {
    checkBiometricAvailability()
  }, [])

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      setBiometricAvailable(hasHardware && isEnrolled)
    } catch (error) {
      console.error('Error checking biometric availability:', error)
      setBiometricAvailable(false)
    }
  }

  const handleBiometricLogin = async () => {
    setLoading(true)
    setLoginError(null)

    try {
      const { success, error } = await attemptBiometricLogin()
      if (!success) {
        setLoginError(error)
      }
    } catch (error) {
      setLoginError({
        message: 'Erro ao autenticar com biometria. Tente novamente.',
        code: 'biometric_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true)
      const { error } = await signIn(values.email, values.password)

      if (error) {
        setLoginError(error)
        return
      }

      // Salvar credenciais para modo disfarçado
      await saveDisguisedModeCredentials(values.email, values.password)

      // Salvar credenciais para login biométrico se disponível
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      if (hasHardware && isEnrolled) {
        await saveCredentialsForBiometric(values.email, values.password)
      }

      // Navegar para a tela principal
      router.replace('/(tabs)')
    } catch (error) {
      console.error('Erro no login:', error)
      setLoginError({
        message: 'Erro inesperado durante o login. Tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleErrorAction = (action: string) => {
    switch (action) {
      case 'Esqueceu sua senha?':
      case 'Recuperar senha':
        router.push('/(auth)/forgot-password')
        break
      case 'Reenviar e-mail':
        handleResendEmail()
        break
      case 'Criar conta':
        router.push('/(auth)/signup')
        break
      default:
        break
    }
  }

  const handleResendEmail = async () => {
    if (!currentEmail) return

    setLoading(true)
    try {
      const { error } = await resendVerificationEmail(currentEmail)
      if (error) {
        setLoginError(error)
      } else {
        // Redirecionar para tela de verificação
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: currentEmail },
        })
      }
    } catch (error) {
      setLoginError({
        message: 'Erro ao reenviar e-mail. Tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setLoginError(null)
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "light-content"}
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
            <Card style={[loginStyles.formCard, { backgroundColor: colors.surface }]}>
              <View style={loginStyles.formHeader}>
                <Text style={[loginStyles.formTitle, { color: colors.textPrimary }]}>
                  Bem-vindo de volta
                </Text>
                <Text style={[loginStyles.formSubtitle, { color: colors.textSecondary }]}>
                  Faça login para continuar protegido
                </Text>
              </View>

              {/* Biometric Login Button */}
              {biometricAvailable && (
                <Button
                  mode="outlined"
                  onPress={handleBiometricLogin}
                  disabled={loading}
                  icon="fingerprint"
                  style={[loginStyles.biometricButton, { borderColor: colors.primary }]}
                  contentStyle={loginStyles.biometricButtonContent}
                  textColor={colors.primary}
                >
                  Entrar com biometria
                </Button>
              )}

              <Formik
                initialValues={{ email: '', password: '' }}
                onSubmit={handleLogin}
                validationSchema={Yup.object().shape({
                  email: Yup.string()
                    .email('Por favor, insira um e-mail válido')
                    .required('Por favor, insira o seu e-mail'),
                  password: Yup.string()
                    .min(6, 'Senha deve ter no mínimo 6 caracteres')
                    .required('Por favor, insira a sua senha'),
                })}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  setFieldValue,
                }) => (
                  <View style={loginStyles.form}>
                    {/* Campo E-mail */}
                    <View style={loginStyles.inputContainer}>
                      <TextInput
                        mode="outlined"
                        label="E-mail"
                        value={values.email}
                        error={!!(errors.email && touched.email)}
                        onBlur={handleBlur('email')}
                        left={<TextInput.Icon icon="email" />}
                        placeholder="exemplo@email.com"
                        onChangeText={(text) =>
                          handleChange('email')(text.toLowerCase())
                        }
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[loginStyles.input, { backgroundColor: colors.inputBackground }]}
                        outlineColor={colors.inputBorder}
                        activeOutlineColor={colors.primary}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.placeholder}
                      />
                      {errors.email && touched.email && (
                        <HelperText type="error">{errors.email}</HelperText>
                      )}
                    </View>

                    {/* Campo Senha */}
                    <View style={loginStyles.inputContainer}>
                      <TextInput
                        mode="outlined"
                        label="Senha"
                        value={values.password}
                        error={!!(errors.password && touched.password)}
                        onBlur={handleBlur('password')}
                        placeholder="Digite sua senha"
                        onChangeText={handleChange('password')}
                        left={<TextInput.Icon icon="lock" />}
                        right={
                          <TextInput.Icon
                            icon={showPassword ? 'eye-off' : 'eye'}
                            onPress={() => setShowPassword(!showPassword)}
                          />
                        }
                        secureTextEntry={!showPassword}
                        style={[loginStyles.input, { backgroundColor: colors.inputBackground }]}
                        outlineColor={colors.inputBorder}
                        activeOutlineColor={colors.primary}
                        textColor={colors.textPrimary}
                        placeholderTextColor={colors.placeholder}
                      />
                      {errors.password && touched.password && (
                        <HelperText type="error">{errors.password}</HelperText>
                      )}
                    </View>

                    {/* Botão de Login */}
                    <Button
                      mode="contained"
                      onPress={() => handleSubmit()}
                      disabled={loading}
                      loading={loading}
                      icon="login"
                      style={loginStyles.loginButton}
                      contentStyle={loginStyles.loginButtonContent}
                      buttonColor={colors.primary}
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>

                    {/* Componente de erro melhorado */}
                    {loginError && (
                      <AuthErrorDisplay
                        error={loginError}
                        onRetry={handleRetry}
                        onActionPress={handleErrorAction}
                        showRetryButton={false}
                        style={loginStyles.errorDisplay}
                      />
                    )}

                    {/* Link Esqueci Senha */}
                    <Button
                      mode="text"
                      textColor={colors.primary}
                      onPress={() => router.push('/(auth)/forgot-password')}
                      style={loginStyles.forgotButton}
                    >
                      Esqueci minha senha
                    </Button>
                  </View>
                )}
              </Formik>

              {/* Divider */}
              <View style={loginStyles.divider}>
                <View style={[loginStyles.dividerLine, { backgroundColor: colors.outline }]} />
                <Text style={[loginStyles.dividerText, { color: colors.textSecondary }]}>ou</Text>
                <View style={[loginStyles.dividerLine, { backgroundColor: colors.outline }]} />
              </View>

              {/* Signup Section */}
              <View style={loginStyles.signupSection}>
                <Text style={[loginStyles.signupText, { color: colors.textSecondary }]}>
                  Ainda não tem conta?
                </Text>
                <Button
                  mode="outlined"
                  textColor={colors.primary}
                  style={[loginStyles.signupButton, { borderColor: colors.primary }]}
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
  input: {
  },
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
  signupText: {
  },
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
  biometricButton: {
    marginBottom: 16,
    borderRadius: 12,
  },
  biometricButtonContent: {
    height: 48,
  },
})

export default Login
