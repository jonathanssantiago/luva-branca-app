import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import {
  Button,
  TextInput,
  Text,
  Card,
  useTheme,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Formik } from 'formik'
import * as Yup from 'yup'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('Email é obrigatório'),
})

interface ForgotPasswordFormValues {
  email: string
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [isLoading, setIsLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const handleResetPassword = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true)
    setResetError(null)
    try {
      const { error } = await resetPassword(values.email)

      if (error) {
        setResetError(
          error.message || 'Ocorreu um erro ao enviar o email de recuperação.',
        )
      } else {
        Alert.alert(
          'Email Enviado!',
          'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ],
        )
      }
    } catch (error) {
      setResetError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[LuvaBrancaColors.lightPink, LuvaBrancaColors.primary]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View
        entering={FadeInUp.delay(200).duration(800)}
        style={styles.headerContainer}
      >
        <Button
          mode="text"
          onPress={handleBack}
          icon="arrow-left"
          style={styles.backButton}
          labelStyle={styles.backButtonLabel}
        >
          Voltar
        </Button>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View
          entering={FadeInUp.delay(300).duration(800)}
          style={styles.logoContainer}
        >
          <MaterialCommunityIcons
            name="lock-reset"
            size={80}
            color={theme.colors.onPrimary}
          />
          <Text variant="headlineLarge" style={styles.title}>
            Recuperar Senha
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Digite seu email para receber as instruções
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          style={styles.formContainer}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Formik
                initialValues={{ email: '' }}
                validationSchema={validationSchema}
                onSubmit={handleResetPassword}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  isSubmitting,
                }) => (
                  <>
                    {resetError && (
                      <HelperText
                        type="error"
                        visible={!!resetError}
                        style={styles.errorHelper}
                      >
                        {resetError}
                      </HelperText>
                    )}

                    <TextInput
                      mode="outlined"
                      label="Email"
                      value={values.email}
                      onChangeText={(text) =>
                        handleChange('email')(text.toLowerCase())
                      }
                      onBlur={handleBlur('email')}
                      error={touched.email && !!errors.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      placeholder="exemplo@email.com"
                      left={<TextInput.Icon icon="email" />}
                      style={styles.input}
                      outlineColor={LuvaBrancaColors.border}
                      activeOutlineColor={LuvaBrancaColors.primary}
                    />
                    {touched.email && errors.email && (
                      <HelperText
                        type="error"
                        visible={touched.email && !!errors.email}
                      >
                        {errors.email}
                      </HelperText>
                    )}

                    <Button
                      mode="outlined"
                      onPress={() => handleSubmit()}
                      disabled={isLoading || isSubmitting}
                      style={styles.button}
                      contentStyle={styles.buttonContent}
                      textColor={LuvaBrancaColors.primary}
                      icon={
                        isLoading || isSubmitting ? undefined : 'email-send'
                      }
                    >
                      {isLoading || isSubmitting ? (
                        <ActivityIndicator
                          color={LuvaBrancaColors.primary}
                          size="small"
                        />
                      ) : (
                        'Enviar Email de Recuperação'
                      )}
                    </Button>
                  </>
                )}
              </Formik>
            </Card.Content>
          </Card>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingTop: 50,
    marginLeft: -8, // Compensa o padding interno do botão
  },
  backButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    color: 'white',
    opacity: 0.9,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  card: {
    elevation: 8,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 32,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'white',
  },
  errorHelper: {
    marginBottom: 20,
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    borderColor: LuvaBrancaColors.primary,
  },
  buttonContent: {
    height: 48,
  },
})
