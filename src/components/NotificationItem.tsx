import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Card, Text, IconButton, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { NotificationData, NotificationType } from '../types'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

interface NotificationItemProps {
  notification: NotificationData
  onPress?: () => void
  onMarkAsRead?: () => void
  onDelete?: () => void
}

const getNotificationIcon = (type: NotificationType): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (type) {
    case 'security_alert':
      return 'shield-alert'
    case 'emergency':
      return 'alert-circle'
    case 'system_update':
      return 'update'
    case 'reminder':
      return 'bell'
    case 'message':
      return 'message-text'
    default:
      return 'information'
  }
}

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'security_alert':
      return '#FF9800'
    case 'emergency':
      return '#F44336'
    case 'system_update':
      return '#2196F3'
    case 'reminder':
      return '#4CAF50'
    case 'message':
      return '#9C27B0'
    default:
      return LuvaBrancaColors.primary
  }
}

const formatTimeAgo = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Agora'
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h atrás`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d atrás`
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const theme = useTheme()

  return (
    <Card 
      style={[
        styles.container,
        !notification.isRead && styles.unread
      ]}
      elevation={2}
    >
      <Pressable onPress={onPress} style={styles.pressable}>
        <View style={styles.content}>
          {/* Ícone e indicador */}
          <View style={styles.iconContainer}>
            <View 
              style={[
                styles.iconWrapper,
                { backgroundColor: getNotificationColor(notification.type) + '20' }
              ]}
            >
              <MaterialCommunityIcons
                name={getNotificationIcon(notification.type)}
                size={24}
                color={getNotificationColor(notification.type)}
              />
            </View>
            {!notification.isRead && <View style={styles.unreadDot} />}
          </View>

          {/* Conteúdo */}
          <View style={styles.textContent}>
            <Text 
              variant="titleMedium" 
              style={[
                styles.title,
                !notification.isRead && styles.unreadText
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            
            <Text 
              variant="bodyMedium" 
              style={styles.body}
              numberOfLines={2}
            >
              {notification.body}
            </Text>
            
            <Text variant="bodySmall" style={styles.time}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </View>

          {/* Ações */}
          <View style={styles.actions}>
            {!notification.isRead && onMarkAsRead && (
              <IconButton
                icon="check"
                size={20}
                onPress={onMarkAsRead}
                style={styles.actionButton}
              />
            )}
            {onDelete && (
              <IconButton
                icon="close"
                size={20}
                onPress={onDelete}
                style={styles.actionButton}
              />
            )}
          </View>
        </View>
      </Pressable>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    backgroundColor: 'white',
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: LuvaBrancaColors.primary,
  },
  pressable: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: LuvaBrancaColors.primary,
    borderWidth: 2,
    borderColor: 'white',
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    marginBottom: 4,
    color: LuvaBrancaColors.textPrimary,
  },
  unreadText: {
    fontWeight: '600',
  },
  body: {
    marginBottom: 6,
    color: LuvaBrancaColors.textSecondary,
    lineHeight: 20,
  },
  time: {
    color: LuvaBrancaColors.textSecondary,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
}) 