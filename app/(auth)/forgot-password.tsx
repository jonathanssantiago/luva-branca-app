import React, { useState } from 'react'
import { View, StyleSheet, Alert, ScrollView } from 'react-native'
import {
  Button,
  TextInput,
  Text,
  Card,
  useTheme,
  ActivityIndicator,
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

  const handleResetPassword = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true)
    try {
      const { error } = await resetPassword(values.email)

      if (error) {
        Alert.alert(
          'Erro',
          error.message || 'Ocorreu um erro ao enviar o email de recuperação.',
        )
      } else {
        Alert.alert(
          'Email Enviado!',
          'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ],
        )
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.')
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
        colors={[LuvaBrancaColors.accent.light, LuvaBrancaColors.accent.main]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                    <TextInput
                      label="Email"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      error={touched.email && !!errors.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      left={<TextInput.Icon icon="email" />}
                      style={styles.input}
                    />
                    {touched.email && errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}

                    <Button
                      mode="contained"
                      onPress={() => handleSubmit()}
                      disabled={isLoading || isSubmitting}
                      style={styles.button}
                      contentStyle={styles.buttonContent}
                    >
                      {isLoading || isSubmitting ? (
                        <ActivityIndicator color={theme.colors.onPrimary} />
                      ) : (
                        'Enviar Email'
                      )}
                    </Button>
                  </>
                )}
              </Formik>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonLabel: {
    color: 'white',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: 'white',
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  card: {
    elevation: 8,
    borderRadius: 16,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 12,
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
