import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Card, Button, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import {
  translateAuthError,
  getErrorActions,
  isRecoverableError,
} from '@/lib/utils'

interface AuthErrorDisplayProps {
  error: any
  onRetry?: () => void
  onActionPress?: (action: string) => void
  showRetryButton?: boolean
  style?: any
}

export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
  error,
  onRetry,
  onActionPress,
  showRetryButton = true,
  style,
}) => {
  const theme = useTheme()

  if (!error) return null

  const errorInfo = translateAuthError(error)
  const actions = getErrorActions(errorInfo.code)
  const canRetry = isRecoverableError(errorInfo.code)

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'invalid_credentials':
      case 'invalid_email_password':
        return 'account-alert'
      case 'email_not_confirmed':
      case 'email_link_expired':
        return 'email-alert'
      case 'user_not_found':
        return 'account-search'
      case 'user_exists':
        return 'account-multiple'
      case 'rate_limit':
      case 'email_rate_limit':
        return 'clock-alert'
      case 'network_error':
      case 'fetch_error':
        return 'wifi-off'
      default:
        return 'alert-circle'
    }
  }

  const getErrorColor = (code: string) => {
    switch (code) {
      case 'email_not_confirmed':
      case 'email_link_expired':
        return LuvaBrancaColors.warning
      case 'rate_limit':
      case 'email_rate_limit':
        return LuvaBrancaColors.warning
      case 'network_error':
      case 'fetch_error':
        return LuvaBrancaColors.textSecondary
      default:
        return LuvaBrancaColors.error
    }
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[styles.container, style]}
    >
      <Card style={styles.errorCard}>
        <View style={styles.content}>
          {/* Ícone e título */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name={getErrorIcon(errorInfo.code)}
              size={24}
              color={getErrorColor(errorInfo.code)}
              style={styles.icon}
            />
            <Text
              style={[styles.title, { color: getErrorColor(errorInfo.code) }]}
            >
              {errorInfo.title}
            </Text>
          </View>

          {/* Mensagem */}
          <Text style={styles.message}>{errorInfo.message}</Text>

          {/* Ações */}
          <View style={styles.actionsContainer}>
            {/* Botão de retry principal se aplicável */}
            {showRetryButton && canRetry && onRetry && (
              <Button
                mode="contained"
                onPress={onRetry}
                icon="refresh"
                style={styles.retryButton}
                buttonColor={LuvaBrancaColors.primary}
              >
                Tentar novamente
              </Button>
            )}

            {/* Ação específica do erro */}
            {errorInfo.action && onActionPress && (
              <Button
                mode="outlined"
                onPress={() => onActionPress(errorInfo.action!)}
                style={styles.actionButton}
                textColor={LuvaBrancaColors.primary}
              >
                {errorInfo.action}
              </Button>
            )}

            {/* Ações adicionais */}
            {actions.length > 0 && !errorInfo.action && onActionPress && (
              <View style={styles.additionalActions}>
                {actions.slice(0, 2).map((action, index) => (
                  <Button
                    key={index}
                    mode="text"
                    onPress={() => onActionPress(action)}
                    textColor={LuvaBrancaColors.textSecondary}
                    style={styles.additionalActionButton}
                  >
                    {action}
                  </Button>
                ))}
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  errorCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: LuvaBrancaColors.divider,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: LuvaBrancaColors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 8,
  },
  retryButton: {
    borderRadius: 8,
  },
  actionButton: {
    borderRadius: 8,
    borderColor: LuvaBrancaColors.primary,
  },
  additionalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  additionalActionButton: {
    flex: 1,
  },
})

export default AuthErrorDisplay
