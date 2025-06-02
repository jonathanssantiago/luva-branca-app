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
  
  // Hook de notificações
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
    },
    {
      title: 'Guardiões',
      icon: 'account-group',
      onPress: () => router.push('/(tabs)/guardioes'),
    },
    {
      title: 'Orientação e\nDúvidas',
      icon: 'help-circle',
      onPress: () => router.push('/(tabs)/orientacao'),
    },
    {
      title: 'Arquivo',
      icon: 'microphone',
      onPress: () => router.push('/(tabs)/arquivo'),
    },
    {
      title: 'Apoio\nPsicológico',
      icon: 'heart-multiple',
      onPress: () => router.push('/(tabs)/apoio'),
    },
    {
      title: 'Configurações',
      icon: 'cog',
      onPress: () => router.push('/(tabs)/settings'),
    },
  ]

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
            <Text style={homeStyles.greeting}>Olá, BRUNA</Text>
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
                  >
                    <View style={homeStyles.gridItemIcon}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={32}
                        color="#FF3B7C"
                      />
                    </View>
                    <Text style={homeStyles.gridItemTitle}>{item.title}</Text>
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
    paddingTop: 32,
    paddingHorizontal: 20,
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
    paddingBottom: 32,
  },
  gridItem: {
    width: (width - 60) / 2, // 2 colunas com espaçamento
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridItemIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFD6E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    textAlign: 'center',
    lineHeight: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
})

export default TabsHome
