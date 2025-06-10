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

interface EmailLoginFormProps {
  onLoginStart?: () => void
  onLoginEnd?: () => void
  onError?: (error: any) => void
}

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Por favor, insira um e-mail válido')
    .required('Por favor, insira o seu e-mail'),
  password: Yup.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Por favor, insira a sua senha'),
})

const EmailLoginForm = ({
  onLoginStart,
  onLoginEnd,
  onError,
}: EmailLoginFormProps) => {
  const colors = useThemeExtendedColors()
  const { signIn, resendVerificationEmail, saveCredentialsForBiometric } =
    useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<any>(null)
  const [currentEmail, setCurrentEmail] = useState('')

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true)
      onLoginStart?.()

      setCurrentEmail(values.email)
      const { error } = await signIn(values.email, values.password)

      if (error) {
        setLoginError(error)
        onError?.(error)
        return
      }

      // Salvar credenciais para biometria (sistema legado)
      try {
        await saveCredentialsForBiometric(values.email, values.password)
      } catch (saveError) {
        console.warn('Erro ao salvar credenciais para biometria:', saveError)
      }

      // Navegar para a tela principal
      router.replace('/(tabs)')
    } catch (error) {
      console.error('Erro no login:', error)
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
    <Formik
      initialValues={{ email: '', password: '' }}
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
      }) => (
        <View style={styles.form}>
          {/* Campo E-mail */}
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="E-mail"
              value={values.email}
              error={!!(errors.email && touched.email)}
              onBlur={handleBlur('email')}
              left={<TextInput.Icon icon="email" />}
              placeholder="exemplo@email.com"
              onChangeText={(text) => handleChange('email')(text.toLowerCase())}
              keyboardType="email-address"
              autoCapitalize="none"
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
            {errors.email && touched.email && (
              <HelperText type="error">{errors.email}</HelperText>
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

export default EmailLoginForm
