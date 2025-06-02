import React, { useState } from 'react'
import { ScrollView, View, StyleSheet, Alert } from 'react-native'
import {
  Card,
  Text,
  Switch,
  List,
  Button,
  Divider,
  RadioButton,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { CustomHeader } from '@/src/components/ui'

interface AppSettings {
  notifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  darkMode: boolean
  autoBackup: boolean
  syncEnabled: boolean
  fontSize: 'small' | 'medium' | 'large'
  language: 'pt' | 'en' | 'es'
}

const AppSettingsScreen = () => {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    darkMode: false,
    autoBackup: true,
    syncEnabled: true,
    fontSize: 'medium',
    language: 'pt',
  })

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleResetSettings = () => {
    Alert.alert(
      'Confirmar Reset',
      'Deseja realmente restaurar todas as configurações para o padrão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            setSettings({
              notifications: true,
              soundEnabled: true,
              vibrationEnabled: true,
              darkMode: false,
              autoBackup: true,
              syncEnabled: true,
              fontSize: 'medium',
              language: 'pt',
            })
            Alert.alert('Sucesso', 'Configurações restauradas para o padrão!')
          },
        },
      ]
    )
  }

  const renderSwitchItem = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <List.Item
      title={title}
      description={subtitle}
      left={props => <List.Icon {...props} icon={icon} />}
      right={() => (
        <Switch
          value={value}
          onValueChange={onValueChange}
        />
      )}
      style={styles.listItem}
    />
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <CustomHeader
        title="Configurações"
        iconColor="#666666"
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
      />

      <View style={styles.content}>
        {/* Notifications Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Notificações</Text>
            <Divider style={styles.divider} />
            
            {renderSwitchItem(
              'Notificações Push',
              'Receber alertas e mensagens',
              'bell',
              settings.notifications,
              (value) => updateSetting('notifications', value)
            )}

            {renderSwitchItem(
              'Sons',
              'Reproduzir sons de notificação',
              'volume-high',
              settings.soundEnabled,
              (value) => updateSetting('soundEnabled', value)
            )}

            {renderSwitchItem(
              'Vibração',
              'Vibrar ao receber notificações',
              'vibrate',
              settings.vibrationEnabled,
              (value) => updateSetting('vibrationEnabled', value)
            )}
          </Card.Content>
        </Card>

        {/* Appearance Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Aparência</Text>
            <Divider style={styles.divider} />
            
            {renderSwitchItem(
              'Modo Escuro',
              'Usar tema escuro do aplicativo',
              'brightness-6',
              settings.darkMode,
              (value) => updateSetting('darkMode', value)
            )}

            <View style={styles.radioSection}>
              <View style={styles.radioHeader}>
                <MaterialCommunityIcons name="format-size" size={20} color="#666666" />
                <Text style={styles.radioTitle}>Tamanho da Fonte</Text>
              </View>
              
              <RadioButton.Group
                onValueChange={(value) => updateSetting('fontSize', value as AppSettings['fontSize'])}
                value={settings.fontSize}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="small" />
                  <Text style={styles.radioLabel}>Pequena</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="medium" />
                  <Text style={styles.radioLabel}>Média</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="large" />
                  <Text style={styles.radioLabel}>Grande</Text>
                </View>
              </RadioButton.Group>
            </View>
          </Card.Content>
        </Card>

        {/* Data & Sync Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Dados e Sincronização</Text>
            <Divider style={styles.divider} />
            
            {renderSwitchItem(
              'Backup Automático',
              'Fazer backup dos dados automaticamente',
              'backup-restore',
              settings.autoBackup,
              (value) => updateSetting('autoBackup', value)
            )}

            {renderSwitchItem(
              'Sincronização',
              'Sincronizar dados entre dispositivos',
              'sync',
              settings.syncEnabled,
              (value) => updateSetting('syncEnabled', value)
            )}

            <List.Item
              title="Fazer Backup Agora"
              description="Criar backup manual dos dados"
              left={props => <List.Icon {...props} icon="cloud-upload" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Backup', 'Funcionalidade em desenvolvimento')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Language Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Idioma</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.radioSection}>
              <RadioButton.Group
                onValueChange={(value) => updateSetting('language', value as AppSettings['language'])}
                value={settings.language}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="pt" />
                  <Text style={styles.radioLabel}>Português</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="en" />
                  <Text style={styles.radioLabel}>English</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="es" />
                  <Text style={styles.radioLabel}>Español</Text>
                </View>
              </RadioButton.Group>
            </View>
          </Card.Content>
        </Card>

        {/* Advanced Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Avançado</Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Limpar Cache"
              description="Limpar dados temporários do app"
              left={props => <List.Icon {...props} icon="broom" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Cache', 'Funcionalidade em desenvolvimento')}
              style={styles.listItem}
            />

            <List.Item
              title="Sobre o App"
              description="Versão e informações do aplicativo"
              left={props => <List.Icon {...props} icon="information" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Sobre', 'Luva Branca v1.0.0')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Reset Button */}
        <Card style={styles.resetCard}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleResetSettings}
              icon="restore"
              textColor="#EA5455"
              style={styles.resetButton}
            >
              Restaurar Configurações
            </Button>
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
  radioSection: {
    marginTop: 16,
  },
  radioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
  },
  resetCard: {
    marginTop: 24,
    marginBottom: 40,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  resetButton: {
    borderColor: '#EA5455',
  },
})

export default AppSettingsScreen 