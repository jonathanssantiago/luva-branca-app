import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Button, Text, Card, useTheme } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import ForgotPasswordPhone from '@/src/components/auth/ForgotPasswordPhone'

export default function ForgotPassword() {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const [isLoading, setIsLoading] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handleStart = () => {
    setIsLoading(true)
  }

  const handleEnd = () => {
    setIsLoading(false)
  }

  const handleError = (error: any) => {
    console.error('Erro na recuperação de senha:', error)
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
          onPress={handleBack}
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
              Digite seu telefone para redefinir sua senha
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.formContainer}
          >
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content style={styles.cardContent}>
                <ForgotPasswordPhone
                  onStart={handleStart}
                  onEnd={handleEnd}
                  onError={handleError}
                />
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
    paddingTop: 60,
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
    marginBottom: 20,
  },
  card: {
    elevation: 8,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 24,
  },
})
