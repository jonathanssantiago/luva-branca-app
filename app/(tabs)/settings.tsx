import * as SecureStore from 'expo-secure-store'
import React from 'react'
import { Platform, useColorScheme, Dimensions, View, Alert } from 'react-native'
import {
  Surface,
  List,
  Menu,
  Button,
  IconButton,
  Icon,
  Text,
  ActivityIndicator,
} from 'react-native-paper'

import {
  Color,
  Language,
  Languages,
  LoadingIndicator,
  Locales,
  Setting,
  styles,
} from '@/lib'
import { ScreenContainer } from '@/src/components/ui'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import { PermissionsStatus } from '@/src/components/PermissionsStatus'
import {
  useTheme as useCustomTheme,
  useThemeExtendedColors,
} from '@/src/context/ThemeContext'
import { useSyncStatus } from '@/src/hooks/useSyncStatus'

const { width } = Dimensions.get('window')

const formatSyncDate = (timestamp: number): string => {
  if (!timestamp) return 'Nunca'
  const date = new Date(timestamp)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const Settings = () => {
  const { themeMode, setThemeMode, isDark } = useCustomTheme()
  const colors = useThemeExtendedColors()
  const colorScheme = useColorScheme() ?? 'light'
  const [loading, setLoading] = React.useState<boolean>(false)
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    pendingSummary,
    failedSummary,
    lastSyncAt,
    hasPendingData,
    retrySyncNow,
    retryFailed,
  } = useSyncStatus()

  const handleSyncNow = async () => {
    try {
      await retrySyncNow()
    } catch {
      Alert.alert('Erro', 'Não foi possível sincronizar. Tente novamente.')
    }
  }

  const handleRetryFailed = async () => {
    try {
      await retryFailed()
    } catch {
      Alert.alert('Erro', 'Não foi possível reenviar os itens com falha.')
    }
  }
  const [settings, setSettings] = React.useState<Setting>({
    color: 'default',
    language: 'pt',
    theme: 'auto',
  })
  const [display, setDisplay] = React.useState({
    language: false,
    theme: false,
  })

  React.useEffect(() => {
    setLoading(true)

    if (Platform.OS !== 'web') {
      SecureStore.getItemAsync('settings')
        .then((result) =>
          setSettings(JSON.parse(result ?? JSON.stringify(settings))),
        )
        .catch((res) => {
          console.error('Erro ao carregar configurações:', res)
        })
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <ScreenContainer
        scrollable
        contentStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: colors.background,
        }}
      >
        {/* Título da tela */}
        <Text
          variant="headlineMedium"
          style={{
            textAlign: 'center',
            marginBottom: 8,
            color: colors.textPrimary,
            fontWeight: 'bold',
            fontSize: width < 400 ? 24 : 28,
          }}
        >
          Configurações
        </Text>

        <Text
          variant="bodyMedium"
          style={{
            textAlign: 'center',
            marginBottom: 24,
            color: colors.textSecondary,
            lineHeight: 20,
          }}
        >
          Personalize sua experiência no app
        </Text>

        {loading ? (
          <LoadingIndicator />
        ) : (
          <Surface
            elevation={0}
            style={{
              backgroundColor: 'transparent',
              flex: 1,
            }}
          >
            <List.AccordionGroup>
              <List.Accordion
                id="1"
                title="Permissões"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="shield-check"
                    color={colors.primary}
                  />
                )}
                titleStyle={{ color: colors.textPrimary }}
                style={{ backgroundColor: colors.surface }}
              >
                <PermissionsStatus />
              </List.Accordion>

              <List.Accordion
                id="2"
                title="Sincronização"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="cloud-sync"
                    color={colors.primary}
                  />
                )}
                titleStyle={{ color: colors.textPrimary }}
                style={{ backgroundColor: colors.surface }}
              >
                <View style={{ paddingVertical: 4, backgroundColor: colors.surface }}>
                  <List.Item
                    title="Conexão"
                    description={isOnline ? 'Online' : 'Offline'}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={isOnline ? 'wifi' : 'wifi-off'}
                        color={isOnline ? '#4CAF50' : colors.error}
                      />
                    )}
                    titleStyle={{ color: colors.textPrimary }}
                    descriptionStyle={{
                      color: isOnline ? '#4CAF50' : colors.error,
                    }}
                  />

                  <List.Item
                    title="Itens pendentes"
                    description={
                      pendingCount > 0
                        ? pendingSummary || `${pendingCount} itens aguardando envio`
                        : 'Nenhum item pendente'
                    }
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          pendingCount > 0
                            ? 'cloud-upload-outline'
                            : 'cloud-check-outline'
                        }
                        color={
                          pendingCount > 0 ? '#F57C00' : '#4CAF50'
                        }
                      />
                    )}
                    titleStyle={{ color: colors.textPrimary }}
                    descriptionStyle={{
                      color: pendingCount > 0 ? '#F57C00' : colors.textSecondary,
                    }}
                  />

                  {failedCount > 0 && (
                    <List.Item
                      title="Itens com falha"
                      description={
                        failedSummary || `${failedCount} itens com falha de envio`
                      }
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon="cloud-off-outline"
                          color={colors.error}
                        />
                      )}
                      titleStyle={{ color: colors.error }}
                      descriptionStyle={{ color: colors.error }}
                    />
                  )}

                  <List.Item
                    title="Última sincronização"
                    description={formatSyncDate(lastSyncAt)}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon="clock-check-outline"
                        color={colors.textSecondary}
                      />
                    )}
                    titleStyle={{ color: colors.textPrimary }}
                    descriptionStyle={{ color: colors.textSecondary }}
                  />

                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingTop: 8,
                      paddingBottom: 16,
                      gap: 10,
                    }}
                  >
                    <Button
                      mode="outlined"
                      icon={isSyncing ? undefined : 'cloud-sync'}
                      onPress={handleSyncNow}
                      disabled={!isOnline || isSyncing || !hasPendingData}
                      textColor={colors.primary}
                      style={{
                        borderColor: colors.primary,
                        borderRadius: 10,
                      }}
                    >
                      {isSyncing ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <ActivityIndicator size={16} color={colors.primary} />
                          <Text style={{ color: colors.primary }}>
                            Sincronizando...
                          </Text>
                        </View>
                      ) : (
                        'Sincronizar Agora'
                      )}
                    </Button>

                    {failedCount > 0 && (
                      <Button
                        mode="contained"
                        icon="cloud-refresh"
                        onPress={handleRetryFailed}
                        disabled={!isOnline || isSyncing}
                        buttonColor={colors.error}
                        textColor="#FFFFFF"
                        style={{ borderRadius: 10 }}
                      >
                        Reenviar {failedCount}{' '}
                        {failedCount === 1 ? 'Falha' : 'Falhas'}
                      </Button>
                    )}

                    {!isOnline && (
                      <Text
                        variant="bodySmall"
                        style={{
                          color: colors.textSecondary,
                          textAlign: 'center',
                          fontStyle: 'italic',
                          marginTop: 4,
                        }}
                      >
                        Conecte-se à internet para sincronizar
                      </Text>
                    )}
                  </View>
                </View>
              </List.Accordion>
            </List.AccordionGroup>
          </Surface>
        )}
      </ScreenContainer>
    </>
  )
}

export default Settings
