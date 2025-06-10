import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button, Text, TextInput } from 'react-native-paper'
import AuthErrorDisplay from '@/src/components/AuthErrorDisplay'

interface SmsVerificationComponentProps {
  phone: string
  otpCode: string
  loading: boolean
  verifying: boolean
  error: any
  success: boolean
  verificationSuccess?: boolean

  colors: any
  onOtpChange: (code: string) => void
  onVerifyOtp: () => void
  onResend: () => void
  onRetry: () => void
  onErrorAction: (action: string) => void
}

const SmsVerificationComponent: React.FC<SmsVerificationComponentProps> = ({
  phone,
  otpCode,
  loading,
  verifying,
  error,
  success,
  verificationSuccess = false,
  colors,
  onOtpChange,
  onVerifyOtp,
  onResend,
  onRetry,
  onErrorAction,
}) => {
  return (
    <View style={styles.content}>
      <Text style={[styles.instructions, { color: colors.textPrimary }]}>
        Digite o código de 4 dígitos recebido por SMS:
      </Text>

      <TextInput
        mode="outlined"
        label="Código de verificação"
        value={otpCode}
        onChangeText={(text) => {
          // Permitir apenas dígitos
          const numericText = text.replace(/[^0-9]/g, '')
          onOtpChange(numericText)
        }}
        placeholder="0000"
        keyboardType="numeric"
        maxLength={4}
        style={[styles.otpInput, { backgroundColor: colors.inputBackground }]}
        outlineColor={colors.inputBorder}
        activeOutlineColor={colors.primary}
        textColor={colors.textPrimary}
        autoFocus
      />

      <Button
        mode="contained"
        onPress={onVerifyOtp}
        disabled={verifying || otpCode.length !== 4}
        loading={verifying}
        icon={otpCode.length === 4 ? 'check' : 'numeric'}
        style={[
          styles.verifyButton,
          {
            backgroundColor:
              otpCode.length === 4 ? colors.primary : colors.surfaceVariant,
          },
        ]}
        contentStyle={styles.buttonContent}
        buttonColor={
          otpCode.length === 4 ? colors.primary : colors.surfaceVariant
        }
        textColor={
          otpCode.length === 4 ? colors.onPrimary : colors.onSurfaceVariant
        }
      >
        {verifying
          ? 'Verificando...'
          : otpCode.length === 4
            ? 'Verificar código'
            : 'Digite o código (4 dígitos)'}
      </Button>

      {verificationSuccess && (
        <View style={styles.verificationSuccessContainer}>
          <Text
            style={[styles.verificationSuccessText, { color: colors.primary }]}
          >
            ✅ Telefone verificado com sucesso!
          </Text>
          <Text
            style={[styles.redirectingText, { color: colors.textSecondary }]}
          >
            Redirecionando...
          </Text>
        </View>
      )}

      {error && !verificationSuccess && (
        <AuthErrorDisplay
          error={error}
          onRetry={onRetry}
          onActionPress={onErrorAction}
          style={styles.errorContainer}
        />
      )}

      {success && (
        <Text style={[styles.successText, { color: colors.primary }]}>
          SMS reenviado com sucesso! Verifique sua caixa de mensagens.
        </Text>
      )}

      <Button
        mode="contained"
        onPress={onResend}
        disabled={loading}
        loading={loading}
        icon="message-text"
        style={styles.resendButton}
        contentStyle={styles.resendButtonContent}
        buttonColor={colors.primary}
        textColor={colors.onPrimary}
      >
        {loading ? 'Enviando...' : 'Reenviar SMS'}
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
  errorContainer: {
    marginTop: 8,
  },
  successText: {
    textAlign: 'center',
    marginTop: 8,
  },
  verificationSuccessContainer: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
  },
  verificationSuccessText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  redirectingText: {
    fontSize: 14,
  },
  resendButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  resendButtonContent: {
    height: 48,
  },
  otpInput: {
    marginVertical: 16,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  verifyButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
})

export default SmsVerificationComponent
