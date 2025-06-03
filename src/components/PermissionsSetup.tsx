import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import {
  Card,
  Text,
  Button,
  List,
  ActivityIndicator,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePermissions } from '@/src/hooks/usePermissions'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

interface PermissionsSetupProps {
  visible: boolean
  onComplete: (allGranted: boolean) => void
  onSkip: () => void
}

const PermissionsSetup: React.FC<PermissionsSetupProps> = ({
  visible,
  onComplete,
  onSkip,
}) => {
  const {
    permissions,
    loading,
    allGranted,
    requestLocationPermission,
    requestNotificationPermission,
    requestAllPermissions,
    showCriticalPermissionsDialog,
  } = usePermissions()

  const [currentStep, setCurrentStep] = useState<
    'intro' | 'requesting' | 'results'
  >('intro')
  const [requestResults, setRequestResults] = useState<{
    [key: string]: boolean
  }>({})

  // Mapear ícones e descrições das permissões
  const permissionConfig = {
    location: {
      icon: 'map-marker',
      title: 'Localização',
      description:
        'Necessário para enviar sua localização exata em emergências',
      critical: true,
    },
    notifications: {
      icon: 'bell',
      title: 'Notificações',
      description: 'Para receber alertas importantes de segurança',
      critical: true,
    },
    sms: {
      icon: 'message-text',
      title: 'SMS',
      description: 'Para enviar mensagens de emergência aos seus guardiões',
      critical: false,
    },
  }

  // Obter cor do status da permissão
  const getPermissionColor = (status: string) => {
    switch (status) {
      case 'granted':
        return '#4CAF50'
      case 'denied':
        return '#F44336'
      default:
        return '#FF9800'
    }
  }

  // Obter texto do status da permissão
  const getPermissionStatusText = (status: string) => {
    switch (status) {
      case 'granted':
        return 'Concedida'
      case 'denied':
        return 'Negada'
      default:
        return 'Pendente'
    }
  }

  // Solicitar todas as permissões
  const handleRequestPermissions = async () => {
    setCurrentStep('requesting')

    try {
      const results = await requestAllPermissions()
      setRequestResults(results)
      setCurrentStep('results')

      // Verificar se alguma permissão crítica foi negada
      const deniedCritical = Object.entries(results)
        .filter(
          ([key, granted]) =>
            !granted &&
            permissionConfig[key as keyof typeof permissionConfig]?.critical,
        )
        .map(([key]) => key)

      if (deniedCritical.length > 0) {
        showCriticalPermissionsDialog(deniedCritical)
      }
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error)
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao solicitar as permissões. Tente novamente.',
      )
      setCurrentStep('intro')
    }
  }

  // Solicitar permissão individual
  const handleRequestIndividual = async (
    type: 'location' | 'notifications',
  ) => {
    try {
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
            'Você pode habilitá-la posteriormente nas configurações do dispositivo.',
          [{ text: 'OK' }],
        )
      }
    } catch (error) {
      console.error(`Erro ao solicitar permissão de ${type}:`, error)
    }
  }

  // Renderizar tela de introdução
  const renderIntroStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="shield-check"
          size={64}
          color={LuvaBrancaColors.primary}
        />
        <Text style={styles.title}>Configuração de Segurança</Text>
        <Text style={styles.subtitle}>
          Para garantir sua proteção, precisamos configurar algumas permissões
          importantes
        </Text>
      </View>

      <View style={styles.permissionsList}>
        {Object.entries(permissionConfig).map(([key, config]) => (
          <List.Item
            key={key}
            title={config.title}
            description={config.description}
            left={(props) => (
              <View style={styles.permissionIcon}>
                <MaterialCommunityIcons
                  name={config.icon as any}
                  size={24}
                  color={LuvaBrancaColors.primary}
                />
              </View>
            )}
            right={() =>
              config.critical && (
                <Chip
                  icon="star"
                  textStyle={styles.criticalChipText}
                  style={styles.criticalChip}
                >
                  Essencial
                </Chip>
              )
            }
            style={styles.permissionItem}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleRequestPermissions}
          style={styles.primaryButton}
          buttonColor={LuvaBrancaColors.primary}
          loading={loading}
          disabled={loading}
        >
          Configurar Permissões
        </Button>

        <Button
          mode="text"
          onPress={onSkip}
          style={styles.secondaryButton}
          textColor={LuvaBrancaColors.textSecondary}
        >
          Configurar Depois
        </Button>
      </View>
    </View>
  )

  // Renderizar tela de solicitação
  const renderRequestingStep = () => (
    <View style={styles.content}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LuvaBrancaColors.primary} />
        <Text style={styles.loadingText}>Solicitando permissões...</Text>
        <Text style={styles.loadingSubtext}>
          Por favor, autorize as permissões quando solicitado
        </Text>
      </View>
    </View>
  )

  // Renderizar tela de resultados
  const renderResultsStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={allGranted ? 'check-circle' : 'alert-circle'}
          size={64}
          color={allGranted ? '#4CAF50' : '#FF9800'}
        />
        <Text style={styles.title}>
          {allGranted ? 'Configuração Concluída!' : 'Configuração Parcial'}
        </Text>
        <Text style={styles.subtitle}>
          {allGranted
            ? 'Todas as permissões foram configuradas com sucesso'
            : 'Algumas permissões precisam de atenção'}
        </Text>
      </View>

      <View style={styles.permissionsList}>
        {Object.entries(permissions).map(([key, status]) => {
          const config = permissionConfig[key as keyof typeof permissionConfig]
          if (!config) return null

          return (
            <Card key={key} style={styles.permissionCard}>
              <Card.Content style={styles.permissionCardContent}>
                <View style={styles.permissionInfo}>
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={24}
                    color={getPermissionColor(status)}
                  />
                  <View style={styles.permissionText}>
                    <Text style={styles.permissionTitle}>{config.title}</Text>
                    <Text style={styles.permissionStatus}>
                      Status: {getPermissionStatusText(status)}
                    </Text>
                  </View>
                </View>

                {status !== 'granted' && key !== 'sms' && (
                  <Button
                    mode="outlined"
                    compact
                    onPress={() =>
                      handleRequestIndividual(
                        key as 'location' | 'notifications',
                      )
                    }
                    style={styles.retryButton}
                  >
                    Tentar Novamente
                  </Button>
                )}
              </Card.Content>
            </Card>
          )
        })}
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => onComplete(allGranted)}
          style={styles.primaryButton}
          buttonColor={LuvaBrancaColors.primary}
        >
          Continuar
        </Button>
      </View>
    </View>
  )

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={styles.modal}
      >
        {currentStep === 'intro' && renderIntroStep()}
        {currentStep === 'requesting' && renderRequestingStep()}
        {currentStep === 'results' && renderResultsStep()}
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionsList: {
    marginBottom: 32,
  },
  permissionItem: {
    paddingVertical: 8,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${LuvaBrancaColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  criticalChip: {
    backgroundColor: '#FFF3E0',
  },
  criticalChipText: {
    color: '#FF9800',
    fontSize: 12,
  },
  permissionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  permissionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    marginLeft: 16,
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  permissionStatus: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  retryButton: {
    marginLeft: 12,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 8,
  },
  secondaryButton: {
    paddingVertical: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default PermissionsSetup
