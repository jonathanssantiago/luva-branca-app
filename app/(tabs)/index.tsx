import React, { useRef, useState } from 'react'
import {
  Text,
  Card,
  IconButton,
  Badge,
} from 'react-native-paper'
import {
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
  Dimensions,
  Alert,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native'
import * as Location from 'expo-location'
import * as SMS from 'expo-sms'
import * as Linking from 'expo-linking'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'

import { Locales, styles } from '@/lib'
import { useNotifications } from '@/src/hooks/useNotifications'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useProfileStore } from '@/src/stores/useProfileStore'
import { useGuardiansStore } from '@/src/stores/useGuardiansStore'
import { useEmergencyAlertsStore } from '@/src/stores/useEmergencyAlertsStore'
import { usePermissions } from '@/src/hooks/usePermissions'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { AppSnackbar } from '@/src/components/ui'
import { useAppSnackbar } from '@/src/hooks/useAppSnackbar'
import { useDisguisedMode } from '@/src/context/DisguisedModeContext'

const { width } = Dimensions.get('window')

// Helper de log que só executa em desenvolvimento
const dbg = (...args: any[]) => {
  if (__DEV__) console.log(...args)
}

const TabsHome = () => {
  const { snackbar, dismiss, showSuccess, showWarning } = useAppSnackbar()
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { profile } = useProfileStore()
  const { guardians } = useGuardiansStore()
  const getEmergencyContacts = () => guardians.filter((g) => g.isActive)
  const { unreadCount } = useNotifications()
  const { emergencyAlerts, addEmergencyAlert } = useEmergencyAlertsStore()
  const pendingEmergencyCount = emergencyAlerts.filter((a) => a.syncStatus !== 'synced').length
  const {
    permissions,
    requestLocationPermission,
    showCriticalPermissionsDialog,
  } = usePermissions()

  const { enterDisguisedMode } = useDisguisedMode()

  // Hook de cores do tema
  const colors = useThemeExtendedColors()

  // Animações
  const scale = useSharedValue(1)
  const pulseScale = useSharedValue(1)

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  // Função para obter localização com fallback robusto
  const getLocation = async () => {
    // Primeiro verificar e solicitar permissão de localização
    if (permissions.location !== 'granted') {
      const granted = await requestLocationPermission()
      if (!granted) {
        dbg('❌ [DEBUG] Permissão de localização negada')
        Alert.alert(
          'Permissão de Localização',
          'A permissão de localização é necessária para enviar sua localização em emergências. Por favor, ative nas configurações.',
          [
            { text: 'Agora Não', style: 'cancel' },
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
        return null
      }
    }

    // Verificar se os serviços de localização estão ativos
    const locationEnabled = await Location.hasServicesEnabledAsync()
    if (!locationEnabled) {
      dbg('❌ [DEBUG] Serviços de localização desativados')
      Alert.alert(
        'Localização Desativada',
        'Os serviços de localização estão desativados. Por favor, ative a localização nas configurações do seu dispositivo para enviar sua localização em emergências.',
        [
          { text: 'Agora Não', style: 'cancel' },
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
      return null
    }

    // Agora que temos permissão e serviços ativos, obter localização
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      return loc.coords
    } catch (error) {
      console.error('Erro ao obter localização:', error)
      Alert.alert(
        'Erro de Localização',
        'Não foi possível obter sua localização. Verifique se o GPS está ativo e tente novamente.',
        [{ text: 'OK' }],
      )
      return null
    }
  }

  // Envia SMS e WhatsApp para guardiões
  const sendAlert = async (policia = false) => {
    dbg('🚨 Função sendAlert iniciada:', { policia })

    const coords = await getLocation()
    dbg('📍 Localização obtida:', !!coords)

    let msg = policia
      ? Locales.t('sos.msgPolicia')
      : Locales.t('sos.msgGuardioes')
    if (coords) {
      msg += `\n${Locales.t('sos.localizacao')}: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
    }

    // Animação de ativação
    setIsEmergencyActive(true)
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      ),
      3,
      false,
    )

    // Obter guardiões de emergência
    const emergencyContacts = getEmergencyContacts()
    dbg('👥 Contatos de emergência obtidos:', emergencyContacts.length)

    if (emergencyContacts.length === 0 && !policia) {
      dbg('⚠️ Nenhum guardião cadastrado!')
      showWarning(
        'Nenhum guardião cadastrado. Configure seus guardiões primeiro.',
      )
      setIsEmergencyActive(false)
      return
    }

    // Enviar para guardiões via SMS e WhatsApp
    if (!policia) {
      let hasFailures = false
      dbg('🚨 Iniciando envio de alertas para', emergencyContacts.length, 'guardiões')

      for (const guardian of emergencyContacts) {
        try {
          dbg(`📱 Processando guardião: ${guardian.name}`)

          // SMS
          const smsAvailable = await SMS.isAvailableAsync()
          dbg(`📨 SMS disponível:`, smsAvailable)

          if (smsAvailable) {
            dbg(`📨 Enviando SMS para ${guardian.name}...`)
            await SMS.sendSMSAsync([guardian.phone], msg)
            dbg(`✅ SMS enviado para ${guardian.name}`)
          } else {
            dbg(`⚠️ SMS não disponível para ${guardian.name}`)
            hasFailures = true
          }

          // WhatsApp - tentar abrir, mas não aguardar
          const whatsappUrl = `https://wa.me/${guardian.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`

          // Não awaitar o WhatsApp pois pode falhar silenciosamente
          Linking.openURL(whatsappUrl).catch((error) => {
            dbg(`❌ Falha ao abrir WhatsApp para ${guardian.name}:`, error)
            hasFailures = true
          })

          dbg(`✅ WhatsApp iniciado para ${guardian.name}`)
        } catch (error) {
          console.error(`Erro ao enviar alerta para ${guardian.name}:`, error)
          hasFailures = true
        }
      }

      dbg('📊 Resultado do envio:', { houveFalhas: hasFailures, totalEnviados: emergencyContacts.length })

      // Registrar alerta no banco local (append-only, sincroniza com o servidor depois)
      await addEmergencyAlert({
        message: msg,
        guardiansJson: JSON.stringify(emergencyContacts.map((g) => ({ name: g.name, phone: g.phone }))),
        isPoliceEmergency: false,
        locationLat: coords?.latitude ?? null,
        locationLng: coords?.longitude ?? null,
      }, user!.id)

      if (hasFailures) {
        showWarning(
          'Alerta enviado. Alguns contatos serão reenviados quando houver conexão.',
        )
      }
    } else {
      // Para emergência policial, ligar para 190
      try {
        await Linking.openURL('tel:190')
      } catch (error) {
        console.error('Erro ao ligar para a polícia:', error)
      }

      // Registrar alerta no banco local
      await addEmergencyAlert({
        message: msg,
        guardiansJson: '[]',
        isPoliceEmergency: true,
        locationLat: coords?.latitude ?? null,
        locationLng: coords?.longitude ?? null,
      }, user!.id)
    }

    setTimeout(() => {
      setIsEmergencyActive(false)
      enterDisguisedMode()
      router.replace('/disguised-mode')
    }, 2000)

    showSuccess(
      policia
        ? Locales.t('sos.snackbarPolicia')
        : Locales.t('sos.snackbarGuardioes'),
    )
  }

  // Toque rápido
  const handlePress = () => {
    const emergencyContacts = getEmergencyContacts()

    if (emergencyContacts.length === 0) {
      Alert.alert(
        'Nenhum Guardião Cadastrado',
        'Você precisa cadastrar pelo menos um guardião para enviar alertas de emergência.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cadastrar Guardiões',
            onPress: () => router.push('/(tabs)/guardioes'),
          },
        ],
      )
      return
    }

    Alert.alert(
      'Alerta para Guardiões',
      `Enviar alerta de emergência para ${emergencyContacts.length} guardião(es)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => sendAlert(false) },
      ],
    )
  }

  // Toque longo (3s)
  const handleLongPress = () => {
    Alert.alert(
      'Emergência Policial',
      'Enviar chamada de emergência para a polícia? Esta ação deve ser usada apenas em casos de perigo real.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Chamar Polícia',
          style: 'destructive',
          onPress: () => {
            Vibration.vibrate(1000)
            sendAlert(true)
          },
        },
      ],
    )
  }

  // Grid de funcionalidades
  const functionalityItems = [
    {
      title: 'Meu Diário',
      icon: 'book-open-page-variant',
      onPress: () => router.push('/diary'),
      color: '#7B68EE',
    },
    {
      title: 'Gravações',
      icon: 'microphone',
      onPress: () => router.push('/(tabs)/arquivo'),
      color: '#EA5455',
    },
    {
      title: 'Documentos',
      icon: 'file-document-multiple',
      onPress: () => router.push('/(tabs)/documentos'),
      color: '#4A90E2',
    },
    {
      title: 'Guardiões',
      icon: 'account-group',
      onPress: () => router.push('/(tabs)/guardioes'),
      color: '#DDA0DD',
    },
    {
      title: 'Orientações',
      icon: 'help-circle',
      onPress: () => router.push('/(tabs)/orientacao'),
      color: '#50C878',
    },
    {
      title: 'Apoio',
      icon: 'heart-multiple',
      onPress: () => router.push('/(tabs)/apoio'),
      color: '#FF6B9D',
    },
    {
      title: 'Configurações',
      icon: 'cog',
      onPress: () => router.push('/(tabs)/settings'),
      color: '#95A5A6',
    },
  ]

  const getFirstName = () => {
    if (profile?.fullName) {
      return profile.fullName.split(' ')[0]
    }
    const metaName = user?.user_metadata?.full_name as string | undefined
    if (metaName) {
      return metaName.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    if (user?.phone) {
      return user.phone
    }
    return 'Usuário'
  }

  return (
    <View
      style={[homeStyles.container, { backgroundColor: colors.background }]}
    >
      {/* Header com saudação */}
      <View
        style={[
          homeStyles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={homeStyles.headerContent}>
          <View style={homeStyles.userInfo}>
            <View style={homeStyles.userIcon}>
              <MaterialCommunityIcons
                name="account-circle"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[homeStyles.greeting, { color: colors.textPrimary }]}>
              Olá, {getFirstName().toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={homeStyles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <View style={{ position: 'relative' }}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={colors.iconPrimary}
              />
              {unreadCount > 0 && (
                <Badge style={homeStyles.notificationBadge} size={16}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </View>
          </TouchableOpacity>

          {/* Indicador de alertas pendentes de sincronização */}
          {pendingEmergencyCount > 0 && (
            <TouchableOpacity
              style={homeStyles.offlineIcon}
              onPress={() => {
                Alert.alert(
                  'Alertas Pendentes',
                  `Você tem ${pendingEmergencyCount} alerta(s) aguardando sincronização com o servidor.`,
                  [{ text: 'OK' }],
                )
              }}
            >
              <MaterialCommunityIcons
                name="wifi-off"
                size={20}
                color={colors.warning}
              />
              <Badge
                style={[
                  homeStyles.notificationBadge,
                  { backgroundColor: colors.warning },
                ]}
                size={12}
              >
                {pendingEmergencyCount}
              </Badge>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <View style={homeStyles.scrollContent}>
            {/* Botão de Emergência Principal */}
            <View style={homeStyles.emergencySection}>
              <Animated.View style={[pulseStyle]}>
                <TouchableOpacity
                  style={[
                    homeStyles.emergencyButton,
                    isEmergencyActive && homeStyles.emergencyButtonActive,
                  ]}
                  onPress={handlePress}
                  onLongPress={handleLongPress}
                  delayLongPress={3000}
                  accessibilityLabel="Botão de emergência"
                >
                  <LinearGradient
                    colors={
                      isEmergencyActive
                        ? ['#28C76F', '#20A85F']
                        : [colors.primary, colors.primary + 'DD']
                    }
                    style={homeStyles.emergencyGradient}
                  >
                    <MaterialCommunityIcons
                      name={isEmergencyActive ? 'check' : 'hand-wave'}
                      size={80}
                      color="white"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Text
                style={[
                  homeStyles.emergencyTitle,
                  { color: colors.textPrimary },
                ]}
              >
                Emergência
              </Text>
              <Text
                style={[
                  homeStyles.emergencySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Pressione por 3 segundos
              </Text>
            </View>

            {/* Grid de Funcionalidades */}
            <View
              style={[
                homeStyles.functionalitiesContainer,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <View style={homeStyles.gridContainer}>
                {functionalityItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      homeStyles.gridItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.outline,
                      },
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        homeStyles.gridItemIcon,
                        { backgroundColor: `${item.color}15` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={width < 375 ? 28 : 32}
                        color={item.color}
                      />
                    </View>
                    <Text
                      style={[
                        homeStyles.gridItemTitle,
                        { color: colors.textPrimary },
                      ]}
                      numberOfLines={2}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.85}
                    >
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      />

      <AppSnackbar
        visible={!!snackbar}
        message={snackbar?.message}
        type={snackbar?.type ?? 'info'}
        onDismiss={dismiss}
      />
    </View>
  )
}

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationIcon: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espaço para o menu inferior
  },
  emergencySection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emergencyButton: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyButtonActive: {
    // Animação será controlada pelo gradient
  },
  emergencyGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  functionalitiesContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: width < 375 ? 24 : 32,
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingBottom: width < 375 ? 24 : 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: width < 375 ? 12 : 16,
  },
  gridItem: {
    width: (width - (width < 375 ? 44 : 56)) / 2, // 2 colunas com espaçamento responsivo
    borderRadius: width < 375 ? 12 : 16,
    padding: width < 375 ? 16 : 20,
    minHeight: width < 375 ? 110 : 120,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
  },
  gridItemIcon: {
    width: width < 375 ? 56 : 64,
    height: width < 375 ? 56 : 64,
    borderRadius: width < 375 ? 28 : 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: width < 375 ? 8 : 12,
  },
  gridItemTitle: {
    fontSize: width < 375 ? 13 : 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: width < 375 ? 16 : 18,
    maxHeight: width < 375 ? 32 : 36,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  offlineIcon: {
    position: 'relative',
    marginLeft: 12,
    padding: 4,
  },
})

export default TabsHome
