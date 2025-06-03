import React, { useRef, useState } from 'react'
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

import { Locales, styles } from '@/lib'
import { useNotifications } from '@/src/hooks/useNotifications'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useProfile } from '@/src/hooks/useProfile'

const { width, height } = Dimensions.get('window')

const GUARDIOES = [
  { nome: 'Contato 1', telefone: '+5500000000000', whatsapp: '+5500000000000' },
  // TODO: Substituir pelos guardiões cadastrados pela usuária
]

const TabsHome = () => {
  const [snackbar, setSnackbar] = useState('')
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { unreadCount, sendLocalNotification } = useNotifications()

  // Animações
  const scale = useSharedValue(1)
  const pulseScale = useSharedValue(1)

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  // Função para obter localização
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null
    const loc = await Location.getCurrentPositionAsync({})
    return loc.coords
  }

  // Envia SMS e WhatsApp para guardiões
  const sendAlert = async (policia = false) => {
    const coords = await getLocation()
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

    // Enviar notificação local
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

    // SMS
    for (const g of GUARDIOES) {
      if (await SMS.isAvailableAsync()) {
        await SMS.sendSMSAsync([g.telefone], msg)
      }
      // WhatsApp
      Linking.openURL(
        `https://wa.me/${g.whatsapp.replace('+', '')}?text=${encodeURIComponent(msg)}`,
      )
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
    Alert.alert(
      'Alerta para Guardiões',
      'Enviar alerta de emergência para seus guardiões?',
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
      title: 'Documentos',
      icon: 'file-document-multiple',
      onPress: () => router.push('/(tabs)/documentos'),
      color: '#4A90E2',
    },
    {
      title: 'Guardiões',
      icon: 'account-group',
      onPress: () => router.push('/(tabs)/guardioes'),
      color: '#7B68EE',
    },
    {
      title: 'Orientações',
      icon: 'help-circle',
      onPress: () => router.push('/(tabs)/orientacao'),
      color: '#50C878',
    },
    {
      title: 'Gravações',
      icon: 'microphone',
      onPress: () => router.push('/(tabs)/arquivo'),
      color: '#EA5455',
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

  return (
    <View style={homeStyles.container}>
      {/* Header com saudação */}
      <View style={[homeStyles.header, { paddingTop: insets.top + 16 }]}>
        <View style={homeStyles.headerContent}>
          <View style={homeStyles.userInfo}>
            <View style={homeStyles.userIcon}>
              <MaterialCommunityIcons
                name="account-circle"
                size={24}
                color="#FF3B7C"
              />
            </View>
            <Text style={homeStyles.greeting}>Olá, {getFirstName().toUpperCase()}</Text>
          </View>
          <TouchableOpacity 
            style={homeStyles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <View style={{ position: 'relative' }}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color="#222222"
              />
              {unreadCount > 0 && (
                <Badge 
                  style={homeStyles.notificationBadge}
                  size={16}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </View>
          </TouchableOpacity>
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
                    colors={isEmergencyActive ? ['#28C76F', '#20A85F'] : ['#FF3B7C', '#E91E63']}
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
              
              <Text style={homeStyles.emergencyTitle}>Emergência</Text>
              <Text style={homeStyles.emergencySubtitle}>
                Pressione por 3 segundos
              </Text>
            </View>

            {/* Grid de Funcionalidades */}
            <View style={homeStyles.functionalitiesContainer}>
              <View style={homeStyles.gridContainer}>
                {functionalityItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={homeStyles.gridItem}
                    onPress={item.onPress}
                    activeOpacity={0.8}
                  >
                    <View style={[homeStyles.gridItemIcon, { backgroundColor: `${item.color}15` }]}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={width < 375 ? 28 : 32}
                        color={item.color}
                      />
                    </View>
                    <Text 
                      style={homeStyles.gridItemTitle}
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
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#F9F9F9',
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
    color: '#222222',
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
    color: '#222222',
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  functionalitiesContainer: {
    backgroundColor: 'white',
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
    backgroundColor: 'white',
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
    borderColor: '#F0F0F0',
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
    color: '#222222',
    textAlign: 'center',
    lineHeight: width < 375 ? 16 : 18,
    maxHeight: width < 375 ? 32 : 36,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
})

export default TabsHome
