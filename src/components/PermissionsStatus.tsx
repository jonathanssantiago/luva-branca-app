import React from 'react'
import { View, StyleSheet, Alert, Platform, Linking } from 'react-native'
import { Card, Text, Chip, Button, List, Divider } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePermissions } from '../hooks/usePermissions'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

export const PermissionsStatus: React.FC = () => {
  const {
    permissions,
    loading,
    allGranted,
    requestLocationPermission,
    requestNotificationPermission,
    recheckPermissions,
  } = usePermissions()

  // Configuração das permissões para exibição
  const permissionConfig = {
    location: {
      icon: 'map-marker',
      title: 'Localização',
      description: 'Para enviar sua localização em emergências',
      critical: true,
    },
    notifications: {
      icon: 'bell',
      title: 'Notificações',
      description: 'Para receber alertas importantes',
      critical: true,
    },
    sms: {
      icon: 'message-text',
      title: 'SMS',
      description: 'Para enviar mensagens de emergência',
      critical: false,
    },
  }

  // Obter cor e texto do status
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'granted':
        return { color: '#4CAF50', text: 'Concedida', icon: 'check-circle' }
      case 'denied':
        return { color: '#F44336', text: 'Negada', icon: 'close-circle' }
      default:
        return { color: '#FF9800', text: 'Pendente', icon: 'help-circle' }
    }
  }

  // Solicitar permissão específica
  const handleRequestPermission = async (
    type: 'location' | 'notifications',
  ) => {
    let success = false

    if (type === 'location') {
      success = await requestLocationPermission()
    } else if (type === 'notifications') {
      success = await requestNotificationPermission()
    }

    if (!success) {
      Alert.alert(
        'Permissão Negada',
        `A permissão de ${permissionConfig[type].title.toLowerCase()} foi negada. ` +
          'Você pode habilitá-la manualmente nas configurações do dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir Configurações',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:')
              } else {
                Linking.openSettings()
              }
            },
          },
        ],
      )
    }
  }

  // Abrir configurações do sistema
  const handleOpenSettings = () => {
    Alert.alert(
      'Configurações do Sistema',
      'Você será redirecionado para as configurações do sistema para gerenciar as permissões do app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:')
            } else {
              Linking.openSettings()
            }
          },
        },
      ],
    )
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="shield-check"
            size={24}
            color={LuvaBrancaColors.primary}
          />
          <Text style={styles.title}>Permissões do App</Text>
          {allGranted && (
            <Chip
              icon="check"
              style={styles.statusChip}
              textStyle={styles.statusChipText}
            >
              Completas
            </Chip>
          )}
        </View>

        <Text style={styles.subtitle}>
          Gerencie as permissões necessárias para o funcionamento do app
        </Text>

        <Divider style={styles.divider} />

        <View style={styles.permissionsList}>
          {Object.entries(permissions).map(([key, status]) => {
            const config =
              permissionConfig[key as keyof typeof permissionConfig]
            if (!config) return null

            const statusInfo = getStatusInfo(status)
            const canRequest =
              status !== 'granted' &&
              (key === 'location' || key === 'notifications')

            return (
              <View key={key} style={styles.permissionItem}>
                <View style={styles.permissionIcon}>
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={20}
                    color={LuvaBrancaColors.primary}
                  />
                </View>

                <View style={styles.permissionInfo}>
                  <View style={styles.permissionHeader}>
                    <Text style={styles.permissionTitle}>{config.title}</Text>
                    {config.critical && (
                      <Chip
                        icon="star"
                        style={styles.criticalChip}
                        textStyle={styles.criticalChipText}
                        compact
                      >
                        Essencial
                      </Chip>
                    )}
                  </View>

                  <Text style={styles.permissionDescription}>
                    {config.description}
                  </Text>

                  <View style={styles.permissionStatus}>
                    <MaterialCommunityIcons
                      name={statusInfo.icon as any}
                      size={16}
                      color={statusInfo.color}
                    />
                    <Text
                      style={[styles.statusText, { color: statusInfo.color }]}
                    >
                      {statusInfo.text}
                    </Text>

                    {canRequest && (
                      <Button
                        mode="text"
                        compact
                        onPress={() =>
                          handleRequestPermission(
                            key as 'location' | 'notifications',
                          )
                        }
                        textColor={LuvaBrancaColors.primary}
                        style={styles.requestButton}
                      >
                        Solicitar
                      </Button>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={recheckPermissions}
            icon="refresh"
            style={styles.actionButton}
            loading={loading}
          >
            Verificar Novamente
          </Button>

          <Button
            mode="outlined"
            onPress={handleOpenSettings}
            icon="cog"
            style={styles.actionButton}
          >
            Configurações
          </Button>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    color: '#333333',
  },
  statusChip: {
    backgroundColor: '#E8F5E8',
  },
  statusChipText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  divider: {
    marginBottom: 16,
  },
  permissionsList: {
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${LuvaBrancaColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },
  criticalChip: {
    backgroundColor: '#FFF3E0',
    marginLeft: 8,
  },
  criticalChipText: {
    color: '#FF9800',
    fontSize: 10,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 8,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  requestButton: {
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
})
