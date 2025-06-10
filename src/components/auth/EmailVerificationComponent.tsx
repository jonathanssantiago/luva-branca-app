import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button, Text } from 'react-native-paper'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'

interface EmailVerificationComponentProps {
  email: string
  loading: boolean
  error: any
  success: boolean
  colors: any
  onResend: () => void
  onRetry: () => void
  onErrorAction: (action: string) => void
}

const EmailVerificationComponent: React.FC<EmailVerificationComponentProps> = ({
  email,
  loading,
  error,
  success,
  colors,
  onResend,
  onRetry,
  onErrorAction,
}) => {
  return (
    <View style={styles.content}>
      <Text style={[styles.instructions, { color: colors.textPrimary }]}>
        Para continuar, por favor:
      </Text>

      <View style={styles.steps}>
        <Text style={[styles.step, { color: colors.textSecondary }]}>
          1. Abra seu e-mail
        </Text>
        <Text style={[styles.step, { color: colors.textSecondary }]}>
          2. Clique no link de verificação
        </Text>
        <Text style={[styles.step, { color: colors.textSecondary }]}>
          3. Volte para o aplicativo
        </Text>
      </View>

      {error && (
        <AuthErrorDisplay
          error={error}
          onRetry={onRetry}
          onActionPress={onErrorAction}
          style={styles.errorContainer}
        />
      )}

      {success && (
        <Text style={[styles.successText, { color: colors.primary }]}>
          E-mail reenviado com sucesso!
        </Text>
      )}

      <Button
        mode="contained"
        onPress={onResend}
        disabled={loading}
        loading={loading}
        icon="email-sync"
        style={styles.resendButton}
        contentStyle={styles.resendButtonContent}
        buttonColor={colors.primary}
        textColor={colors.onPrimary}
      >
        {loading ? 'Enviando...' : 'Reenviar e-mail'}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  instructions: {
    fontSize: 16,
    marginBottom: 8,
  },
  steps: {
    gap: 8,
    marginBottom: 16,
  },
  step: {
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 8,
  },
  successText: {
    textAlign: 'center',
    marginTop: 8,
  },
  resendButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  resendButtonContent: {
    height: 48,
  },
})

export default EmailVerificationComponent
