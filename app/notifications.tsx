import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native'
import { 
  FAB, 
  Text, 
  Chip, 
  Menu, 
  Button,
  Portal,
  Modal,
  Surface,
  Divider,
  Badge,
  IconButton
} from 'react-native-paper'
import { useRouter } from 'expo-router'

import { NotificationItem } from '@/src/components/NotificationItem'
import { useNotifications } from '@/src/hooks/useNotifications'
import { NotificationData, NotificationType } from '@/src/types'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import { CustomHeader } from '@/src/components/ui'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

type FilterType = 'all' | NotificationType

const NotificationsScreen = () => {
  const colors = useThemeExtendedColors()
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    hasPermission,
    markAsRead,
    deleteNotification,
    requestPermissions,
    sendLocalNotification,
    refreshNotifications,
  } = useNotifications()

  const [filter, setFilter] = useState<FilterType>('all')
  const [testModalVisible, setTestModalVisible] = useState(false)

  const filterOptions: { label: string; value: FilterType; icon: string }[] = [
    { label: 'Todas', value: 'all', icon: 'view-list' },
    { label: 'Alertas de Segurança', value: 'security_alert', icon: 'shield-alert' },
    { label: 'Emergências', value: 'emergency', icon: 'alert-circle' },
    { label: 'Atualizações', value: 'system_update', icon: 'update' },
    { label: 'Lembretes', value: 'reminder', icon: 'bell' },
    { label: 'Mensagens', value: 'message', icon: 'message-text' },
    { label: 'Geral', value: 'general', icon: 'information' },
  ]

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || notification.type === filter
  )

  const handlePermissionRequest = async () => {
    const granted = await requestPermissions()
    if (granted) {
      Alert.alert('Sucesso', 'Permissões de notificação concedidas!')
    }
  }

  const handleTestNotification = async () => {
    try {
      await sendLocalNotification({
        title: 'Teste de Notificação',
        body: 'Esta é uma notificação de teste do Luva Branca',
        type: 'general',
        sound: 'default',
        priority: 'default',
      })
      Alert.alert('Sucesso', 'Notificação de teste enviada!')
      setTestModalVisible(false)
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar notificação de teste')
    }
  }

  const renderNotificationItem = ({ item }: { item: NotificationData }) => (
    <NotificationItem
      notification={item}
      onPress={() => {
        if (!item.isRead) {
          markAsRead(item.id)
        }
        // TODO: Navegar para tela específica baseada no tipo
      }}
      onMarkAsRead={() => markAsRead(item.id)}
      onDelete={() => deleteNotification(item.id)}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {filter === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação deste tipo'}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {hasPermission 
          ? 'Você receberá notificações aqui quando houver atualizações importantes.' 
          : 'Ative as notificações para receber alertas importantes.'
        }
      </Text>
      {!hasPermission && (
        <Button 
          mode="contained" 
          onPress={handlePermissionRequest}
          style={styles.permissionButton}
          buttonColor={colors.primary}
          textColor={colors.onPrimary}
        >
          Ativar Notificações
        </Button>
      )}
    </View>
  )

  const renderHeader = () => (
    <>
      <CustomHeader
        title="Notificações"
        backgroundColor={colors.primary}
        textColor={colors.onPrimary}
        iconColor={colors.onPrimary}
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
      />
      
      {/* Filtros */}
      <View style={[styles.filtersContainer, { 
        backgroundColor: colors.surface,
        borderBottomColor: colors.outline 
      }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <Chip
              mode={filter === item.value ? 'flat' : 'outlined'}
              selected={filter === item.value}
              onPress={() => setFilter(item.value)}
              style={[
                styles.filterChip,
                { backgroundColor: filter === item.value ? colors.primary : 'transparent' }
              ]}
              textStyle={filter === item.value ? 
                { color: colors.onPrimary } : 
                { color: colors.textPrimary }
              }
            >
              {item.label}
            </Chip>
          )}
        />
      </View>
    </>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      {/* Lista de Notificações */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshNotifications}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB para nova notificação (apenas para teste) */}
      {hasPermission && __DEV__ && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setTestModalVisible(true)}
        />
      )}

      {/* Modal de Teste */}
      <Portal>
        <Modal
          visible={testModalVisible}
          onDismiss={() => setTestModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Surface style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Teste de Notificação
            </Text>
            <Text variant="bodyMedium" style={[styles.modalText, { color: colors.textSecondary }]}>
              Enviar uma notificação de teste para verificar se está funcionando corretamente?
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setTestModalVisible(false)}
                style={styles.modalButton}
                textColor={colors.textPrimary}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleTestNotification}
                style={styles.modalButton}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
              >
                Enviar Teste
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 100, // Espaço para a TabBar
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 400,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
  },
  modal: {
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
})

export default NotificationsScreen 