import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Button, Text, Card, useTheme } from 'react-native-paper'
import { useState } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import SignupForm from '@/src/components/auth/SignupForm'

const { width, height } = Dimensions.get('window')

const SignUp = () => {
  const theme = useTheme()
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
                  style={[signupStyles.logo, { borderColor: colors.onPrimary }]}
                />
              </View>

              <Text
                style={[signupStyles.appTitle, { color: colors.onPrimary }]}
              >
                Luva Branca
              </Text>

              <View style={signupStyles.iconRow}>
                <MaterialCommunityIcons
                  name="heart"
                  size={16}
                  color={colors.onPrimary}
                />
                <MaterialCommunityIcons
                  name="security"
                  size={18}
                  color={colors.onPrimary}
                />
              </View>
            </Animated.View>

            {/* Form Section */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(600)}
              style={signupStyles.formWrapper}
            >
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
                    Cadastro rápido
                  </Text>
                  <Text
                    style={[
                      signupStyles.formSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Preencha seus dados para começar
                  </Text>
                </View>

                {/* Componente de formulário de cadastro */}
                <SignupForm
                  onSignupStart={handleSignupStart}
                  onSignupEnd={handleSignupEnd}
                  onError={handleSignupError}
                />

                {/* Divider */}
                <View style={signupStyles.divider}>
                  <View
                    style={[
                      signupStyles.dividerLine,
                      { backgroundColor: colors.outline },
                    ]}
                  />
                  <Text
                    style={[
                      signupStyles.dividerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ou
                  </Text>
                  <View
                    style={[
                      signupStyles.dividerLine,
                      { backgroundColor: colors.outline },
                    ]}
                  />
                </View>

                {/* Login Section */}
                <View style={signupStyles.loginSection}>
                  <Text
                    style={[
                      signupStyles.loginText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Já tem uma conta?
                  </Text>
                  <Button
                    mode="outlined"
                    textColor={colors.primary}
                    style={[
                      signupStyles.loginButton,
                      { borderColor: colors.primary },
                    ]}
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
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: 'center',
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
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    textTransform: 'uppercase',
  },

  // Login
  loginSection: {
    alignItems: 'center',
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
