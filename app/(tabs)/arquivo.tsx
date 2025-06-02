import React, { useState, useEffect } from 'react'
import {
  Surface,
  Text,
  Button,
  List,
  Snackbar,
  IconButton,
  Card,
  ProgressBar,
  Chip,
  useTheme,
} from 'react-native-paper'
import { FlatList, View, StyleSheet, Dimensions } from 'react-native'
import { Audio } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Locales } from '@/lib'
import { ScreenContainer } from '@/src/components/ui'
// import { useSupabaseArquivos } from '@/src/hooks/useSupabaseArquivos' // Exemplo de hook para integração

const { width } = Dimensions.get('window')

interface Gravacao {
  id: string
  uri: string
  data: string
  duracao?: string
  tamanho?: number
}

const Arquivo = () => {
  const theme = useTheme()
  const [gravando, setGravando] = useState(false)
  const [gravador, setGravador] = useState<Audio.Recording | null>(null)
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([])
  const [snackbar, setSnackbar] = useState('')
  const [audioPlayer, setAudioPlayer] = useState<Audio.Sound | null>(null)
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [tempoGravacao, setTempoGravacao] = useState(0)

  // Animação para o botão de gravação
  const pulseScale = useSharedValue(1)
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  useEffect(() => {
    let interval: any
    if (gravando) {
      interval = setInterval(() => {
        setTempoGravacao((prev) => prev + 1)
      }, 1000)

      // Animação de pulsação durante gravação
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 800 }),
        -1,
        true,
      )
    } else {
      pulseScale.value = withTiming(1)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gravando])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Exemplo de integração Supabase (substitua pelo hook real)
  // const { gravacoes, addGravacao, loading, error } = useSupabaseArquivos()

  const iniciarGravacao = async () => {
    try {
      setLoading(true)
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') {
        setSnackbar(Locales.t('arquivo.permissaoNegada'))
        setLoading(false)
        return
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })
      const rec = new Audio.Recording()
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await rec.startAsync()
      setGravador(rec)
      setGravando(true)
      setLoading(false)
    } catch (e) {
      setSnackbar(Locales.t('arquivo.erroIniciar'))
      setLoading(false)
    }
  }

  const pararGravacao = async () => {
    if (!gravador) return
    setLoading(true)
    await gravador.stopAndUnloadAsync()
    const uri = gravador.getURI()
    if (uri) {
      const novaGravacao: Gravacao = {
        id: Date.now().toString(),
        uri,
        data: new Date().toLocaleString('pt-BR'),
        duracao: formatTime(tempoGravacao),
      }
      setGravacoes([novaGravacao, ...gravacoes])
      setSnackbar(Locales.t('arquivo.salva'))
    }
    setGravando(false)
    setGravador(null)
    setTempoGravacao(0)
    setLoading(false)
  }

  const ouvirAudio = async (id: string, uri: string) => {
    try {
      if (audioPlayer) {
        await audioPlayer.unloadAsync()
        setAudioPlayer(null)
        if (playingId === id) {
          setPlayingId(null)
          return
        }
      }

      const { sound } = await Audio.Sound.createAsync({ uri })
      setAudioPlayer(sound)
      setPlayingId(id)

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null)
        }
      })

      await sound.playAsync()
    } catch (error) {
      setSnackbar('Erro ao reproduzir áudio')
    }
  }

  const removeGravacao = (id: string) => {
    if (playingId === id && audioPlayer) {
      audioPlayer.unloadAsync()
      setAudioPlayer(null)
      setPlayingId(null)
    }
    setGravacoes(gravacoes.filter((g) => g.id !== id))
    setSnackbar('Gravação removida')
  }

  return (
    <>
      <ScreenContainer scrollable>
        <Text variant="headlineMedium" style={arquivoStyles.title}>
          {Locales.t('arquivo.titulo')}
        </Text>

        <Text variant="bodyMedium" style={[arquivoStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Grave evidências de áudio para situações de emergência
        </Text>

        {/* Seção de Gravação */}
        <Card style={arquivoStyles.recordingCard}>
          <View style={arquivoStyles.recordingContent}>
            <Animated.View
              style={[arquivoStyles.recordButtonContainer, pulseStyle]}
            >
              <IconButton
                icon={gravando ? 'stop' : 'microphone'}
                size={width < 400 ? 40 : 48}
                iconColor="white"
                style={[
                  arquivoStyles.recordButton,
                  gravando && arquivoStyles.recordButtonActive,
                ]}
                onPress={gravando ? pararGravacao : iniciarGravacao}
                disabled={loading}
              />
            </Animated.View>

            <Text variant="titleMedium" style={[arquivoStyles.recordingStatus, { color: '#222222' }]}>
              {gravando ? 'Gravando...' : 'Pronto para gravar'}
            </Text>

            {gravando && (
              <>
                <Text variant="bodyLarge" style={[arquivoStyles.timer, { color: '#EA5455' }]}>
                  {formatTime(tempoGravacao)}
                </Text>
                <ProgressBar
                  indeterminate
                  style={arquivoStyles.progressBar}
                  color="#EA5455" // Vermelho para gravação
                />
              </>
            )}
          </View>
        </Card>

        {/* Lista de Gravações */}
        <Text variant="titleMedium" style={[arquivoStyles.listTitle, { color: '#222222' }]}>
          Minhas Gravações ({gravacoes.length})
        </Text>

        <FlatList
          data={gravacoes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={arquivoStyles.audioCard}>
              <List.Item
                title={`Gravação ${item.data}`}
                description={item.duracao || 'Duração desconhecida'}
                left={(props) => (
                  <View style={[arquivoStyles.audioIconContainer, { backgroundColor: '#EA5455' }]}>
                    <Ionicons
                      name={playingId === item.id ? 'pause' : 'play'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                )}
                right={(props) => (
                  <View style={arquivoStyles.audioActions}>
                    <IconButton
                      icon={playingId === item.id ? 'pause' : 'play'}
                      size={20}
                      iconColor="#EA5455"
                      onPress={() => ouvirAudio(item.id, item.uri)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#EA5455"
                      onPress={() => removeGravacao(item.id)}
                    />
                  </View>
                )}
                titleStyle={[arquivoStyles.audioTitle, { color: '#222222' }]}
                descriptionStyle={[arquivoStyles.audioDescription, { color: '#666666' }]}
              />
              {playingId === item.id && (
                <View style={arquivoStyles.playingIndicator}>
                  <Chip 
                    icon="volume-high" 
                    compact
                    style={{ backgroundColor: '#FFD6E5' }}
                    textStyle={{ color: '#EA5455' }}
                  >
                    Reproduzindo...
                  </Chip>
                </View>
              )}
            </Card>
          )}
          ListEmptyComponent={
            <View style={arquivoStyles.emptyContainer}>
              <Ionicons name="mic-outline" size={64} color="#CCCCCC" />
              <Text style={[arquivoStyles.emptyText, { color: '#666666' }]}>
                {Locales.t('arquivo.nenhuma')}
              </Text>
              <Text style={[arquivoStyles.emptySubtext, { color: '#CCCCCC' }]}>
                Suas gravações de emergência aparecerão aqui
              </Text>
            </View>
          }
          style={arquivoStyles.list}
          showsVerticalScrollIndicator={false}
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
      </ScreenContainer>
    </>
  )
}

const arquivoStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#EA5455',
    fontSize: width < 400 ? 24 : 28,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: width < 400 ? 8 : 16,
    lineHeight: 20,
  },
  recordingCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    backgroundColor: '#F9F9F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  recordingContent: {
    padding: width < 400 ? 20 : 24,
    alignItems: 'center',
  },
  recordButtonContainer: {
    marginBottom: 16,
  },
  recordButton: {
    backgroundColor: '#EA5455',
    width: width < 400 ? 80 : 96,
    height: width < 400 ? 80 : 96,
    borderRadius: width < 400 ? 40 : 48,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B7C',
  },
  recordingStatus: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: width < 400 ? 16 : 18,
  },
  timer: {
    marginBottom: 16,
    fontFamily: 'monospace',
    fontSize: width < 400 ? 20 : 24,
    fontWeight: 'bold',
  },
  progressBar: {
    width: width * 0.7,
    marginBottom: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFECEC',
  },
  recordingHint: {
    color: '#666',
    textAlign: 'center',
  },
  listTitle: {
    marginBottom: 16,
    fontWeight: '600',
    fontSize: width < 400 ? 16 : 18,
  },
  list: {
    flex: 1,
    paddingHorizontal: 4,
  },
  audioCard: {
    marginBottom: 12,
    elevation: 3,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F9F9F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  audioIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width < 400 ? 44 : 48,
    height: width < 400 ? 44 : 48,
    borderRadius: width < 400 ? 22 : 24,
    marginLeft: 8,
    elevation: 2,
  },
  audioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: width < 400 ? 80 : 100,
  },
  audioTitle: {
    fontSize: width < 400 ? 15 : 16,
    fontWeight: '500',
    lineHeight: width < 400 ? 20 : 22,
  },
  audioDescription: {
    fontSize: width < 400 ? 13 : 14,
    lineHeight: 18,
  },
  playingIndicator: {
    paddingHorizontal: width < 400 ? 12 : 16,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: width < 400 ? 13 : 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default Arquivo
