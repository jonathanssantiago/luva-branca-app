import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Button, Text, Card, TextInput, HelperText, useTheme } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Formik } from 'formik'
import * as Yup from 'yup'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Por favor, insira um e-mail válido')
    .required('Por favor, insira o seu e-mail'),
})

export default function ForgotPassword() {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (values: { email: string }) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await resetPassword(values.email)

      if (error) {
        setError(error)
        return
      }

      setSent(true)
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
      default:
        break
    }
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
          Voltar
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
              Recuperar Senha
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: colors.onPrimary }]}
            >
              Informe seu e-mail para receber o link de redefinição
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.formContainer}
          >
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content style={styles.cardContent}>
                {sent ? (
                  <View style={styles.successSection}>
                    <MaterialCommunityIcons
                      name="email-check"
                      size={64}
                      color={colors.primary}
                      style={styles.successIcon}
                    />
                    <Text
                      style={[
                        styles.successTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      E-mail enviado!
                    </Text>
                    <Text
                      style={[
                        styles.successMessage,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Verifique sua caixa de entrada e siga as instruções para
                      redefinir sua senha.
                    </Text>
                    <Button
                      mode="contained"
                      onPress={() => router.replace('/(auth)/login')}
                      icon="login"
                      style={styles.loginButton}
                      contentStyle={styles.buttonContent}
                      buttonColor={colors.primary}
                    >
                      Voltar para o login
                    </Button>
                  </View>
                ) : (
                  <Formik
                    initialValues={{ email: '' }}
                    onSubmit={handleSubmit}
                    validationSchema={validationSchema}
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
                            onChangeText={(text) =>
                              handleChange('email')(text.toLowerCase())
                            }
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
                          {formErrors.email && touched.email && (
                            <HelperText type="error">
                              {formErrors.email}
                            </HelperText>
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
                          {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                        </Button>
                      </View>
                    )}
                  </Formik>
                )}
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
