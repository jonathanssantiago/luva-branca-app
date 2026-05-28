import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Button, Text, Card, TextInput, HelperText } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Formik } from 'formik'
import * as Yup from 'yup'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Locales } from '@/lib'
import {
  formatBrazilPhoneDisplay,
  isValidBrazilPhone,
  normalizePhoneToE164,
} from '@/lib/utils/phone'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'

const usePhoneAuth = process.env.EXPO_PUBLIC_USE_PHONE_AUTH === 'true'

const OTP_LENGTH = 4
const OTP_RESEND_SECONDS = 60
const MAX_OTP_ATTEMPTS = 3

const t = (key: string, options?: Record<string, string | number>) =>
  Locales.t(key, options)

const emailValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Por favor, insira um e-mail válido')
    .required('Por favor, insira o seu e-mail'),
})

const phoneStepSchema = Yup.object().shape({
  phone: Yup.string()
    .test(
      'valid-phone',
      'Informe um telefone válido com DDD (ex: 11 99999-9999)',
      (value) => (value ? isValidBrazilPhone(value) : false),
    )
    .required('Por favor, insira o seu telefone'),
})

const otpStepSchema = Yup.object().shape({
  otp: Yup.string()
    .length(OTP_LENGTH, `O código deve ter ${OTP_LENGTH} dígitos`)
    .required('Informe o código recebido por SMS'),
})

const passwordStepSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Informe a nova senha'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], t('forgotPassword.passwordsMustMatch'))
    .required('Confirme a nova senha'),
})

type PhoneStep = 1 | 2 | 3

export default function ForgotPassword() {
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const {
    resetPassword,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    updatePassword,
  } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [phoneStep, setPhoneStep] = useState<PhoneStep>(1)
  const [phoneSuccess, setPhoneSuccess] = useState(false)
  const [storedPhone, setStoredPhone] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = setInterval(() => {
      setResendSeconds((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendSeconds])

  const startResendCooldown = useCallback(() => {
    setResendSeconds(OTP_RESEND_SECONDS)
  }, [])

  const handleEmailSubmit = async (values: { email: string }) => {
    try {
      setLoading(true)
      setError(null)
      const { error: resetError } = await resetPassword(values.email)
      if (resetError) {
        setError(resetError)
        return
      }
      setEmailSent(true)
    } catch (err) {
      console.error('Erro na recuperação de senha:', err)
      setError({
        message: 'Erro inesperado. Tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (values: { phone: string }) => {
    try {
      setLoading(true)
      setError(null)
      const e164 = normalizePhoneToE164(values.phone)
      const { error: otpError } = await sendPasswordResetOtp(e164)
      if (otpError) {
        setError(otpError)
        return
      }
      setStoredPhone(e164)
      setOtpAttempts(0)
      setPhoneStep(2)
      startResendCooldown()
    } catch (err) {
      console.error('Erro ao enviar OTP:', err)
      setError({
        message: 'Erro inesperado. Tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || !storedPhone) return
    try {
      setLoading(true)
      setError(null)
      const { error: otpError } = await sendPasswordResetOtp(storedPhone)
      if (otpError) {
        setError(otpError)
        return
      }
      setOtpAttempts(0)
      startResendCooldown()
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (values: { otp: string }) => {
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      setError({
        code: 'invalid_otp',
        title: 'Código inválido',
        message: t('forgotPassword.otpAttemptsExceeded'),
      })
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { error: verifyError } = await verifyPasswordResetOtp(
        storedPhone,
        values.otp.trim(),
      )
      if (verifyError) {
        setOtpAttempts((n) => n + 1)
        setError(verifyError)
        return
      }
      setPhoneStep(3)
    } catch (err) {
      console.error('Erro ao verificar OTP:', err)
      setError({
        message: 'Erro inesperado. Tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (values: {
    password: string
    confirmPassword: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const { error: updateError } = await updatePassword(values.password)
      if (updateError) {
        setError(updateError)
        return
      }
      setPhoneSuccess(true)
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      setError({
        message: 'Erro inesperado. Tente novamente.',
        code: 'unknown_error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => setError(null)

  const handleErrorAction = (action: string) => {
    switch (action) {
      case 'Fazer login':
        router.push('/(auth)/login')
        break
      case 'Criar conta':
        router.push('/(auth)/signup')
        break
      default:
        break
    }
  }

  const subtitle = usePhoneAuth
    ? phoneStep === 1
      ? t('forgotPassword.subtitlePhone')
      : phoneStep === 2
        ? t('forgotPassword.subtitleOtp')
        : t('forgotPassword.subtitleNewPassword')
    : t('forgotPassword.subtitleEmail')

  const renderSuccess = (
    icon: 'email-check' | 'check-circle',
    title: string,
    message: string,
  ) => (
    <View style={styles.successSection}>
      <MaterialCommunityIcons
        name={icon}
        size={64}
        color={colors.primary}
        style={styles.successIcon}
      />
      <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <Button
        mode="contained"
        onPress={() => router.replace('/(auth)/login')}
        icon="login"
        style={styles.loginButton}
        contentStyle={styles.buttonContent}
        buttonColor={colors.primary}
      >
        {t('forgotPassword.backToLogin')}
      </Button>
    </View>
  )

  const renderEmailFlow = () => {
    if (emailSent) {
      return renderSuccess(
        'email-check',
        t('forgotPassword.emailSentTitle'),
        t('forgotPassword.emailSentMessage'),
      )
    }

    return (
      <Formik
        initialValues={{ email: '' }}
        onSubmit={handleEmailSubmit}
        validationSchema={emailValidationSchema}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit: formikSubmit,
          values,
          errors: formErrors,
          touched,
        }) => (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="E-mail"
                value={values.email}
                error={!!(formErrors.email && touched.email)}
                onBlur={handleBlur('email')}
                left={<TextInput.Icon icon="email" />}
                placeholder="exemplo@email.com"
                onChangeText={(text) => handleChange('email')(text.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                outlineColor={colors.inputBorder}
                activeOutlineColor={colors.primary}
                textColor={colors.textPrimary}
                placeholderTextColor={colors.placeholder}
              />
              {formErrors.email && touched.email && (
                <HelperText type="error">{formErrors.email}</HelperText>
              )}
            </View>

            {error && (
              <AuthErrorDisplay
                error={error}
                onRetry={handleRetry}
                onActionPress={handleErrorAction}
                style={styles.errorContainer}
              />
            )}

            <Button
              mode="contained"
              onPress={() => formikSubmit()}
              disabled={loading}
              loading={loading}
              icon="email-send"
              style={styles.sendButton}
              contentStyle={styles.buttonContent}
              buttonColor={colors.primary}
            >
              {loading
                ? t('forgotPassword.sending')
                : t('forgotPassword.sendResetLink')}
            </Button>
          </View>
        )}
      </Formik>
    )
  }

  const renderPhoneFlow = () => {
    if (phoneSuccess) {
      return renderSuccess(
        'check-circle',
        t('forgotPassword.successTitle'),
        t('forgotPassword.successMessage'),
      )
    }

    if (phoneStep === 1) {
      return (
        <Formik
          initialValues={{ phone: '' }}
          onSubmit={handleSendOtp}
          validationSchema={phoneStepSchema}
        >
          {({
            handleBlur,
            handleSubmit: formikSubmit,
            values,
            errors: formErrors,
            touched,
            setFieldValue,
          }) => (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  label={t('forgotPassword.phoneLabel')}
                  value={values.phone}
                  error={!!(formErrors.phone && touched.phone)}
                  onBlur={handleBlur('phone')}
                  left={<TextInput.Icon icon="phone" />}
                  placeholder="(11) 99999-9999"
                  onChangeText={(text) => {
                    setFieldValue('phone', formatBrazilPhoneDisplay(text))
                  }}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  style={[styles.input, { backgroundColor: colors.inputBackground }]}
                  outlineColor={colors.inputBorder}
                  activeOutlineColor={colors.primary}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.placeholder}
                />
                {formErrors.phone && touched.phone && (
                  <HelperText type="error">{formErrors.phone}</HelperText>
                )}
              </View>

              {error && (
                <AuthErrorDisplay
                  error={error}
                  onRetry={handleRetry}
                  onActionPress={handleErrorAction}
                  style={styles.errorContainer}
                />
              )}

              <Button
                mode="contained"
                onPress={() => formikSubmit()}
                disabled={loading}
                loading={loading}
                icon="message-text"
                style={styles.sendButton}
                contentStyle={styles.buttonContent}
                buttonColor={colors.primary}
              >
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendCode')}
              </Button>
            </View>
          )}
        </Formik>
      )
    }

    if (phoneStep === 2) {
      return (
        <Formik
          initialValues={{ otp: '' }}
          onSubmit={handleVerifyOtp}
          validationSchema={otpStepSchema}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit: formikSubmit,
            values,
            errors: formErrors,
            touched,
          }) => (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  label={t('forgotPassword.otpLabel')}
                  value={values.otp}
                  error={!!(formErrors.otp && touched.otp)}
                  onBlur={handleBlur('otp')}
                  left={<TextInput.Icon icon="numeric" />}
                  placeholder={'0'.repeat(OTP_LENGTH)}
                  onChangeText={(text) =>
                    handleChange('otp')(
                      text.replace(/\D/g, '').slice(0, OTP_LENGTH),
                    )
                  }
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  autoCorrect={false}
                  style={[styles.input, { backgroundColor: colors.inputBackground }]}
                  outlineColor={colors.inputBorder}
                  activeOutlineColor={colors.primary}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.placeholder}
                />
                {formErrors.otp && touched.otp && (
                  <HelperText type="error">{formErrors.otp}</HelperText>
                )}
              </View>

              {error && (
                <AuthErrorDisplay
                  error={error}
                  onRetry={handleRetry}
                  onActionPress={handleErrorAction}
                  style={styles.errorContainer}
                />
              )}

              <Button
                mode="contained"
                onPress={() => formikSubmit()}
                disabled={loading || otpAttempts >= MAX_OTP_ATTEMPTS}
                loading={loading}
                icon="shield-check"
                style={styles.sendButton}
                contentStyle={styles.buttonContent}
                buttonColor={colors.primary}
              >
                {loading ? t('forgotPassword.verifying') : t('forgotPassword.verifyCode')}
              </Button>

              <Button
                mode="text"
                onPress={handleResendOtp}
                disabled={loading || resendSeconds > 0}
                textColor={colors.primary}
                style={styles.resendButton}
              >
                {resendSeconds > 0
                  ? t('forgotPassword.resendIn', { seconds: resendSeconds })
                  : t('forgotPassword.resendCode')}
              </Button>

              <Button
                mode="text"
                onPress={() => {
                  setPhoneStep(1)
                  setError(null)
                }}
                textColor={colors.textSecondary}
              >
                {t('forgotPassword.back')}
              </Button>
            </View>
          )}
        </Formik>
      )
    }

    return (
      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        onSubmit={handleUpdatePassword}
        validationSchema={passwordStepSchema}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit: formikSubmit,
          values,
          errors: formErrors,
          touched,
        }) => (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label={t('forgotPassword.newPasswordLabel')}
                value={values.password}
                error={!!(formErrors.password && touched.password)}
                onBlur={handleBlur('password')}
                onChangeText={handleChange('password')}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                secureTextEntry={!showPassword}
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                outlineColor={colors.inputBorder}
                activeOutlineColor={colors.primary}
                textColor={colors.textPrimary}
              />
              {formErrors.password && touched.password && (
                <HelperText type="error">{formErrors.password}</HelperText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label={t('forgotPassword.confirmPasswordLabel')}
                value={values.confirmPassword}
                error={!!(formErrors.confirmPassword && touched.confirmPassword)}
                onBlur={handleBlur('confirmPassword')}
                onChangeText={handleChange('confirmPassword')}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                secureTextEntry={!showConfirmPassword}
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                outlineColor={colors.inputBorder}
                activeOutlineColor={colors.primary}
                textColor={colors.textPrimary}
              />
              {formErrors.confirmPassword && touched.confirmPassword && (
                <HelperText type="error">{formErrors.confirmPassword}</HelperText>
              )}
            </View>

            {error && (
              <AuthErrorDisplay
                error={error}
                onRetry={handleRetry}
                style={styles.errorContainer}
              />
            )}

            <Button
              mode="contained"
              onPress={() => formikSubmit()}
              disabled={loading}
              loading={loading}
              icon="lock-reset"
              style={styles.sendButton}
              contentStyle={styles.buttonContent}
              buttonColor={colors.primary}
            >
              {loading ? t('forgotPassword.resetting') : t('forgotPassword.resetPassword')}
            </Button>
          </View>
        )}
      </Formik>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.primary + '40', colors.primary]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View
        entering={FadeInUp.delay(200).duration(800)}
        style={styles.headerContainer}
      >
        <Button
          mode="text"
          onPress={() => router.back()}
          icon="arrow-left"
          style={styles.backButton}
          labelStyle={[styles.backButtonLabel, { color: colors.onPrimary }]}
          textColor={colors.onPrimary}
        >
          {t('forgotPassword.back')}
        </Button>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInUp.delay(300).duration(800)}
            style={styles.logoContainer}
          >
            <MaterialCommunityIcons
              name="lock-reset"
              size={80}
              color={colors.onPrimary}
            />
            <Text
              variant="headlineLarge"
              style={[styles.title, { color: colors.onPrimary }]}
            >
              {t('forgotPassword.title')}
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: colors.onPrimary }]}
            >
              {subtitle}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.formContainer}
          >
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content style={styles.cardContent}>
                {usePhoneAuth ? renderPhoneFlow() : renderEmailFlow()}
              </Card.Content>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    opacity: 0.9,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  card: {
    elevation: 8,
    borderRadius: 20,
  },
  cardContent: {
    padding: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {},
  sendButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  resendButton: {
    alignSelf: 'center',
  },
  buttonContent: {
    height: 48,
  },
  errorContainer: {
    marginVertical: 8,
  },
  successSection: {
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  successMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 12,
    minWidth: 200,
  },
})
