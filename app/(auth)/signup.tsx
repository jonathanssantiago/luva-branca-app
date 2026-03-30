import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Button, Text, Card, useTheme } from 'react-native-paper'
import { useState } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import SignupForm from '@/src/components/auth/SignupForm'

const SignUp = () => {
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)

  const handleSignupStart = () => {
    setLoading(true)
  }

  const handleSignupEnd = () => {
    setLoading(false)
  }

  const handleSignupError = (error: any) => {
    console.error('Erro no cadastro:', error)
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <LinearGradient
        colors={[
          colors.primary,
          colors.primary + 'CC', // 80% opacity
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
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom + 40,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header compacto */}
            <View style={signupStyles.headerSection}>
              <View style={signupStyles.logoContainer}>
                <Image
                  alt="Logo SIAPeP-M"
                  source={require('@/assets/images/siapep-splash.png')}
                  style={[signupStyles.logo, { borderColor: colors.onPrimary }]}
                />
              </View>

              <Text
                style={[signupStyles.appTitle, { color: colors.onPrimary }]}
              >
                Cadastro
              </Text>
            </View>

            {/* Form Section */}
            <View style={signupStyles.formWrapper}>
              <Card
                style={[
                  signupStyles.formCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={signupStyles.formHeader}>
                  <Text
                    style={[
                      signupStyles.formTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Preencha seus dados
                  </Text>
                </View>

                <SignupForm
                  onSignupStart={handleSignupStart}
                  onSignupEnd={handleSignupEnd}
                  onError={handleSignupError}
                />
              </Card>

              {/* Login Section — fora do Card para evitar sobreposição */}
              <View style={signupStyles.loginSection}>
                <Text
                  style={[
                    signupStyles.loginText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Já tem uma conta?
                </Text>
                <Button
                  mode="outlined"
                  textColor={colors.onPrimary}
                  style={[
                    signupStyles.loginButton,
                    { borderColor: colors.onPrimary },
                  ]}
                  onPress={() => router.push('/(auth)/login')}
                  icon="login"
                >
                  Entrar
                </Button>
              </View>
            </View>
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
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logo: {
    height: 56,
    width: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  formWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginSection: {
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  loginText: {
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
  },
})

export default SignUp
