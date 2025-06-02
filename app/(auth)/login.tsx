import { Image } from 'expo-image'
import { router } from 'expo-router'
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

import { styles } from '@/lib'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

const { width, height } = Dimensions.get('window')

const Login = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSocialLoginReady, setIsSocialLoginReady] = useState(false)

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const onSubmit = async (values: { email: string; password: string }) => {
    setLoading(true)
    setLoginError(null)

    // MOCK: Login sempre aceita qualquer email/senha não vazios
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (!values.email || values.password.length < 6) {
      setLoginError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    router.replace('/(tabs)')
    setLoading(false)
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
                style={loginStyles.logo}
              />
            </View>

            <Text style={loginStyles.appTitle}>Luva Branca</Text>

            <View style={loginStyles.iconRow}>
              <MaterialCommunityIcons
                name="heart"
                size={16}
                color={LuvaBrancaColors.onPrimary}
              />
              <MaterialCommunityIcons
                name="security"
                size={18}
                color={LuvaBrancaColors.onPrimary}
              />
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={loginStyles.formWrapper}
          >
            <Card style={loginStyles.formCard}>
              <View style={loginStyles.formHeader}>
                <Text style={loginStyles.formTitle}>Acesse sua conta</Text>
                <Text style={loginStyles.formSubtitle}>
                  Entre com seus dados para continuar
                </Text>
              </View>

              <Formik
                initialValues={{ email: '', password: '' }}
                onSubmit={onSubmit}
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
                        onChangeText={handleChange('email')}
                        keyboardType="email-address"
                        style={loginStyles.input}
                        outlineColor={LuvaBrancaColors.border}
                        activeOutlineColor={LuvaBrancaColors.primary}
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
                        style={loginStyles.input}
                        outlineColor={LuvaBrancaColors.border}
                        activeOutlineColor={LuvaBrancaColors.primary}
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
                      buttonColor={LuvaBrancaColors.primary}
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>

                    {loginError && (
                      <HelperText type="error" style={loginStyles.errorText}>
                        {loginError}
                      </HelperText>
                    )}

                    {/* Link Esqueci Senha */}
                    <Button
                      mode="text"
                      textColor={LuvaBrancaColors.primary}
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
                <View style={loginStyles.dividerLine} />
                <Text style={loginStyles.dividerText}>ou</Text>
                <View style={loginStyles.dividerLine} />
              </View>

              {/* Signup Section */}
              <View style={loginStyles.signupSection}>
                <Text style={loginStyles.signupText}>Ainda não tem conta?</Text>
                <Button
                  mode="outlined"
                  textColor={LuvaBrancaColors.primary}
                  style={loginStyles.signupButton}
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
    borderColor: LuvaBrancaColors.onPrimary,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LuvaBrancaColors.onPrimary,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: LuvaBrancaColors.onPrimary,
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
    backgroundColor: 'white',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: LuvaBrancaColors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'white',
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
    backgroundColor: LuvaBrancaColors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: LuvaBrancaColors.textSecondary,
    textTransform: 'uppercase',
  },

  // Signup
  signupSection: {
    alignItems: 'center',
    gap: 8,
  },
  signupText: {
    fontSize: 14,
    color: LuvaBrancaColors.textSecondary,
  },
  signupButton: {
    borderRadius: 12,
    borderColor: LuvaBrancaColors.primary,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
  },
})

export default Login
