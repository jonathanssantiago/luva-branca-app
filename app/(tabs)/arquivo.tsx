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
import { FlatList, View, StyleSheet, Dimensions, Alert } from 'react-native'
import { 
  useAudioRecorder, 
  RecordingPresets,
  AudioModule
} from 'expo-audio'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Locales } from '@/lib'
import { ScreenContainer } from '@/src/components/ui'
// Adicionando hook de tema
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
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
  // Hook de cores do tema
  const colors = useThemeExtendedColors()
  const [gravando, setGravando] = useState(false)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([])
  const [snackbar, setSnackbar] = useState('')
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

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.getRecordingPermissionsAsync()
        if (!status.granted) {
          const result = await AudioModule.requestRecordingPermissionsAsync()
          if (!result.granted) {
            Alert.alert('Permission to access microphone was denied')
          }
        }
      } catch (error) {
        console.log('Permission error:', error)
      }
    })();
  }, []);

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
      
      await recorder.prepareToRecordAsync()
      recorder.record()
      setGravando(true)
      setLoading(false)
    } catch (e) {
      console.error('Recording error:', e)
      setSnackbar(Locales.t('arquivo.erroIniciar'))
      setLoading(false)
    }
  }

  const pararGravacao = async () => {
    if (!recorder) return
    setLoading(true)
    
    try {
      await recorder.stop()
      
      if (recorder.uri) {
        const novaGravacao: Gravacao = {
          id: Date.now().toString(),
          uri: recorder.uri,
          data: new Date().toLocaleString('pt-BR'),
          duracao: formatTime(tempoGravacao),
        }
        setGravacoes([novaGravacao, ...gravacoes])
        setSnackbar(Locales.t('arquivo.salva'))
      }
    } catch (error) {
      console.error('Stop recording error:', error)
      setSnackbar('Erro ao parar gravação')
    }
    
    setGravando(false)
    setTempoGravacao(0)
    setLoading(false)
  }

  const ouvirAudio = async (id: string, uri: string) => {
    try {
      // Toggle playback state - for now just toggle the UI
      // Real audio playback would require a different approach with expo-audio
      if (playingId === id) {
        setPlayingId(null)
        setSnackbar('Áudio pausado')
      } else {
        setPlayingId(id)
        setSnackbar('Reproduzindo áudio...')
        // Auto-stop after 3 seconds for demo purposes
        setTimeout(() => {
          if (playingId === id) {
            setPlayingId(null)
          }
        }, 3000)
      }
    } catch (error) {
      console.error('Audio playback error:', error)
      setSnackbar('Erro ao reproduzir áudio')
    }
  }

  const removeGravacao = (id: string) => {
    if (playingId === id) {
      setPlayingId(null)
    }
    setGravacoes(gravacoes.filter((g) => g.id !== id))
    setSnackbar('Gravação removida')
  }

  return (
    <>
      <ScreenContainer scrollable>
        <Text variant="headlineMedium" style={[arquivoStyles.title, { color: colors.primary }]}>
          {Locales.t('arquivo.titulo')}
        </Text>

        <Text variant="bodyMedium" style={[arquivoStyles.subtitle, { color: colors.textSecondary }]}>
          Grave evidências de áudio para situações de emergência
        </Text>

        {/* Seção de Gravação */}
        <Card style={[arquivoStyles.recordingCard, { backgroundColor: colors.surface }]}>
          <View style={arquivoStyles.recordingContent}>
            <Animated.View
              style={[arquivoStyles.recordButtonContainer, pulseStyle]}
            >
              <IconButton
                icon={gravando ? 'stop' : 'microphone'}
                size={width < 400 ? 40 : 48}
                iconColor={colors.onPrimary}
                style={[
                  arquivoStyles.recordButton,
                  { backgroundColor: gravando ? colors.error : colors.primary },
                ]}
                onPress={gravando ? pararGravacao : iniciarGravacao}
                disabled={loading}
              />
            </Animated.View>

            <Text variant="titleMedium" style={[arquivoStyles.recordingStatus, { color: colors.textPrimary }]}>
              {gravando ? 'Gravando...' : 'Pronto para gravar'}
            </Text>

            {gravando && (
              <>
                <Text variant="bodyLarge" style={[arquivoStyles.timer, { color: colors.error }]}>
                  {formatTime(tempoGravacao)}
                </Text>
                <ProgressBar
                  indeterminate
                  style={[arquivoStyles.progressBar, { backgroundColor: colors.surface }]}
                  color={colors.error}
                />
              </>
            )}
          </View>
        </Card>

        {/* Lista de Gravações */}
        <Text variant="titleMedium" style={[arquivoStyles.listTitle, { color: colors.textPrimary }]}>
          Minhas Gravações ({gravacoes.length})
        </Text>

        <FlatList
          data={gravacoes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={[arquivoStyles.audioCard, { 
              backgroundColor: colors.surface,
              borderColor: colors.primary + '30'
            }]}>
              <List.Item
                title={`Gravação ${item.data}`}
                description={item.duracao || 'Duração desconhecida'}
                left={(props) => (
                  <View style={[arquivoStyles.audioIconContainer, { backgroundColor: colors.primary }]}>
                    <Ionicons
                      name={playingId === item.id ? 'pause' : 'play'}
                      size={24}
                      color={colors.onPrimary}
                    />
                  </View>
                )}
                right={(props) => (
                  <View style={arquivoStyles.audioActions}>
                    <IconButton
                      icon={playingId === item.id ? 'pause' : 'play'}
                      size={20}
                      iconColor={colors.primary}
                      onPress={() => ouvirAudio(item.id, item.uri)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={colors.error}
                      onPress={() => removeGravacao(item.id)}
                    />
                  </View>
                )}
                titleStyle={[arquivoStyles.audioTitle, { color: colors.textPrimary }]}
                descriptionStyle={[arquivoStyles.audioDescription, { color: colors.textSecondary }]}
              />
              {playingId === item.id && (
                <View style={arquivoStyles.playingIndicator}>
                  <Chip 
                    icon="volume-high" 
                    compact
                    style={{ backgroundColor: colors.primary + '20' }}
                    textStyle={{ color: colors.primary }}
                  >
                    Reproduzindo...
                  </Chip>
                </View>
              )}
            </Card>
          )}
          ListEmptyComponent={
            <View style={arquivoStyles.emptyContainer}>
              <Ionicons name="mic-outline" size={64} color={colors.iconSecondary} />
              <Text style={[arquivoStyles.emptyText, { color: colors.textPrimary }]}>
                {Locales.t('arquivo.nenhuma')}
              </Text>
              <Text style={[arquivoStyles.emptySubtext, { color: colors.textSecondary }]}>
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
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
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
    width: width < 400 ? 80 : 96,
    height: width < 400 ? 80 : 96,
    borderRadius: width < 400 ? 40 : 48,
    elevation: 4,
  },
  recordButtonActive: {
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
  },
  recordingHint: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
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
