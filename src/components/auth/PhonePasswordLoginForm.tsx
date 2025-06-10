import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Button, TextInput, HelperText, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

interface PhonePasswordLoginFormProps {
  onLoginStart?: () => void
  onLoginEnd?: () => void
  onError?: (error: any) => void
}

const validationSchema = Yup.object().shape({
  phone: Yup.string()
    .min(13, 'Telefone deve ter formato internacional (+5511999999999)')
    .required('Por favor, insira o seu telefone'),
  password: Yup.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Por favor, insira a sua senha'),
})

// Função para formatar telefone internacional
const formatPhoneInternational = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')

  // Se começar com +, mantém
  let formatted = value.startsWith('+') ? '+' : '+'

  // Adiciona os números formatados
  if (numbers.length > 0) {
    // Formato: +55 11 99999-9999
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

const PhonePasswordLoginForm = ({
  onLoginStart,
  onLoginEnd,
  onError,
}: PhonePasswordLoginFormProps) => {
  const colors = useThemeExtendedColors()
  const { signInWithPhone, saveCredentialsForBiometric } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<any>(null)
  const [currentPhone, setCurrentPhone] = useState('')

  const handleLogin = async (values: { phone: string; password: string }) => {
    try {
      setLoading(true)
      onLoginStart?.()

      // Remove formatação do telefone para enviar apenas números
      const cleanPhone = values.phone.replace(/\D/g, '')
      const formattedPhone = '+' + cleanPhone
      setCurrentPhone(formattedPhone)

      // Usar signInWithPhone do Supabase
      const { error } = await signInWithPhone(formattedPhone, values.password)

      if (error) {
        console.log('Login error:', error) // Debug log
        // Se for erro de telefone não confirmado, adicionar o telefone ao erro
        if (error.code === 'phone_not_confirmed') {
          setLoginError({ ...error, phone: formattedPhone })
        } else {
          setLoginError(error)
        }
        onError?.(error)
        return
      }

      // Salvar credenciais para biometria (sistema legado)
      try {
        await saveCredentialsForBiometric(formattedPhone, values.password)
      } catch (saveError) {
        console.warn('Erro ao salvar credenciais para biometria:', saveError)
      }

      // Navegar para a tela principal
      router.replace('/(tabs)')
    } catch (error) {
      console.error('Erro no login com telefone:', error)
      const authError = {
        message: 'Erro inesperado durante o login. Tente novamente.',
        code: 'unknown_error',
      }
      setLoginError(authError)
      onError?.(authError)
    } finally {
      setLoading(false)
      onLoginEnd?.()
    }
  }

  const handleErrorAction = (action: string) => {
    switch (action) {
      case 'Esqueceu sua senha?':
      case 'Recuperar senha':
        router.push('/(auth)/forgot-password')
        break
      case 'Verificar telefone':
        // Redirecionar para tela de verificação SMS
        if (currentPhone) {
          router.push({
            pathname: '/(auth)/verify-email',
            params: { phone: currentPhone },
          })
        }
        break
      case 'Criar conta':
        router.push('/(auth)/signup')
        break
      default:
        break
    }
  }

  const handleRetry = () => {
    setLoginError(null)
  }

  return (
    <Formik
      initialValues={{ phone: '+55 ', password: '' }}
      onSubmit={handleLogin}
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

          {/* Botão de Login */}
          <Button
            mode="contained"
            onPress={() => handleSubmit()}
            disabled={loading}
            loading={loading}
            icon="login"
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
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
              style={styles.errorDisplay}
            />
          )}

          {/* Link Esqueci Senha */}
          <Button
            mode="text"
            textColor={colors.primary}
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotButton}
          >
            Esqueci minha senha
          </Button>
        </View>
      )}
    </Formik>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    // Estilos são aplicados via props
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
  errorDisplay: {
    marginTop: 8,
  },
})

export default PhonePasswordLoginForm
