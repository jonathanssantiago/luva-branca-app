import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Button, TextInput, HelperText, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { supabase } from '@/lib/supabase'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

interface ForgotPasswordPhoneProps {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: any) => void
}

// Esquema de validação para o primeiro passo (telefone)
const phoneValidationSchema = Yup.object().shape({
  phone: Yup.string()
    .min(13, 'Telefone deve ter formato internacional (+5511999999999)')
    .required('Por favor, insira o seu telefone'),
})

// Esquema de validação para o segundo passo (código e nova senha)
const resetValidationSchema = Yup.object().shape({
  code: Yup.string()
    .length(4, 'Código deve ter 4 dígitos')
    .required('Por favor, insira o código recebido'),
  password: Yup.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Por favor, insira uma nova senha'),
  confirmPassword: Yup.string()
    .required('Por favor, confirme a nova senha')
    .oneOf([Yup.ref('password')], 'As senhas não coincidem'),
})

// Função para formatar telefone internacional
const formatPhoneInternational = (value: string) => {
  const numbers = value.replace(/\D/g, '')

  if (numbers.length <= 2) {
    return '+' + numbers
  }

  let formatted = '+' + numbers.slice(0, 2)

  if (numbers.length > 2) {
    formatted += ' ' + numbers.slice(2, 4)
  }

  if (numbers.length > 4) {
    if (numbers.length <= 9) {
      formatted += ' ' + numbers.slice(4, 9)
    } else {
      formatted += ' ' + numbers.slice(4, 9) + '-' + numbers.slice(9, 13)
    }
  }

  return formatted
}

const ForgotPasswordPhone = ({
  onStart,
  onEnd,
  onError,
}: ForgotPasswordPhoneProps) => {
  const colors = useThemeExtendedColors()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [step, setStep] = useState<'phone' | 'reset' | 'success'>('phone')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Primeiro passo: Enviar OTP para o telefone
  const handleSendOtp = async (values: { phone: string }) => {
    try {
      setLoading(true)
      onStart?.()
      setError(null)

      // Remove formatação do telefone para enviar apenas números
      const cleanPhone = values.phone.replace(/\D/g, '')
      const formattedPhone = '+' + cleanPhone

      // Enviar OTP via Supabase
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (error) {
        if (error.message?.includes('rate limit')) {
          setError({
            message:
              'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
            code: 'rate_limit',
          })
        } else if (error.message?.includes('Invalid phone')) {
          setError({
            message:
              'Número de telefone inválido. Verifique o formato (+5511999999999).',
            code: 'invalid_phone',
          })
        } else {
          setError({
            message: 'Erro ao enviar código SMS. Tente novamente.',
            code: 'send_otp_error',
          })
        }
        onError?.(error)
        return
      }

      // Salvar telefone e avançar para próximo passo
      setPhone(formattedPhone)
      setStep('reset')
    } catch (error) {
      console.error('Erro ao enviar OTP:', error)
      const authError = {
        message: 'Erro inesperado ao enviar código. Tente novamente.',
        code: 'unknown_error',
      }
      setError(authError)
      onError?.(authError)
    } finally {
      setLoading(false)
      onEnd?.()
    }
  }

  // Segundo passo: Verificar OTP e redefinir senha
  const handleResetPassword = async (values: {
    code: string
    password: string
    confirmPassword: string
  }) => {
    try {
      setLoading(true)
      onStart?.()
      setError(null)

      // Primeiro, verificar o OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: values.code,
        type: 'sms',
      })

      if (verifyError) {
        if (
          verifyError.message?.includes('invalid') ||
          verifyError.message?.includes('expired')
        ) {
          setError({
            message: 'Código inválido ou expirado. Solicite um novo código.',
            code: 'invalid_otp',
          })
        } else if (verifyError.message?.includes('too many')) {
          setError({
            message: 'Muitas tentativas. Aguarde antes de tentar novamente.',
            code: 'rate_limit',
          })
        } else {
          setError({
            message: 'Erro ao verificar código. Tente novamente.',
            code: 'verify_error',
          })
        }
        onError?.(verifyError)
        return
      }

      // Se a verificação foi bem-sucedida, atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (updateError) {
        setError({
          message: 'Erro ao redefinir senha. Tente novamente.',
          code: 'update_password_error',
        })
        onError?.(updateError)
        return
      }

      // Se chegou até aqui, a senha foi redefinida com sucesso
      // Mostrar tela de sucesso
      setStep('success')

      // Aguardar 3 segundos e redirecionar para login
      setTimeout(() => {
        router.replace('/(auth)/login')
      }, 3000)
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      const authError = {
        message: 'Erro inesperado ao redefinir senha. Tente novamente.',
        code: 'unknown_error',
      }
      setError(authError)
      onError?.(authError)
    } finally {
      setLoading(false)
      onEnd?.()
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  const handleErrorAction = (action: string) => {
    switch (action) {
      case 'Fazer login':
        router.push('/(auth)/login')
        break
      case 'Criar conta':
        router.push('/(auth)/signup')
        break
      case 'Voltar':
        setStep('phone')
        setError(null)
        break
      default:
        break
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setError(null)
  }

  // Reenviar código OTP
  const handleResendOtp = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOtp({
        phone,
      })

      if (error) {
        setError({
          message: 'Erro ao reenviar código. Tente novamente.',
          code: 'resend_error',
        })
      }
    } catch (error) {
      setError({
        message: 'Erro inesperado ao reenviar código.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'phone' ? (
          // Primeiro passo: Inserir telefone
          <Formik
            key="phone-form"
            initialValues={{ phone: '+55 ' }}
            onSubmit={handleSendOtp}
            validationSchema={phoneValidationSchema}
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
              <View style={styles.form}>
                <View style={styles.headerSection}>
                  <MaterialCommunityIcons
                    name="phone-message"
                    size={48}
                    color={colors.primary}
                    style={styles.stepIcon}
                  />
                  <Text
                    style={[styles.stepTitle, { color: colors.textPrimary }]}
                  >
                    Verificação por SMS
                  </Text>
                  <Text
                    style={[
                      styles.instructions,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Digite seu número de telefone para receber um código de
                    verificação via SMS
                  </Text>
                </View>

                {/* Campo Telefone */}
                <View style={styles.inputContainer}>
                  <TextInput
                    mode="outlined"
                    label="Telefone"
                    value={values.phone}
                    error={!!(errors.phone && touched.phone)}
                    onBlur={handleBlur('phone')}
                    left={<TextInput.Icon icon="phone" />}
                    placeholder="+55 11 99999-9999"
                    onChangeText={(text) => {
                      const formatted = formatPhoneInternational(text)
                      setFieldValue('phone', formatted)
                    }}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBackground },
                    ]}
                    outlineColor={colors.inputBorder}
                    activeOutlineColor={colors.primary}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.placeholder}
                  />
                  {errors.phone && touched.phone && (
                    <HelperText type="error">{errors.phone}</HelperText>
                  )}
                </View>

                {/* Componente de erro */}
                {error && (
                  <AuthErrorDisplay
                    error={error}
                    onRetry={handleRetry}
                    onActionPress={handleErrorAction}
                    style={styles.errorContainer}
                  />
                )}

                {/* Botão Enviar Código */}
                <Button
                  mode="contained"
                  onPress={() => handleSubmit()}
                  disabled={loading}
                  loading={loading}
                  icon="message-text"
                  style={styles.sendButton}
                  contentStyle={styles.buttonContent}
                  buttonColor={colors.primary}
                >
                  {loading ? 'Enviando código...' : 'Enviar código'}
                </Button>
              </View>
            )}
          </Formik>
        ) : step === 'reset' ? (
          // Segundo passo: Inserir código e nova senha
          <Formik
            key="reset-form"
            initialValues={{ code: '', password: '', confirmPassword: '' }}
            onSubmit={handleResetPassword}
            validationSchema={resetValidationSchema}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.form}>
                <View style={styles.headerSection}>
                  <MaterialCommunityIcons
                    name="shield-lock"
                    size={48}
                    color={colors.primary}
                    style={styles.stepIcon}
                  />
                  <Text
                    style={[styles.stepTitle, { color: colors.textPrimary }]}
                  >
                    Nova Senha
                  </Text>
                  <Text
                    style={[
                      styles.instructions,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Digite o código de 4 dígitos enviado para {phone} e defina
                    sua nova senha
                  </Text>
                </View>

                {/* Campo Código */}
                <View style={styles.inputContainer}>
                  <TextInput
                    mode="outlined"
                    label="Código SMS"
                    value={values.code}
                    error={!!(errors.code && touched.code)}
                    onBlur={handleBlur('code')}
                    onChangeText={(text) => {
                      const numericText = text.replace(/\D/g, '').slice(0, 4)
                      handleChange('code')(numericText)
                    }}
                    placeholder="0000"
                    keyboardType="numeric"
                    maxLength={4}
                    left={<TextInput.Icon icon="numeric" />}
                    style={[
                      styles.input,
                      styles.codeInput,
                      { backgroundColor: colors.inputBackground },
                    ]}
                    outlineColor={colors.inputBorder}
                    activeOutlineColor={colors.primary}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.placeholder}
                    autoFocus
                  />
                  {errors.code && touched.code && (
                    <HelperText type="error">{errors.code}</HelperText>
                  )}
                </View>

                {/* Campo Nova Senha */}
                <View style={styles.inputContainer}>
                  <TextInput
                    mode="outlined"
                    label="Nova senha"
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
                    placeholder="Digite uma nova senha"
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBackground },
                    ]}
                    outlineColor={colors.inputBorder}
                    activeOutlineColor={colors.primary}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.placeholder}
                  />
                  {errors.password && touched.password && (
                    <HelperText type="error">{errors.password}</HelperText>
                  )}
                </View>

                {/* Campo Confirmar Senha */}
                <View style={styles.inputContainer}>
                  <TextInput
                    mode="outlined"
                    label="Confirmar nova senha"
                    value={values.confirmPassword}
                    error={
                      !!(errors.confirmPassword && touched.confirmPassword)
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
                    placeholder="Digite a senha novamente"
                    secureTextEntry={!showConfirmPassword}
                    autoCorrect={false}
                    style={[
                      styles.input,
                      { backgroundColor: colors.inputBackground },
                    ]}
                    outlineColor={colors.inputBorder}
                    activeOutlineColor={colors.primary}
                    textColor={colors.textPrimary}
                    placeholderTextColor={colors.placeholder}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <HelperText type="error">
                      {errors.confirmPassword}
                    </HelperText>
                  )}
                </View>

                {/* Componente de erro */}
                {error && (
                  <AuthErrorDisplay
                    error={error}
                    onRetry={handleRetry}
                    onActionPress={handleErrorAction}
                    style={styles.errorContainer}
                  />
                )}

                {/* Botão Redefinir Senha */}
                <Button
                  mode="contained"
                  onPress={() => handleSubmit()}
                  disabled={loading}
                  loading={loading}
                  icon="check"
                  style={styles.resetButton}
                  contentStyle={styles.buttonContent}
                  buttonColor={colors.primary}
                >
                  {loading ? 'Redefinindo senha...' : 'Redefinir senha'}
                </Button>

                {/* Seção de ações secundárias */}
                <View style={styles.secondaryActions}>
                  <Button
                    mode="text"
                    onPress={handleResendOtp}
                    disabled={loading}
                    textColor={colors.primary}
                    style={styles.resendButton}
                    icon="refresh"
                  >
                    Reenviar código
                  </Button>

                  <Button
                    mode="text"
                    onPress={handleBackToPhone}
                    textColor={colors.textSecondary}
                    style={styles.backButton}
                    icon="arrow-left"
                  >
                    Voltar
                  </Button>
                </View>
              </View>
            )}
          </Formik>
        ) : (
          // Terceiro passo: Sucesso
          <View style={styles.form}>
            <View style={styles.headerSection}>
              <MaterialCommunityIcons
                name="check-circle"
                size={80}
                color={colors.success || colors.primary}
                style={styles.stepIcon}
              />
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                Senha Alterada!
              </Text>
              <Text
                style={[styles.instructions, { color: colors.textSecondary }]}
              >
                Sua senha foi redefinida com sucesso. Você será redirecionado
                para o login em instantes.
              </Text>
            </View>

            <View style={styles.successActions}>
              <Button
                mode="contained"
                onPress={() => router.replace('/(auth)/login')}
                icon="login"
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                buttonColor={colors.primary}
              >
                Ir para Login
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  form: {
    flex: 1,
    gap: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  stepIcon: {
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    // Estilos são aplicados via props
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
  },
  sendButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  resetButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  secondaryActions: {
    marginTop: 24,
    gap: 8,
    alignItems: 'center',
  },
  resendButton: {
    marginBottom: 8,
  },
  backButton: {
    // Estilos aplicados via props
  },
  buttonContent: {
    height: 48,
  },
  errorContainer: {
    marginVertical: 8,
  },
  successActions: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 12,
    minWidth: 200,
  },
})

export default ForgotPasswordPhone
