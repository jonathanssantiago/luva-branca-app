import React, { useState, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Button, TextInput, HelperText, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

interface SignupFormProps {
  onSignupStart?: () => void
  onSignupEnd?: () => void
  onError?: (error: any) => void
}

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .required('Por favor, insira o seu nome completo'),
  cpf: Yup.string()
    .min(14, 'CPF deve ter 11 dígitos')
    .required('Por favor, insira o seu CPF'),
  birthDate: Yup.string()
    .min(10, 'Data inválida')
    .required('Por favor, insira a sua data de nascimento'),
  phone: Yup.string()
    .min(13, 'Telefone deve ter formato internacional (+5511999999999)')
    .required('Por favor, insira o seu telefone'),
  password: Yup.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Por favor, insira uma senha'),
  confirmPassword: Yup.string()
    .required('Por favor, confirme a sua senha')
    .oneOf([Yup.ref('password')], 'As senhas não coincidem'),
})

// Função para formatar CPF
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

// Função para formatar telefone internacional
const formatPhoneInternational = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  let formatted = value.startsWith('+') ? '+' : '+'

  if (numbers.length > 0) {
    if (numbers.length <= 2) {
      formatted += numbers
    } else if (numbers.length <= 4) {
      formatted += numbers.slice(0, 2) + ' ' + numbers.slice(2)
    } else if (numbers.length <= 9) {
      formatted +=
        numbers.slice(0, 2) + ' ' + numbers.slice(2, 4) + ' ' + numbers.slice(4)
    } else {
      formatted +=
        numbers.slice(0, 2) +
        ' ' +
        numbers.slice(2, 4) +
        ' ' +
        numbers.slice(4, 9) +
        '-' +
        numbers.slice(9, 13)
    }
  }

  return formatted
}

// Função para formatar data de nascimento
const formatDate = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  return numbers
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})\d+?$/, '$1')
}

// Função para validar CPF
const isValidCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '')

  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let digit1 = (sum * 10) % 11
  if (digit1 === 10) digit1 = 0

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  let digit2 = (sum * 10) % 11
  if (digit2 === 10) digit2 = 0

  return (
    digit1 === parseInt(cleanCPF.charAt(9)) &&
    digit2 === parseInt(cleanCPF.charAt(10))
  )
}

const SignupForm = ({
  onSignupStart,
  onSignupEnd,
  onError,
}: SignupFormProps) => {
  const colors = useThemeExtendedColors()
  const { signUpWithPhone, verifyOtp, resendOtp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginError, setLoginError] = useState<any>(null)
  const [currentPhone, setCurrentPhone] = useState('')

  const handleSignup = async (values: {
    fullName: string
    cpf: string
    birthDate: string
    phone: string
    password: string
    confirmPassword: string
  }) => {
    try {
      setLoading(true)
      onSignupStart?.()

      // Validar CPF
      if (!isValidCPF(values.cpf)) {
        setLoginError({
          message: 'CPF inválido. Por favor, verifique o número digitado.',
          code: 'invalid_cpf',
        })
        return
      }

      // Validar data de nascimento (deve ser no passado)
      const [day, month, year] = values.birthDate.split('/')
      const birthDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      )
      const today = new Date()

      if (birthDate >= today) {
        setLoginError({
          message: 'Data de nascimento deve ser anterior à data atual.',
          code: 'invalid_birth_date',
        })
        return
      }

      // Remove formatação do telefone para enviar apenas números
      const cleanPhone = values.phone.replace(/\D/g, '')
      const formattedPhone = '+' + cleanPhone

      // Salvar telefone para verificação posterior
      setCurrentPhone(formattedPhone)

      // Converter data para formato ISO
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

      // Fazer cadastro via telefone com gênero fixo como feminino
      const { error, data } = await signUpWithPhone(
        formattedPhone,
        values.password,
        {
          full_name: values.fullName,
          birth_date: isoDate,
          gender: 'feminino',
          cpf: values.cpf.replace(/\D/g, ''), // CPF limpo
        },
      )

      if (error) {
        console.error('Erro no cadastro:', error)
        setLoginError(error)
        onError?.(error)
        return
      }

      if (data?.user) {
        // Redirecionar para verificação por SMS
        router.push({
          pathname: '/(auth)/verify-email',
          params: { phone: formattedPhone },
        })
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      const authError = {
        message:
          'Ocorreu um erro ao fazer o cadastro. Por favor, tente novamente.',
        code: 'unknown_error',
      }
      setLoginError(authError)
      onError?.(authError)
    } finally {
      setLoading(false)
      onSignupEnd?.()
    }
  }

  const handleErrorAction = (action: string) => {
    switch (action) {
      case 'Fazer login':
        router.push('/(auth)/login')
        break
      case 'Reenviar SMS':
        handleResendSMS()
        break
      default:
        break
    }
  }

  const handleResendSMS = async () => {
    if (!currentPhone) return

    setLoading(true)
    try {
      const { error } = await resendOtp(currentPhone)
      if (error) {
        setLoginError(error)
      } else {
        setLoginError({
          message: 'SMS reenviado com sucesso!',
          code: 'success',
        })
      }
    } catch (error) {
      setLoginError({
        message: 'Erro ao reenviar SMS. Tente novamente.',
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
    <Formik
      initialValues={{
        fullName: '',
        cpf: '',
        birthDate: '',
        phone: '+55 ',
        password: '',
        confirmPassword: '',
      }}
      onSubmit={handleSignup}
      validationSchema={validationSchema}
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
          {/* Campo Nome Completo */}
          <View style={styles.inputContainer}>
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
              autoCorrect={false}
              style={[
                styles.input,
                { backgroundColor: colors.inputBackground },
              ]}
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
            />
            {errors.fullName && touched.fullName && (
              <HelperText type="error">{errors.fullName}</HelperText>
            )}
          </View>

          {/* Campo CPF */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="CPF"
              value={values.cpf}
              error={!!(errors.cpf && touched.cpf)}
              onBlur={handleBlur('cpf')}
              left={<TextInput.Icon icon="card-account-details" />}
              placeholder="000.000.000-00"
              onChangeText={(text) => {
                const formatted = formatCPF(text)
                setFieldValue('cpf', formatted)
              }}
              keyboardType="numeric"
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
            {errors.cpf && touched.cpf && (
              <HelperText type="error">{errors.cpf}</HelperText>
            )}
          </View>

          {/* Campo Data de Nascimento */}
          <View style={styles.inputContainer}>
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
            {errors.birthDate && touched.birthDate && (
              <HelperText type="error">{errors.birthDate}</HelperText>
            )}
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

          {/* Campo Senha */}
          <View style={styles.inputContainer}>
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
              label="Confirmar senha"
              value={values.confirmPassword}
              error={!!(errors.confirmPassword && touched.confirmPassword)}
              onBlur={handleBlur('confirmPassword')}
              onChangeText={handleChange('confirmPassword')}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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
              <HelperText type="error">{errors.confirmPassword}</HelperText>
            )}
          </View>

          {/* Botão de Cadastro */}
          <Button
            mode="contained"
            onPress={() => handleSubmit()}
            disabled={loading}
            loading={loading}
            icon="account-plus"
            style={styles.signupButton}
            contentStyle={styles.signupButtonContent}
            buttonColor={colors.primary}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>

          {/* Componente de erro */}
          {loginError && (
            <AuthErrorDisplay
              error={loginError}
              onRetry={handleRetry}
              onActionPress={handleErrorAction}
              style={styles.errorContainer}
            />
          )}
        </View>
      )}
    </Formik>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    // Estilos são aplicados via props
  },
  signupButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  signupButtonContent: {
    height: 48,
  },
  errorContainer: {
    marginTop: 12,
  },
})

export default SignupForm
