import React, { useState, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Text,
  Button,
  List,
  IconButton,
  Card,
  ProgressBar,
  Chip,
  useTheme,
} from 'react-native-paper'
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Locales } from '@/lib'
import { ScreenContainer, AppSnackbar } from '@/src/components/ui'
import { useAppSnackbar } from '@/src/hooks/useAppSnackbar'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { useAudioRecording } from '@/src/hooks/useAudioRecording'
import { useMediaStore } from '@/src/stores/useMediaStore'
import { AudioRecording } from '@/src/database/models/AudioRecording'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { supabase } from '@/lib/supabase'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'

const { width } = Dimensions.get('window')

const Arquivo = () => {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const { user } = useAuth()
  const { snackbar, dismiss, showSuccess, showError, showInfo } = useAppSnackbar()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const {
    isRecording,
    isUploading,
    recordingTime,
    startRecording,
    stopAndUploadRecording,
    formatTime,
  } = useAudioRecording()

  const { audioRecordings, addAudioRecording, removeAudioRecording } = useMediaStore()

  const { bottom } = useSafeAreaInsets()

  const pulseScale = useSharedValue(1)
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  React.useEffect(() => {
    if (isRecording) {
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
      showError(result.error || 'Erro ao iniciar gravação')
    }
  }

  const pararGravacao = async () => {
    const result = await stopAndUploadRecording()
    if (result.recording) {
      try {
        await addAudioRecording(
          {
            filename: result.recording.fileName,
            localUri: result.recording.uri,
            duration: result.recording.duration,
            remoteUrl: result.recording.publicUrl ?? null,
          },
          user!.id,
        )
      } catch (err) {
        console.error('[arquivo] Error saving audio to WatermelonDB:', err)
      }
    }
    if (result.success) {
      const isOffline = result.recording?.syncStatus === 'local_only'
      showSuccess(
        isOffline
          ? 'Gravação salva localmente. Será enviada quando houver conexão.'
          : 'Gravação salva e enviada com sucesso!',
      )
    } else {
      showError(result.error || 'Erro ao parar gravação')
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
            try {
              if (recording.localUri?.startsWith('file://')) {
                try {
                  const fileInfo = await FileSystem.getInfoAsync(recording.localUri)
                  if (fileInfo.exists) {
                    await FileSystem.deleteAsync(recording.localUri)
                  }
                } catch {}
              }
              await removeAudioRecording(recording.id)
              showSuccess('Gravação removida')
            } catch {
              showError('Erro ao remover gravação')
            }
          },
        },
      ],
    )
  }

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  const soundRef = useRef<Audio.Sound | null>(null)

  React.useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().finally(() => {
          soundRef.current?.unloadAsync()
          soundRef.current = null
        })
        setPlayingId(null)
      }
    }
  }, [])

  const refreshSignedUrlForItem = async (filename: string): Promise<string | null> => {
    if (!user?.id) return null
    try {
      const { data } = await supabase.storage
        .from('audios')
        .createSignedUrl(`${user.id}/${filename}`, 604800)
      return data?.signedUrl ?? null
    } catch {
      return null
    }
  }

  const reproduzirPausar = async (recording: AudioRecording | null | undefined) => {
    try {
      if (!recording) {
        showError('Áudio inválido ou não encontrado.')
        return
      }

      const uri = recording.localUri ?? recording.remoteUrl ?? ''
      if (!uri) {
        showError('Áudio inválido ou não encontrado.')
        return
      }

      if (playingId === recording.id) {
        if (soundRef.current) {
          await soundRef.current.stopAsync()
          await soundRef.current.unloadAsync()
          soundRef.current = null
        }
        setPlayingId(null)
        showInfo('Reprodução pausada')
      } else {
        if (soundRef.current) {
          await soundRef.current.stopAsync()
          await soundRef.current.unloadAsync()
          soundRef.current = null
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        })

        let uriToPlay = uri
        if (!uriToPlay.startsWith('file://')) {
          showInfo('Baixando áudio...')
          const destPath = FileSystem.cacheDirectory + recording.filename
          const tryDownload = async (url: string): Promise<string | null> => {
            try {
              const downloadRes = await FileSystem.downloadAsync(url, destPath)
              const info = await FileSystem.getInfoAsync(downloadRes.uri)
              if (info.exists && 'size' in info && info.size > 0) {
                return downloadRes.uri
              }
              return null
            } catch {
              return null
            }
          }

          let downloaded = await tryDownload(uriToPlay)
          if (!downloaded) {
            showInfo('Renovando URL...')
            const freshUrl = await refreshSignedUrlForItem(recording.filename)
            if (!freshUrl) {
              showError('Não foi possível acessar o áudio. Tente sincronizar.')
              return
            }
            downloaded = await tryDownload(freshUrl)
          }

          if (!downloaded) {
            showError('Não foi possível baixar o áudio.')
            return
          }

          // Tenta carregar o arquivo baixado; se falhar (ex: audio/m4a antigo no iOS),
          // faz fallback para streaming direto pela URL assinada
          try {
            const { sound: testSound } = await Audio.Sound.createAsync(
              { uri: downloaded },
              { shouldPlay: false },
            )
            await testSound.unloadAsync()
          } catch {
            const freshUrl = await refreshSignedUrlForItem(recording.filename)
            if (!freshUrl) {
              showError('Não foi possível reproduzir o áudio.')
              return
            }
            uriToPlay = freshUrl
            showInfo('Reproduzindo via stream...')
            const { sound } = await Audio.Sound.createAsync(
              { uri: uriToPlay, headers: {} },
              { shouldPlay: true },
            )
            soundRef.current = sound
            setPlayingId(recording.id)
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                setPlayingId(null)
                sound.unloadAsync()
                soundRef.current = null
              }
            })
            return
          }

          uriToPlay = downloaded
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: uriToPlay },
          { shouldPlay: true },
        )
        soundRef.current = sound
        setPlayingId(recording.id)
        showInfo('Reproduzindo áudio...')
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingId(null)
            sound.unloadAsync()
            soundRef.current = null
          }
          if (
            status.isLoaded &&
            !status.isPlaying &&
            playingId === recording.id &&
            !status.didJustFinish
          ) {
            setPlayingId(null)
            sound.unloadAsync()
            soundRef.current = null
          }
        })
      }
    } catch (error) {
      console.error('Audio playback error:', error)
      showError('Erro ao reproduzir áudio')
    }
  }

  const getStatusIcon = (recording: AudioRecording) => {
    if (recording.syncStatus === 'synced' || recording.remoteUrl) {
      return 'cloud-check-outline'
    } else if (recording.syncStatus === 'conflict') {
      return 'cloud-off-outline'
    }
    return 'cloud-sync-outline'
  }

  const getStatusColor = (recording: AudioRecording) => {
    if (recording.syncStatus === 'synced' || recording.remoteUrl) {
      return '#4CAF50'
    } else if (recording.syncStatus === 'conflict') {
      return colors.error
    }
    return colors.textSecondary
  }

  return (
    <>
      <ScreenContainer paddingHorizontal={0} paddingVertical={0} hideTabBar={true}>
        <FlatList
          data={audioRecordings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 80 + bottom + 16,
          }}
          ListHeaderComponent={() => (
            <>
              <View style={arquivoStyles.header}>
                <Text
                  variant="headlineMedium"
                  style={[arquivoStyles.title, { color: colors.primary }]}
                >
                  {Locales.t('arquivo.titulo')}
                </Text>
              </View>

              <Text
                variant="bodyMedium"
                style={[arquivoStyles.subtitle, { color: colors.textSecondary }]}
              >
                Grave evidências de áudio para situações de emergência
              </Text>

              {/* Seção de Gravação */}
              <Card
                style={[
                  arquivoStyles.recordingCard,
                  { backgroundColor: colors.surface },
                ]}
              >
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
                        {
                          backgroundColor: isRecording
                            ? colors.error
                            : colors.primary,
                        },
                      ]}
                      onPress={isRecording ? pararGravacao : iniciarGravacao}
                      disabled={isUploading}
                    />
                  </Animated.View>

                  <Text
                    variant="titleMedium"
                    style={[
                      arquivoStyles.recordingStatus,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {isRecording
                      ? 'Gravando...'
                      : isUploading
                        ? 'Enviando...'
                        : 'Pronto para gravar'}
                  </Text>

                  {isRecording && (
                    <>
                      <Text
                        variant="bodyLarge"
                        style={[arquivoStyles.timer, { color: colors.error }]}
                      >
                        {formatTime(recordingTime)}
                      </Text>
                      <ProgressBar
                        indeterminate
                        style={[
                          arquivoStyles.progressBar,
                          { backgroundColor: colors.surface },
                        ]}
                        color={colors.error}
                      />
                    </>
                  )}

                  {isUploading && (
                    <>
                      <Text
                        variant="bodyMedium"
                        style={[
                          arquivoStyles.uploadingText,
                          { color: colors.primary },
                        ]}
                      >
                        Enviando para nuvem...
                      </Text>
                      <ProgressBar
                        indeterminate
                        style={[
                          arquivoStyles.progressBar,
                          { backgroundColor: colors.surface },
                        ]}
                        color={colors.primary}
                      />
                    </>
                  )}
                </View>
              </Card>

              {/* Lista header */}
              <View style={arquivoStyles.listSection}>
                <View style={arquivoStyles.listHeader}>
                  <Text
                    variant="titleMedium"
                    style={[arquivoStyles.listTitle, { color: colors.textPrimary }]}
                  >
                    Minhas Gravações ({audioRecordings.length})
                  </Text>
                </View>

                {isUploading && (
                  <View style={arquivoStyles.uploadProgress}>
                    <ProgressBar
                      indeterminate
                      color={theme.colors.primary}
                      style={{ flex: 1 }}
                    />
                    <Text
                      variant="bodySmall"
                      style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}
                    >
                      Enviando gravação...
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          renderItem={({ item }) => (
            <Card
              style={[
                arquivoStyles.audioCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + '30',
                },
              ]}
            >
              <List.Item
                title={`Gravação ${item.createdAt.toLocaleString('pt-BR')}`}
                description={`${formatTime(item.duration)} • ${item.filename}`}
                left={(props) => (
                  <View
                    style={[
                      arquivoStyles.audioIconContainer,
                      { backgroundColor: colors.primary },
                    ]}
                  >
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
                      icon={getStatusIcon(item)}
                      size={20}
                      iconColor={getStatusColor(item)}
                    />

                    <IconButton
                      icon={playingId === item.id ? 'pause' : 'play'}
                      size={20}
                      iconColor={colors.primary}
                      onPress={() => reproduzirPausar(item)}
                    />

                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={colors.error}
                      onPress={() => confirmarRemocao(item)}
                    />
                  </View>
                )}
                titleStyle={[
                  arquivoStyles.audioTitle,
                  { color: colors.textPrimary },
                ]}
                descriptionStyle={[
                  arquivoStyles.audioDescription,
                  { color: colors.textSecondary },
                ]}
              />

              <View style={arquivoStyles.statusContainer}>
                {(item.syncStatus === 'synced' || item.remoteUrl) && (
                  <Chip
                    icon="cloud-check-outline"
                    compact
                    style={{ backgroundColor: '#4CAF50' + '20' }}
                    textStyle={{ color: '#4CAF50' }}
                  >
                    Enviado
                  </Chip>
                )}

                {item.syncStatus === 'pending' && !item.remoteUrl && (
                  <Chip
                    icon="cloud-sync-outline"
                    compact
                    style={{ backgroundColor: colors.primary + '20' }}
                    textStyle={{ color: colors.primary }}
                  >
                    Aguardando envio
                  </Chip>
                )}

                {item.syncStatus === 'conflict' && (
                  <Chip
                    icon="cloud-off-outline"
                    compact
                    style={{ backgroundColor: colors.error + '20' }}
                    textStyle={{ color: colors.error }}
                  >
                    Erro no envio
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

                {!item.localUri && item.remoteUrl && (
                  <Chip
                    mode="outlined"
                    compact
                    textStyle={{ fontSize: 10 }}
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    Nuvem apenas
                  </Chip>
                )}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={arquivoStyles.emptyContainer}>
              <Ionicons
                name="mic-outline"
                size={64}
                color={colors.iconSecondary}
              />
              <Text
                style={[arquivoStyles.emptyText, { color: colors.textPrimary }]}
              >
                {Locales.t('arquivo.nenhuma')}
              </Text>
              <Text
                style={[
                  arquivoStyles.emptySubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Suas gravações de emergência aparecerão aqui
              </Text>
            </View>
          }
          style={arquivoStyles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <AppSnackbar
          visible={!!snackbar}
          message={snackbar?.message}
          type={snackbar?.type ?? 'info'}
          onDismiss={dismiss}
        />
      </ScreenContainer>
    </>
  )
}

const arquivoStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: width < 400 ? 24 : 28,
    flex: 1,
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
  listSection: {
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  listTitle: {
    fontWeight: '600',
    fontSize: width < 400 ? 16 : 18,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
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
  list: {
    flex: 1,
    paddingHorizontal: 4,
  },
})

export default Arquivo
