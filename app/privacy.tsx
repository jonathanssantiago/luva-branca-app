import React from 'react'
import { ScrollView, View, StyleSheet, Alert } from 'react-native'
import {
  Card,
  Text,
  Switch,
  List,
  Button,
  Divider,
  Chip,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { CustomHeader } from '@/src/components/ui'
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings'

const PrivacyScreen = () => {
  const { settings, loading, updateSetting } = usePrivacySettings()

  const handleDisguisedModeToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Modo Disfarçado Ativado',
        'O aplicativo agora será exibido como um app de receitas culinárias. Para acessar as funcionalidades reais do Luva Branca, toque 5 vezes rapidamente no título "Dicas de Culinária".\n\nIsso é para sua proteção em situações de vigilância.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Ativar',
            onPress: () => {
              updateSetting('disguisedMode', true)
              Alert.alert(
                'Ativado!',
                'O modo disfarçado foi ativado. O app será reiniciado.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Força uma navegação para o modo disfarçado
                      setTimeout(() => {
                        router.replace('/disguised-mode')
                      }, 100)
                    },
                  },
                ],
              )
            },
          },
        ],
      )
    } else {
      updateSetting('disguisedMode', false)
      Alert.alert('Desativado', 'O modo disfarçado foi desativado.')
    }
  }

  const handleDeleteData = () => {
    Alert.alert(
      'Excluir Dados',
      'Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmação',
              'Funcionalidade de exclusão em desenvolvimento',
            )
          },
        },
      ],
    )
  }

  const handleExportData = () => {
    Alert.alert(
      'Exportar Dados',
      'Funcionalidade de exportação em desenvolvimento',
    )
  }

  const renderSwitchItem = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isWarning?: boolean,
  ) => (
    <List.Item
      title={title}
      description={subtitle}
      left={(props) => <List.Icon {...props} icon={icon} />}
      right={() => <Switch value={value} onValueChange={onValueChange} />}
      style={[styles.listItem, isWarning && styles.warningItem]}
    />
  )

  const lockTimeoutOptions = [
    { label: '1 minuto', value: '1min' },
    { label: '5 minutos', value: '5min' },
    { label: '15 minutos', value: '15min' },
    { label: '30 minutos', value: '30min' },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <CustomHeader
        title="Privacidade"
        iconColor="#666666"
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
      />

      <View style={styles.content}>
        {/* Data Privacy Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Privacidade de Dados</Text>
            <Divider style={styles.divider} />

            {renderSwitchItem(
              'Compartilhar Localização',
              'Permitir que o app acesse sua localização',
              'map-marker',
              settings.shareLocation,
              (value) => updateSetting('shareLocation', value),
            )}

            {renderSwitchItem(
              'Dados de Uso',
              'Compartilhar como você usa o aplicativo',
              'chart-line',
              settings.shareUsageData,
              (value) => updateSetting('shareUsageData', value),
            )}

            {renderSwitchItem(
              'Analytics',
              'Ajudar a melhorar o app com dados anônimos',
              'google-analytics',
              settings.allowAnalytics,
              (value) => updateSetting('allowAnalytics', value),
            )}

            {renderSwitchItem(
              'Compartilhar com Parceiros',
              'Permitir compartilhamento com serviços terceiros',
              'share-variant',
              settings.shareWithPartners,
              (value) => updateSetting('shareWithPartners', value),
              true,
            )}
          </Card.Content>
        </Card>

        {/* Security Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Segurança</Text>
            <Divider style={styles.divider} />

            {renderSwitchItem(
              'Autenticação Biométrica',
              'Usar impressão digital ou Face ID',
              'fingerprint',
              settings.biometricAuth,
              (value) => updateSetting('biometricAuth', value),
            )}

            {renderSwitchItem(
              'Bloqueio Automático',
              'Bloquear app automaticamente quando inativo',
              'lock',
              settings.autoLock,
              (value) => updateSetting('autoLock', value),
            )}

            {settings.autoLock && (
              <View style={styles.timeoutSection}>
                <View style={styles.timeoutHeader}>
                  <MaterialCommunityIcons
                    name="timer"
                    size={20}
                    color="#666666"
                  />
                  <Text style={styles.timeoutTitle}>Tempo para Bloqueio</Text>
                </View>

                <View style={styles.chipContainer}>
                  {lockTimeoutOptions.map((option) => (
                    <Chip
                      key={option.value}
                      selected={settings.lockTimeout === option.value}
                      onPress={() =>
                        updateSetting('lockTimeout', option.value as any)
                      }
                      style={styles.chip}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {renderSwitchItem(
              'Ocultar Conteúdo',
              'Ocultar conteúdo na troca de apps',
              'eye-off',
              settings.hideContent,
              (value) => updateSetting('hideContent', value),
            )}

            {renderSwitchItem(
              'Modo Disfarçado',
              'Usar aparência de app de receitas para proteção',
              'chef-hat',
              settings.disguisedMode,
              handleDisguisedModeToggle,
            )}
          </Card.Content>
        </Card>

        {/* Data Management Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Gerenciamento de Dados</Text>
            <Divider style={styles.divider} />

            <List.Item
              title="Baixar Meus Dados"
              description="Exportar uma cópia dos seus dados"
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleExportData}
              style={styles.listItem}
            />

            <List.Item
              title="Política de Privacidade"
              description="Ver nossa política de privacidade"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                Alert.alert(
                  'Política',
                  'Redirecionando para política de privacidade...',
                )
              }
              style={styles.listItem}
            />

            <List.Item
              title="Termos de Uso"
              description="Consultar termos e condições"
              left={(props) => (
                <List.Icon {...props} icon="file-document-outline" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                Alert.alert('Termos', 'Redirecionando para termos de uso...')
              }
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Permissions Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Permissões do App</Text>
            <Divider style={styles.divider} />

            <List.Item
              title="Gerenciar Permissões"
              description="Controlar acesso do app aos recursos do dispositivo"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                Alert.alert(
                  'Permissões',
                  'Redirecionando para configurações do sistema...',
                )
              }
              style={styles.listItem}
            />

            <View style={styles.permissionsList}>
              <View style={styles.permissionItem}>
                <MaterialCommunityIcons
                  name="camera"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={styles.permissionText}>Câmera</Text>
                <Chip icon="check" style={styles.permissionChip}>
                  Permitido
                </Chip>
              </View>

              <View style={styles.permissionItem}>
                <MaterialCommunityIcons
                  name="microphone"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={styles.permissionText}>Microfone</Text>
                <Chip icon="check" style={styles.permissionChip}>
                  Permitido
                </Chip>
              </View>

              <View style={styles.permissionItem}>
                <MaterialCommunityIcons name="file" size={20} color="#4CAF50" />
                <Text style={styles.permissionText}>Armazenamento</Text>
                <Chip icon="check" style={styles.permissionChip}>
                  Permitido
                </Chip>
              </View>

              <View style={styles.permissionItem}>
                <MaterialCommunityIcons name="bell" size={20} color="#FF9800" />
                <Text style={styles.permissionText}>Notificações</Text>
                <Chip
                  icon="clock"
                  style={[styles.permissionChip, styles.pendingChip]}
                >
                  Pendente
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.sectionCard, styles.dangerCard]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>
              Zona de Perigo
            </Text>
            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleDeleteData}
              icon="delete"
              textColor="#EA5455"
              style={styles.dangerButton}
            >
              Excluir Todos os Dados
            </Button>

            <Text style={styles.dangerText}>
              Esta ação é irreversível e removerá permanentemente todos os seus
              dados do aplicativo.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 8,
  },
  warningItem: {
    backgroundColor: '#FFF3E0',
  },
  timeoutSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  timeoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeoutTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  permissionsList: {
    marginTop: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  permissionChip: {
    backgroundColor: '#E8F5E8',
  },
  pendingChip: {
    backgroundColor: '#FFF3E0',
  },
  dangerCard: {
    borderColor: '#EA5455',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#EA5455',
  },
  dangerButton: {
    borderColor: '#EA5455',
    marginBottom: 16,
  },
  dangerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})

export default PrivacyScreen
