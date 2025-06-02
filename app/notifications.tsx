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
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { NotificationItem } from '@/src/components/NotificationItem'
import { useNotifications } from '@/src/hooks/useNotifications'
import { NotificationData, NotificationType } from '@/src/types'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

type FilterType = 'all' | NotificationType

const NotificationsScreen = () => {
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
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {filter === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação deste tipo'}
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
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
        >
          Ativar Notificações
        </Button>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
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
              style={styles.filterChip}
              textStyle={filter === item.value ? styles.selectedChipText : undefined}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>

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
            tintColor={LuvaBrancaColors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB para nova notificação (apenas para teste) */}
      {hasPermission && __DEV__ && (
        <FAB
          icon="plus"
          style={styles.fab}
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
          <Surface style={styles.modalContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Teste de Notificação
            </Text>
            <Text variant="bodyMedium" style={styles.modalText}>
              Enviar uma notificação de teste para verificar se está funcionando corretamente?
            </Text>
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setTestModalVisible(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleTestNotification}
                style={styles.modalButton}
              >
                Enviar Teste
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  selectedChipText: {
    color: LuvaBrancaColors.onPrimary,
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 12,
    color: LuvaBrancaColors.textPrimary,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: LuvaBrancaColors.textSecondary,
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
    backgroundColor: LuvaBrancaColors.primary,
  },
  modal: {
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: LuvaBrancaColors.textPrimary,
  },
  modalText: {
    marginBottom: 24,
    textAlign: 'center',
    color: LuvaBrancaColors.textSecondary,
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