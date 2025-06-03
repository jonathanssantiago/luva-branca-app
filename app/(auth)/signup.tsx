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
  Menu,
  Divider,
} from 'react-native-paper'
import * as Yup from 'yup'
import { useState } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { styles } from '@/lib'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'

const { width, height } = Dimensions.get('window')

const SignUp = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { signUp, resendVerificationEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [genderMenuVisible, setGenderMenuVisible] = useState(false)
  const [selectedGender, setSelectedGender] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginError, setLoginError] = useState<any>(null)
  const [currentEmail, setCurrentEmail] = useState('')

  const genderOptions = [
    { label: 'Masculino', value: 'masculino', icon: 'gender-male' },
    { label: 'Feminino', value: 'feminino', icon: 'gender-female' },
    { label: 'Não informar', value: 'nao_informar', icon: 'gender-non-binary' },
  ]

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
    }
  }

  // Função para formatar data de nascimento
  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1')
  }

  const onSubmit = async (values: {
    fullName: string
    cpf: string
    birthDate: string
    gender: string
    phone: string
    password: string
    confirmPassword: string
    email: string
  }) => {
    setLoading(true)
    setCurrentEmail(values.email)

    try {
      const { error, data } = await signUp(values.email, values.password, {
        full_name: values.fullName,
        phone: values.phone,
        birth_date: values.birthDate,
        gender: values.gender,
        cpf: values.cpf,
      })

      if (error) {
        console.error('Erro no cadastro:', error)
        setLoginError(error)
        return
      }

      if (data?.user) {
        // Mostrar mensagem de sucesso e instruções para verificar o email
        setLoginError(null)
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: values.email },
        })
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      setLoginError({
        message:
          'Ocorreu um erro ao fazer o cadastro. Por favor, tente novamente.',
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
      case 'Recuperar senha':
        router.push('/(auth)/forgot-password')
        break
      case 'Reenviar e-mail':
        handleResendEmail()
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
        barStyle="light-content"
        backgroundColor={LuvaBrancaColors.primary}
      />
      <LinearGradient
        colors={[
          LuvaBrancaColors.primary,
          LuvaBrancaColors.primaryWithOpacity(0.8),
        ]}
        style={signupStyles.container}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[
              signupStyles.scrollContainer,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom + 40,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header Section */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(600)}
              style={signupStyles.headerSection}
            >
              <View style={signupStyles.logoContainer}>
                <Image
                  alt="Logo Luva Branca"
                  source={require('@/assets/images/luva-branca-icon.png')}
                  style={signupStyles.logo}
                />
              </View>

              <Text style={signupStyles.appTitle}>Luva Branca</Text>

              <View style={signupStyles.iconRow}>
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
              style={signupStyles.formWrapper}
            >
              <Card style={signupStyles.formCard}>
                <View style={signupStyles.formHeader}>
                  <Text style={signupStyles.formTitle}>Cadastro rápido</Text>
                  <Text style={signupStyles.formSubtitle}>
                    Preencha seus dados para começar
                  </Text>
                </View>

                <Formik
                  initialValues={{
                    fullName: '',
                    cpf: '',
                    birthDate: '',
                    gender: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    email: '',
                  }}
                  onSubmit={onSubmit}
                  validationSchema={Yup.object().shape({
                    fullName: Yup.string()
                      .min(3, 'Nome deve ter pelo menos 3 caracteres')
                      .required('Por favor, insira o seu nome completo'),
                    cpf: Yup.string()
                      .min(14, 'CPF deve ter 11 dígitos')
                      .required('Por favor, insira o seu CPF'),
                    birthDate: Yup.string()
                      .min(10, 'Data inválida')
                      .required('Por favor, insira a sua data de nascimento'),
                    gender: Yup.string().required(
                      'Por favor, selecione o gênero',
                    ),
                    phone: Yup.string()
                      .min(14, 'Telefone deve ter pelo menos 10 dígitos')
                      .required('Por favor, insira o seu telefone'),
                    password: Yup.string()
                      .min(6, 'Senha deve ter no mínimo 6 caracteres')
                      .required('Por favor, insira uma senha'),
                    confirmPassword: Yup.string()
                      .oneOf([Yup.ref('password')], 'Senhas não coincidem')
                      .required('Por favor, confirme a senha'),
                    email: Yup.string()
                      .email('Por favor, insira um e-mail válido')
                      .required('Por favor, insira o seu e-mail'),
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
                    <View style={signupStyles.form}>
                      {/* Campo Nome Completo */}
                      <View style={signupStyles.inputContainer}>
                        <TextInput
                          mode="outlined"
                          label="Nome completo"
                          value={values.fullName}
                          error={!!(errors.fullName && touched.fullName)}
                          onBlur={handleBlur('fullName')}
                          left={<TextInput.Icon icon="account-circle" />}
                          placeholder="Digite seu nome completo"
                          onChangeText={handleChange('fullName')}
                          autoCapitalize="words"
                          style={signupStyles.input}
                          outlineColor={LuvaBrancaColors.border}
                          activeOutlineColor={LuvaBrancaColors.primary}
                        />
                        {errors.fullName && touched.fullName && (
                          <HelperText type="error">
                            {errors.fullName}
                          </HelperText>
                        )}
                      </View>

                      {/* Campo E-mail */}
                      <View style={signupStyles.inputContainer}>
                        <TextInput
                          mode="outlined"
                          label="E-mail"
                          value={values.email}
                          error={!!(errors.email && touched.email)}
                          onBlur={handleBlur('email')}
                          left={<TextInput.Icon icon="email" />}
                          placeholder="Digite seu e-mail"
                          onChangeText={(text) =>
                            handleChange('email')(text.toLowerCase())
                          }
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={signupStyles.input}
                          outlineColor={LuvaBrancaColors.border}
                          activeOutlineColor={LuvaBrancaColors.primary}
                        />
                        {errors.email && touched.email && (
                          <HelperText type="error">{errors.email}</HelperText>
                        )}
                      </View>

                      {/* Campo CPF */}
                      <View style={signupStyles.inputContainer}>
                        <TextInput
                          mode="outlined"
                          label="CPF"
                          value={values.cpf}
                          error={!!(errors.cpf && touched.cpf)}
                          onBlur={handleBlur('cpf')}
                          left={<TextInput.Icon icon="account" />}
                          placeholder="000.000.000-00"
                          onChangeText={(text) => {
                            const formatted = formatCPF(text)
                            setFieldValue('cpf', formatted)
                          }}
                          keyboardType="numeric"
                          maxLength={14}
                          style={signupStyles.input}
                          outlineColor={LuvaBrancaColors.border}
                          activeOutlineColor={LuvaBrancaColors.primary}
                        />
                        {errors.cpf && touched.cpf && (
                          <HelperText type="error">{errors.cpf}</HelperText>
                        )}
                      </View>

                      {/* Campo Data de Nascimento */}
                      <View style={signupStyles.inputContainer}>
                        <TextInput
                          mode="outlined"
                          label="Data de nascimento"
                          value={values.birthDate}
                          error={!!(errors.birthDate && touched.birthDate)}
                          onBlur={handleBlur('birthDate')}
                          left={<TextInput.Icon icon="calendar" />}
                          placeholder="DD/MM/AAAA"
                          onChangeText={(text) => {
                            const formatted = formatDate(text)
                            setFieldValue('birthDate', formatted)
                          }}
                          keyboardType="numeric"
                          maxLength={10}
                          style={signupStyles.input}
                          outlineColor={LuvaBrancaColors.border}
                          activeOutlineColor={LuvaBrancaColors.primary}
                        />
                        {errors.birthDate && touched.birthDate && (
                          <HelperText type="error">
                            {errors.birthDate}
                          </HelperText>
                        )}
                      </View>

                      {/* Campo Gênero */}
                      <View style={signupStyles.inputContainer}>
                        <Menu
                          visible={genderMenuVisible}
                          onDismiss={() => setGenderMenuVisible(false)}
                          anchor={
                            <Pressable
                              onPress={() => setGenderMenuVisible(true)}
                              style={{ width: '100%' }}
                            >
                              <TextInput
                                mode="outlined"
                                label="Gênero"
                                value={
                                  values.gender
                                    ? genderOptions.find(
                                        (g) => g.value === values.gender,
                                      )?.label
                                    : ''
                                }
                                error={!!(errors.gender && touched.gender)}
                                editable={false}
                                pointerEvents="none"
                                left={
                                  <TextInput.Icon icon="gender-male-female" />
                                }
                                right={<TextInput.Icon icon="chevron-down" />}
                                placeholder="Selecione seu gênero"
                                style={signupStyles.input}
                                outlineColor={LuvaBrancaColors.border}
                                activeOutlineColor={LuvaBrancaColors.primary}
                              />
                            </Pressable>
                          }
                        >
                          {genderOptions.map((option) => (
                            <Menu.Item
                              key={option.value}
                              onPress={() => {
                                setSelectedGender(option.value)
                                setFieldValue('gender', option.value)
                                setGenderMenuVisible(false)
                              }}
                              title={option.label}
                              leadingIcon={option.icon}
                            />
                          ))}
                        </Menu>
                        {errors.gender && touched.gender && (
                          <HelperText type="error">{errors.gender}</HelperText>
                        )}
                      </View>

                      {/* Campo Telefone */}
                      <View style={signupStyles.inputContainer}>
                        <TextInput
                          mode="outlined"
                          label="Telefone"
                          value={values.phone}
                          error={!!(errors.phone && touched.phone)}
                          onBlur={handleBlur('phone')}
                          left={<TextInput.Icon icon="phone" />}
                          placeholder="(11) 99999-9999"
                          onChangeText={(text) => {
                            const formatted = formatPhone(text)
                            setFieldValue('phone', formatted)
                          }}
                          keyboardType="phone-pad"
                          maxLength={15}
                          style={signupStyles.input}
                          outlineColor={LuvaBrancaColors.border}
                          activeOutlineColor={LuvaBrancaColors.primary}
                        />
                        {errors.phone && touched.phone && (
                          <HelperText type="error">{errors.phone}</HelperText>
                        )}
                      </View>

                      {/* Campo Senha */}
                      <View style={signupStyles.inputContainer}>
                        <TextInput
                          mode="outlined"
                          label="Senha"
                          value={values.password}
                          error={!!(errors.password && touched.password)}
                          onBlur={handleBlur('password')}
                          onChangeText={handleChange('password')}
                          left={<TextInput.Icon icon="lock" />}
                          right={
                            <TextInput.Icon
                              icon={showPassword ? 'eye-off' : 'eye'}
                              onPress={() => setShowPassword(!showPassword)}
                            />
                          }
                          placeholder="Digite uma senha"
                          secureTextEntry={!showPassword}
                          style={signupStyles.input}
                          outlineColor={LuvaBrancaColors.border}
                          activeOutlineColor={LuvaBrancaColors.primary}
                        />
                        {errors.password && touched.password && (
                          <HelperText type="error">
                            {errors.password}
                          </HelperText>
                        )}
                      </View>

                      {/* Campo Confirmação de Senha */}
                      <View style={signupStyles.inputContainer}>
                        <TextInput
                          mode="outlined"
                          label="Confirmar Senha"
                          value={values.confirmPassword}
                          error={
                            !!(
                              errors.confirmPassword && touched.confirmPassword
                            )
                          }
                          onBlur={handleBlur('confirmPassword')}
                          onChangeText={handleChange('confirmPassword')}
                          left={<TextInput.Icon icon="lock-check" />}
                          right={
                            <TextInput.Icon
                              icon={showConfirmPassword ? 'eye-off' : 'eye'}
                              onPress={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            />
                          }
                          placeholder="Confirme sua senha"
                          secureTextEntry={!showConfirmPassword}
                          style={signupStyles.input}
                          outlineColor={LuvaBrancaColors.border}
                          activeOutlineColor={LuvaBrancaColors.primary}
                        />
                        {errors.confirmPassword && touched.confirmPassword && (
                          <HelperText type="error">
                            {errors.confirmPassword}
                          </HelperText>
                        )}
                      </View>

                      {/* Botão de Cadastro */}
                      <Button
                        mode="contained"
                        onPress={() => handleSubmit()}
                        disabled={loading}
                        loading={loading}
                        icon="account-plus"
                        style={signupStyles.signupButton}
                        contentStyle={signupStyles.signupButtonContent}
                        buttonColor={LuvaBrancaColors.primary}
                      >
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                      </Button>

                      {loginError && (
                        <AuthErrorDisplay
                          error={loginError}
                          onRetry={handleRetry}
                          onActionPress={handleErrorAction}
                          style={signupStyles.errorContainer}
                        />
                      )}
                    </View>
                  )}
                </Formik>

                {/* Divider */}
                <View style={signupStyles.divider}>
                  <View style={signupStyles.dividerLine} />
                  <Text style={signupStyles.dividerText}>ou</Text>
                  <View style={signupStyles.dividerLine} />
                </View>

                {/* Login Section */}
                <View style={signupStyles.loginSection}>
                  <Text style={signupStyles.loginText}>Já tem uma conta?</Text>
                  <Button
                    mode="outlined"
                    textColor={LuvaBrancaColors.primary}
                    style={signupStyles.loginButton}
                    onPress={() => router.push('/(auth)/login')}
                    icon="login"
                  >
                    Entrar
                  </Button>
                </View>
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  )
}

const signupStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
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
    gap: 12,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'white',
  },
  signupButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  signupButtonContent: {
    height: 48,
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

  // Error
  errorContainer: {
    marginTop: 12,
  },

  // Login
  loginSection: {
    alignItems: 'center',
    gap: 8,
  },
  loginText: {
    fontSize: 14,
    color: LuvaBrancaColors.textSecondary,
  },
  loginButton: {
    borderRadius: 12,
    borderColor: LuvaBrancaColors.primary,
  },
})

export default SignUp
