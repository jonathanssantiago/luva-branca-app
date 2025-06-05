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
    requestMediaLibraryPermission,
    requestAudioPermission,
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
        'Necessário para enviar sua localização em casos de emergência',
      critical: true,
    },
    audio: {
      icon: 'microphone',
      title: 'Microfone',
      description: 'Para gravar áudios de emergência e evidências',
      critical: true,
    },
    notifications: {
      icon: 'bell',
      title: 'Notificações',
      description: 'Para receber alertas importantes de segurança',
      critical: true,
    },
    mediaLibrary: {
      icon: 'image',
      title: 'Galeria',
      description: 'Para anexar fotos e evidências aos relatos',
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
    type: 'location' | 'notifications' | 'mediaLibrary' | 'audio',
  ) => {
    try {
      let success = false

      if (type === 'location') {
        success = await requestLocationPermission()
      } else if (type === 'notifications') {
        success = await requestNotificationPermission()
      } else if (type === 'mediaLibrary') {
        success = await requestMediaLibraryPermission()
      } else if (type === 'audio') {
        success = await requestAudioPermission()
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
          size={56}
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
          <View key={key} style={styles.permissionRow}>
            <View style={styles.permissionIconContainer}>
              <MaterialCommunityIcons
                name={config.icon as any}
                size={20}
                color={LuvaBrancaColors.primary}
              />
            </View>

            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>{config.title}</Text>
              <Text style={styles.permissionDescription}>
                {config.description}
              </Text>
            </View>

            {config.critical && (
              <View style={styles.chipContainer}>
                <View style={styles.criticalChipCustom}>
                  <MaterialCommunityIcons
                    name="star"
                    size={10}
                    color="#E91E63"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.criticalChipText}>Essencial</Text>
                </View>
              </View>
            )}
          </View>
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
          size={56}
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
                    size={20}
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
                        key as
                          | 'location'
                          | 'notifications'
                          | 'mediaLibrary'
                          | 'audio',
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
    margin: 12,
    borderRadius: 20,
    maxHeight: '100%',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  permissionsList: {
    marginBottom: 20,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 60,
    overflow: 'visible',
  },
  permissionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${LuvaBrancaColors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  permissionContent: {
    flex: 1,
    paddingRight: 4,
    minHeight: 40,
    overflow: 'visible',
  },
  chipContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 1,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
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
    borderRadius: 10,
    minWidth: 40,
  },
  criticalChipCustom: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    minWidth: 40,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalChipText: {
    color: '#FF9800',
    fontSize: 8,
    fontWeight: '600',
  },
  permissionCard: {
    marginBottom: 8,
    elevation: 2,
  },
  permissionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    marginLeft: 12,
    flex: 1,
  },
  permissionStatus: {
    fontSize: 12,
    color: '#666666',
    marginTop: 1,
  },
  retryButton: {
    marginLeft: 8,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    paddingVertical: 8,
    borderRadius: 25,
  },
  secondaryButton: {
    paddingVertical: 4,
    alignSelf: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginTop: 12,
    marginBottom: 6,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
})

export default PermissionsSetup
