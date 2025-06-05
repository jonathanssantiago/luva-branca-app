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
  IconButton,
  Card
} from 'react-native-paper'
import { router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { CustomHeader } from '@/src/components/ui'
import { useNotifications } from '@/src/hooks/useNotifications'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

type FilterType = 'all' | 'alert' | 'emergency' | 'system'

const NotificationsScreen = () => {
  const colors = useThemeExtendedColors()
  
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
    { label: 'Alertas', value: 'alert', icon: 'shield-alert' },
    { label: 'Emergências', value: 'emergency', icon: 'alert-circle' },
    { label: 'Sistema', value: 'system', icon: 'update' },
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
        type: 'alert',
        sound: 'default',
        priority: 'default',
      })
      Alert.alert('Sucesso', 'Notificação de teste enviada!')
      setTestModalVisible(false)
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar notificação de teste')
    }
  }

  const renderNotificationItem = ({ item }: { item: any }) => (
    <Card style={[styles.notificationCard, { backgroundColor: colors.surface }]}>
      <Card.Content style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
            {item.time}
          </Text>
        </View>
        <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
          {item.message}
        </Text>
      </Card.Content>
    </Card>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="bell-outline" 
        size={64} 
        color={colors.iconSecondary} 
      />
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
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
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
              textStyle={filter === item.value ? { color: colors.onPrimary } : { color: colors.textPrimary }}
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
        keyExtractor={(item, index) => item.id || `notification-${index}`}
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
  notificationCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    marginTop: 8,
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