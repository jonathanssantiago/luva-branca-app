import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Surface,
  Text,
  Snackbar,
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
import { useFocusEffect } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'

import { Locales, styles } from '@/lib'
import { useNotifications } from '@/src/hooks/useNotifications'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useGuardians } from '@/src/hooks/useGuardians'
import { useOfflineAlerts } from '@/src/hooks/useOfflineAlerts'
import { usePermissions } from '@/src/hooks/usePermissions'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

const { width, height } = Dimensions.get('window')

const TabsHome = () => {
  const [snackbar, setSnackbar] = useState('')
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { guardians, getEmergencyContacts, refreshGuardians } = useGuardians()
  const { unreadCount, sendLocalNotification } = useNotifications()
  const { addOfflineAlert, processOfflineAlerts, getPendingAlerts } =
    useOfflineAlerts()
  const {
    permissions,
    requestLocationPermission,
    showCriticalPermissionsDialog,
  } = usePermissions()

  // Hook de cores do tema
  const colors = useThemeExtendedColors()

  // Animações
  const scale = useSharedValue(1)
  const pulseScale = useSharedValue(1)

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  // Processar alertas offline quando o componente montar
  useEffect(() => {
    const handleOfflineAlerts = async () => {
      const pendingAlerts = getPendingAlerts()

      if (pendingAlerts.length > 0) {
        await processOfflineAlerts(async (alert) => {
          try {
            // Tentar reenviar SMS e WhatsApp
            for (const guardian of alert.guardians) {
              if (await SMS.isAvailableAsync()) {
                await SMS.sendSMSAsync([guardian.phone], alert.message)
              }

              const whatsappUrl = `https://wa.me/${guardian.phone.replace(/\D/g, '')}?text=${encodeURIComponent(alert.message)}`
              await Linking.openURL(whatsappUrl)
            }

            // Para emergência policial
            if (alert.isPoliceEmergency) {
              await Linking.openURL('tel:190')
            }

            return true // Sucesso
          } catch (error) {
            console.error('Erro ao reenviar alerta offline:', error)
            return false // Falha
          }
        })
      }
    }

    handleOfflineAlerts()
  }, []) // Removeu dependências que causavam loop

  // Função para obter localização com fallback robusto
  const getLocation = async () => {
    // Primeiro verificar e solicitar permissão de localização
    if (permissions.location !== 'granted') {
      const granted = await requestLocationPermission()
      if (!granted) {
        console.log('❌ [DEBUG] Permissão de localização negada')
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
      console.log('❌ [DEBUG] Serviços de localização desativados')
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
    console.log('🚨 [DEBUG] Função sendAlert iniciada:', { policia })

    const coords = await getLocation()
    console.log('📍 [DEBUG] Localização obtida:', coords)

    let msg = policia
      ? Locales.t('sos.msgPolicia')
      : Locales.t('sos.msgGuardioes')
    if (coords) {
      msg += `\n${Locales.t('sos.localizacao')}: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
    }

    console.log('💬 [DEBUG] Mensagem preparada:', msg)

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
    console.log('👥 [DEBUG] Contatos de emergência obtidos:', {
      total: emergencyContacts.length,
      contatos: emergencyContacts.map((g) => ({
        id: g.id,
        nome: g.name,
        telefone: g.phone,
        ativo: g.is_active,
      })),
    })

    if (emergencyContacts.length === 0 && !policia) {
      console.warn('⚠️ [DEBUG] Nenhum guardião cadastrado!')
      setSnackbar(
        'Nenhum guardião cadastrado. Configure seus guardiões primeiro.',
      )
      setIsEmergencyActive(false)
      return
    }

    // Enviar notificação local (apenas se a permissão estiver concedida)
    if (permissions.notifications === 'granted') {
      try {
        await sendLocalNotification({
          title: policia ? 'Emergência Ativada' : 'Alerta Enviado',
          body: policia
            ? 'Chamada de emergência para a polícia foi enviada'
            : 'Alerta de segurança enviado para seus guardiões',
          type: policia ? 'emergency' : 'security_alert',
          priority: 'high',
          sound: 'default',
        })
      } catch (error) {
        console.error('Erro ao enviar notificação:', error)
      }
    }

    // Enviar para guardiões via SMS e WhatsApp
    if (!policia) {
      let hasFailures = false
      console.log('🚨 [DEBUG] Iniciando envio de alertas para guardiões:', {
        totalGuardioes: emergencyContacts.length,
        guardioes: emergencyContacts.map((g) => ({
          nome: g.name,
          telefone: g.phone,
        })),
      })

      for (const guardian of emergencyContacts) {
        try {
          console.log(
            `📱 [DEBUG] Processando guardião: ${guardian.name} (${guardian.phone})`,
          )

          // SMS
          const smsAvailable = await SMS.isAvailableAsync()
          console.log(`📨 [DEBUG] SMS disponível:`, smsAvailable)

          if (smsAvailable) {
            console.log(`📨 [DEBUG] Enviando SMS para ${guardian.name}...`)
            await SMS.sendSMSAsync([guardian.phone], msg)
            console.log(
              `✅ [DEBUG] SMS enviado com sucesso para ${guardian.name}`,
            )
          } else {
            console.warn(`⚠️ [DEBUG] SMS não disponível para ${guardian.name}`)
            hasFailures = true
          }

          // WhatsApp - tentar abrir, mas não aguardar
          const whatsappUrl = `https://wa.me/${guardian.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
          console.log(
            `💬 [DEBUG] Abrindo WhatsApp para ${guardian.name}: ${whatsappUrl}`,
          )

          // Não awaitar o WhatsApp pois pode falhar silenciosamente
          Linking.openURL(whatsappUrl).catch((error) => {
            console.warn(
              `❌ [DEBUG] Falha ao abrir WhatsApp para ${guardian.name}:`,
              error,
            )
            hasFailures = true
          })

          console.log(`✅ [DEBUG] WhatsApp iniciado para ${guardian.name}`)
        } catch (error) {
          console.error(
            `❌ [DEBUG] Erro ao enviar alerta para ${guardian.name}:`,
            error,
          )
          hasFailures = true
        }
      }

      console.log('📊 [DEBUG] Resultado do envio:', {
        houveFalhas: hasFailures,
        totalEnviados: emergencyContacts.length,
      })

      // Se houve falhas, salvar offline para reenvio posterior
      if (hasFailures) {
        await addOfflineAlert(
          msg,
          emergencyContacts,
          false,
          coords || undefined,
        )
        setSnackbar(
          'Alerta enviado. Alguns contatos serão reenviadios quando houver conexão.',
        )
      }
    } else {
      // Para emergência policial, ligar para 190
      try {
        await Linking.openURL('tel:190')
      } catch (error) {
        console.error('Erro ao ligar para a polícia:', error)
        // Salvar offline para tentar novamente
        await addOfflineAlert(msg, [], true, coords || undefined)
      }
    }

    setTimeout(() => {
      setIsEmergencyActive(false)
    }, 2000)

    setSnackbar(
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

  // Get first name from full name or email
  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Usuário'
  }

  // Refresh automático dos guardiões quando a tela for focada
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Tela index focada - atualizando lista de guardiões')
      refreshGuardians()
    }, [refreshGuardians]),
  )

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

          {/* Indicador de alertas offline pendentes */}
          {getPendingAlerts().length > 0 && (
            <TouchableOpacity
              style={homeStyles.offlineIcon}
              onPress={() => {
                Alert.alert(
                  'Alertas Pendentes',
                  `Você tem ${getPendingAlerts().length} alerta(s) aguardando reenvio quando houver melhor conexão.`,
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
                {getPendingAlerts().length}
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

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        wrapperStyle={{ bottom: 80 }}
        action={{
          label: 'OK',
          onPress: () => setSnackbar(''),
        }}
      >
        {snackbar}
      </Snackbar>
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
