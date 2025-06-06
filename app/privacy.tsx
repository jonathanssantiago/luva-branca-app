import React, { useState, useEffect } from 'react'
import { ScrollView, View, StyleSheet, Alert, Share } from 'react-native'
import {
  Card,
  Text,
  Switch,
  List,
  Button,
  Divider,
  Chip,
  IconButton,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, Stack } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { CustomHeader } from '@/src/components/ui'
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { useBiometricAuth } from '@/src/hooks/useBiometricAuth'

const PrivacyScreen = () => {
  const { settings, loading, updateSetting } = usePrivacySettings()
  const colors = useThemeExtendedColors()
  const {
    isAvailable: biometricAvailable,
    hasHardware,
    isEnrolled,
    toggleBiometric,
    loading: biometricLoading,
  } = useBiometricAuth()

  const handleDisguisedModeToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Ativar Modo Disfarçado',
        'O app se parecerá com um aplicativo de receitas. Deseja continuar?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Ativar',
            onPress: () => {
              updateSetting('disguisedMode', true)
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              )
              // Redireciona imediatamente para o modo disfarçado
              router.replace('/disguised-mode')
            },
          },
        ],
      )
    } else {
      updateSetting('disguisedMode', false)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value && !biometricAvailable) {
        Alert.alert(
          'Biometria Indisponível',
          !hasHardware
            ? 'Este dispositivo não possui hardware biométrico.'
            : 'Nenhuma biometria foi configurada no dispositivo. Configure primeiro nas configurações do sistema.',
          [{ text: 'OK' }],
        )
        return
      }

      if (value) {
        Alert.alert(
          'Ativar Biometria',
          'A autenticação biométrica será solicitada automaticamente quando necessário.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ativar',
              onPress: async () => {
                await toggleBiometric(true)
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                )
              },
            },
          ],
        )
      } else {
        await toggleBiometric(false)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar a configuração biométrica.')
    }
  }

  const handleDeleteData = () => {
    Alert.alert(
      'Excluir Todos os Dados',
      'Esta ação é irreversível e removerá permanentemente todos os seus dados do aplicativo. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Implementação', 'Funcionalidade em desenvolvimento')
          },
        },
      ],
    )
  }

  const handleExportData = () => {
    Alert.alert(
      'Baixar Meus Dados',
      'Será gerado um arquivo com todos os seus dados pessoais.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Baixar',
          onPress: () => {
            Alert.alert('Implementação', 'Funcionalidade em desenvolvimento')
          },
        },
      ],
    )
  }

  const renderSwitchItem = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isWarning?: boolean,
    disabled?: boolean,
    statusChip?: string,
  ) => (
    <List.Item
      title={title}
      description={
        <View>
          <Text style={{ color: colors.textSecondary }}>{subtitle}</Text>
          {statusChip && (
            <Chip
              style={{
                marginTop: 4,
                alignSelf: 'flex-start',
                backgroundColor: isWarning
                  ? colors.errorContainer
                  : colors.primaryContainer,
              }}
              textStyle={{
                fontSize: 10,
                color: isWarning
                  ? colors.onErrorContainer
                  : colors.onPrimaryContainer,
              }}
            >
              {statusChip}
            </Chip>
          )}
        </View>
      }
      left={(props) => (
        <List.Icon {...props} icon={icon} color={colors.iconSecondary} />
      )}
      right={() => (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      )}
      style={[
        styles.listItem,
        isWarning && styles.warningItem,
        disabled && { opacity: 0.6 },
      ]}
      titleStyle={{ color: colors.textPrimary }}
    />
  )

  const lockTimeoutOptions = [
    { label: '1 minuto', value: '1min' },
    { label: '5 minutos', value: '5min' },
    { label: '15 minutos', value: '15min' },
    { label: '30 minutos', value: '30min' },
  ]

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacidade e Segurança',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <CustomHeader
          title="Privacidade"
          leftIcon="arrow-left"
          onLeftPress={() => router.back()}
        />

        <View style={styles.content}>
          {/* Data Privacy Section */}
          <Card
            style={[styles.sectionCard, { backgroundColor: colors.surface }]}
          >
            <Card.Content>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Privacidade de Dados
              </Text>
              <Divider
                style={[styles.divider, { backgroundColor: colors.outline }]}
              />

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
          <Card
            style={[styles.sectionCard, { backgroundColor: colors.surface }]}
          >
            <Card.Content>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Segurança
              </Text>
              <Divider
                style={[styles.divider, { backgroundColor: colors.outline }]}
              />

              {renderSwitchItem(
                'Autenticação Biométrica',
                'Usar impressão digital ou Face ID para acesso automático',
                'fingerprint',
                settings.biometricAuth,
                handleBiometricToggle,
                !biometricAvailable,
                biometricLoading,
                !hasHardware
                  ? 'Hardware indisponível'
                  : !isEnrolled
                    ? 'Não configurada no sistema'
                    : biometricAvailable
                      ? 'Disponível'
                      : 'Verificando...',
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
          <Card
            style={[styles.sectionCard, { backgroundColor: colors.surface }]}
          >
            <Card.Content>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Gerenciamento de Dados
              </Text>
              <Divider
                style={[styles.divider, { backgroundColor: colors.outline }]}
              />

              <List.Item
                title="Baixar Meus Dados"
                description="Exportar uma cópia dos seus dados"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="download"
                    color={colors.iconSecondary}
                  />
                )}
                right={(props) => (
                  <List.Icon
                    {...props}
                    icon="chevron-right"
                    color={colors.iconSecondary}
                  />
                )}
                onPress={handleExportData}
                style={styles.listItem}
                titleStyle={{ color: colors.textPrimary }}
                descriptionStyle={{ color: colors.textSecondary }}
              />

              <List.Item
                title="Política de Privacidade"
                description="Ver nossa política de privacidade"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="file-document"
                    color={colors.iconSecondary}
                  />
                )}
                right={(props) => (
                  <List.Icon
                    {...props}
                    icon="chevron-right"
                    color={colors.iconSecondary}
                  />
                )}
                onPress={() =>
                  Alert.alert(
                    'Política',
                    'Redirecionando para política de privacidade...',
                  )
                }
                style={styles.listItem}
                titleStyle={{ color: colors.textPrimary }}
                descriptionStyle={{ color: colors.textSecondary }}
              />

              <List.Item
                title="Termos de Uso"
                description="Consultar termos e condições"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="file-document-outline"
                    color={colors.iconSecondary}
                  />
                )}
                right={(props) => (
                  <List.Icon
                    {...props}
                    icon="chevron-right"
                    color={colors.iconSecondary}
                  />
                )}
                onPress={() =>
                  Alert.alert('Termos', 'Redirecionando para termos de uso...')
                }
                style={styles.listItem}
                titleStyle={{ color: colors.textPrimary }}
                descriptionStyle={{ color: colors.textSecondary }}
              />
            </Card.Content>
          </Card>

          {/* Danger Zone */}
          <Card
            style={[
              styles.sectionCard,
              styles.dangerCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Card.Content>
              <Text
                style={[
                  styles.sectionTitle,
                  styles.dangerTitle,
                  { color: colors.error },
                ]}
              >
                Zona de Perigo
              </Text>
              <Divider
                style={[styles.divider, { backgroundColor: colors.outline }]}
              />

              <Button
                mode="outlined"
                onPress={handleDeleteData}
                icon="delete"
                textColor={colors.error}
                style={[styles.dangerButton, { borderColor: colors.error }]}
              >
                Excluir Todos os Dados
              </Button>

              <Text
                style={[styles.dangerText, { color: colors.textSecondary }]}
              >
                Esta ação é irreversível e removerá permanentemente todos os
                seus dados do aplicativo.
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </>
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
