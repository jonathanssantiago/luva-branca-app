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
  Badge,
} from 'react-native-paper'
import { FlatList, View, StyleSheet, Dimensions, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Locales } from '@/lib'
import { ScreenContainer } from '@/src/components/ui'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { useAudioRecording, AudioRecording } from '@/src/hooks/useAudioRecording'

const { width } = Dimensions.get('window')

const Arquivo = () => {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const [snackbar, setSnackbar] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)

  // Usar o novo hook de gravação
  const {
    isRecording,
    isUploading,
    recordings,
    recordingTime,
    startRecording,
    stopAndUploadRecording,
    retryUpload,
    deleteRecording,
    formatTime,
  } = useAudioRecording()

  // Animação para o botão de gravação
  const pulseScale = useSharedValue(1)
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  useEffect(() => {
    if (isRecording) {
      // Animação de pulsação durante gravação
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 800 }),
        -1,
        true,
      )
    } else {
      pulseScale.value = withTiming(1)
    }
  }, [isRecording])

  const iniciarGravacao = async () => {
    const result = await startRecording()
    if (!result.success) {
      setSnackbar(result.error || 'Erro ao iniciar gravação')
    }
  }

  const pararGravacao = async () => {
    const result = await stopAndUploadRecording()
    if (result.success) {
      setSnackbar('Gravação salva e enviada com sucesso!')
    } else {
      setSnackbar(result.error || 'Erro ao parar gravação')
    }
  }

  const tentarNovamente = async (recordingId: string) => {
    const result = await retryUpload(recordingId)
    if (result.success) {
      setSnackbar('Upload realizado com sucesso!')
    } else {
      setSnackbar(result.error || 'Erro ao tentar novamente')
    }
  }

  const confirmarRemocao = (recording: AudioRecording) => {
    Alert.alert(
      'Remover Gravação',
      'Tem certeza que deseja remover esta gravação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteRecording(recording.id)
            if (result.success) {
              setSnackbar('Gravação removida')
            } else {
              setSnackbar(result.error || 'Erro ao remover gravação')
            }
          },
        },
      ],
    )
  }

  // Função de reprodução simulada (pode ser implementada com expo-av no futuro)
  const ouvirAudio = async (id: string, uri: string) => {
    try {
      if (playingId === id) {
        setPlayingId(null)
        setSnackbar('Reprodução pausada')
      } else {
        setPlayingId(id)
        setSnackbar('Reproduzindo áudio...')
        // Auto-stop após 3 segundos para demo
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

  const getStatusIcon = (recording: AudioRecording) => {
    if (recording.isUploading) {
      return 'cloud-upload'
    } else if (recording.isUploaded) {
      return 'cloud-check'
    } else if (recording.uploadError) {
      return 'cloud-off'
    }
    return 'content-save'
  }

  const getStatusColor = (recording: AudioRecording) => {
    if (recording.isUploading) {
      return colors.primary
    } else if (recording.isUploaded) {
      return '#4CAF50' // Verde para sucesso
    } else if (recording.uploadError) {
      return colors.error
    }
    return colors.textSecondary
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
                icon={isRecording ? 'stop' : 'microphone'}
                size={width < 400 ? 40 : 48}
                iconColor={colors.onPrimary}
                style={[
                  arquivoStyles.recordButton,
                  { backgroundColor: isRecording ? colors.error : colors.primary },
                ]}
                onPress={isRecording ? pararGravacao : iniciarGravacao}
                disabled={isUploading}
              />
            </Animated.View>

            <Text variant="titleMedium" style={[arquivoStyles.recordingStatus, { color: colors.textPrimary }]}>
              {isRecording ? 'Gravando...' : isUploading ? 'Enviando...' : 'Pronto para gravar'}
            </Text>

            {isRecording && (
              <>
                <Text variant="bodyLarge" style={[arquivoStyles.timer, { color: colors.error }]}>
                  {formatTime(recordingTime)}
                </Text>
                <ProgressBar
                  indeterminate
                  style={[arquivoStyles.progressBar, { backgroundColor: colors.surface }]}
                  color={colors.error}
                />
              </>
            )}

            {isUploading && (
              <>
                <Text variant="bodyMedium" style={[arquivoStyles.uploadingText, { color: colors.primary }]}>
                  Enviando para nuvem...
                </Text>
                <ProgressBar
                  indeterminate
                  style={[arquivoStyles.progressBar, { backgroundColor: colors.surface }]}
                  color={colors.primary}
                />
              </>
            )}
          </View>
        </Card>

        {/* Lista de Gravações */}
        <Text variant="titleMedium" style={[arquivoStyles.listTitle, { color: colors.textPrimary }]}>
          Minhas Gravações ({recordings.length})
        </Text>

        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={[arquivoStyles.audioCard, { 
              backgroundColor: colors.surface,
              borderColor: colors.primary + '30'
            }]}>
              <List.Item
                title={`Gravação ${item.data}`}
                description={`${formatTime(item.duration)} • ${item.fileName}`}
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
                    {/* Status badge */}
                    <IconButton
                      icon={getStatusIcon(item)}
                      size={20}
                      iconColor={getStatusColor(item)}
                      onPress={() => {
                        if (item.uploadError) {
                          tentarNovamente(item.id)
                        }
                      }}
                    />
                    
                    {/* Play button */}
                    <IconButton
                      icon={playingId === item.id ? 'pause' : 'play'}
                      size={20}
                      iconColor={colors.primary}
                      onPress={() => ouvirAudio(item.id, item.uri)}
                    />
                    
                    {/* Delete button */}
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={colors.error}
                      onPress={() => confirmarRemocao(item)}
                    />
                  </View>
                )}
                titleStyle={[arquivoStyles.audioTitle, { color: colors.textPrimary }]}
                descriptionStyle={[arquivoStyles.audioDescription, { color: colors.textSecondary }]}
              />
              
              {/* Status indicators */}
              <View style={arquivoStyles.statusContainer}>
                {item.isUploading && (
                  <Chip 
                    icon="cloud-upload" 
                    compact
                    style={{ backgroundColor: colors.primary + '20' }}
                    textStyle={{ color: colors.primary }}
                  >
                    Enviando...
                  </Chip>
                )}
                
                {item.isUploaded && !item.isUploading && (
                  <Chip 
                    icon="cloud-check" 
                    compact
                    style={{ backgroundColor: '#4CAF50' + '20' }}
                    textStyle={{ color: '#4CAF50' }}
                  >
                    Enviado
                  </Chip>
                )}
                
                {item.uploadError && !item.isUploading && (
                  <Chip 
                    icon="cloud-off" 
                    compact
                    style={{ backgroundColor: colors.error + '20' }}
                    textStyle={{ color: colors.error }}
                    onPress={() => tentarNovamente(item.id)}
                  >
                    Erro - Toque para tentar novamente
                  </Chip>
                )}
                
                {playingId === item.id && (
                  <Chip 
                    icon="volume-high" 
                    compact
                    style={{ backgroundColor: colors.primary + '20' }}
                    textStyle={{ color: colors.primary }}
                  >
                    Reproduzindo...
                  </Chip>
                )}
              </View>
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
          wrapperStyle={{ bottom: 80 }}
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
  uploadingText: {
    marginBottom: 16,
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '500',
  },
  progressBar: {
    width: width * 0.7,
    marginBottom: 16,
    height: 4,
    borderRadius: 2,
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
    minWidth: width < 400 ? 120 : 140,
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
  statusContainer: {
    paddingHorizontal: width < 400 ? 12 : 16,
    paddingBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
