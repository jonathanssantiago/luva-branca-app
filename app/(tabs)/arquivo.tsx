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
  Menu,
  Divider,
} from 'react-native-paper'
import { FlatList, View, StyleSheet, Dimensions, Alert, RefreshControl } from 'react-native'
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
  const [refreshing, setRefreshing] = useState(false)
  const [syncOptionsVisible, setSyncOptionsVisible] = useState(false)

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
    syncRecordings,
    cleanupOrphanFiles,
    rescanLocalFiles,
    loadUserRecordings,
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

  // Função para pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true)
    try {
      console.log('Pull to refresh - syncing...')
      
      // Re-scan e sincronização
      const rescanResult = await rescanLocalFiles()
      const syncResult = await syncRecordings()
      
      if (syncResult.success) {
        const { actions } = syncResult
        if (actions.uploaded > 0 || actions.downloaded > 0 || rescanResult.found > 0) {
          let message = `Atualizado: ${actions.uploaded} enviados, ${actions.downloaded} baixados`
          if (rescanResult.found > 0) {
            message += ` (${rescanResult.found} locais)`
          }
          setSnackbar(message)
        }
      } else {
        // Tentar apenas recarregar da nuvem
        await loadUserRecordings()
      }
    } catch (error) {
      console.error('Refresh error:', error)
      // Fallback: apenas recarregar
      await loadUserRecordings()
    } finally {
      setRefreshing(false)
    }
  }

  // Função para sincronizar gravações
  const handleSync = async () => {
    setSyncOptionsVisible(false)
    
    try {
      console.log('Starting manual sync...')
      
      // Primeiro, fazer re-scan dos arquivos locais
      const rescanResult = await rescanLocalFiles()
      console.log('Re-scan result:', rescanResult)
      
      // Depois fazer a sincronização
      const result = await syncRecordings()
      console.log('Sync result:', result)
      
      if (result.success) {
        const { actions } = result
        let message = 'Sincronização concluída!'
        
        if (actions.uploaded > 0 || actions.downloaded > 0) {
          message = `Sincronizado: ${actions.uploaded} enviados, ${actions.downloaded} baixados`
          
          if (rescanResult.found > 0) {
            message += ` (${rescanResult.found} arquivos locais encontrados)`
          }
        } else if (rescanResult.found > 0) {
          message = `${rescanResult.found} arquivos locais encontrados - todos já sincronizados`
        }
        
        setSnackbar(message)
      } else {
        setSnackbar('Erro na sincronização')
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSnackbar('Erro na sincronização')
    }
  }

  // Função para re-scan manual
  const handleRescan = async () => {
    setSyncOptionsVisible(false)
    
    try {
      const result = await rescanLocalFiles()
      
      if (result.success) {
        setSnackbar(`Re-scan concluído: ${result.found} arquivos locais encontrados`)
      } else {
        setSnackbar(result.error || 'Erro no re-scan')
      }
    } catch (error) {
      setSnackbar('Erro no re-scan')
    }
  }

  // Função para limpar arquivos órfãos
  const handleCleanup = async () => {
    Alert.alert(
      'Limpar Arquivos Órfãos',
      'Esta ação irá deletar arquivos locais que não existem na nuvem. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            setSyncOptionsVisible(false)
            
            try {
              const result = await cleanupOrphanFiles()
              
              if (result.success) {
                setSnackbar(`${result.cleaned} arquivos órfãos removidos`)
              } else {
                setSnackbar(result.error || 'Erro ao limpar arquivos')
              }
            } catch (error) {
              setSnackbar('Erro ao limpar arquivos')
            }
          },
        },
      ],
    )
  }

  // Função de reprodução simulada (pode ser implementada com expo-av no futuro)
  const reproduzirPausar = async (recording: AudioRecording) => {
    try {
      if (playingId === recording.id) {
        setPlayingId(null)
        setSnackbar('Reprodução pausada')
      } else {
        setPlayingId(recording.id)
        setSnackbar('Reproduzindo áudio...')
        // Auto-stop após 3 segundos para demo
        setTimeout(() => {
          if (playingId === recording.id) {
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
      return 'cloud-upload-outline'
    } else if (recording.isUploaded) {
      return 'cloud-check-outline'
    } else if (recording.uploadError) {
      return 'cloud-off-outline'
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
        <View style={arquivoStyles.header}>
          <Text variant="headlineMedium" style={[arquivoStyles.title, { color: colors.primary }]}>
            {Locales.t('arquivo.titulo')}
          </Text>
        </View>

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
        <View style={arquivoStyles.listSection}>
          <View style={arquivoStyles.listHeader}>
            <Text variant="titleMedium" style={[arquivoStyles.listTitle, { color: colors.textPrimary }]}>
              Minhas Gravações ({recordings.length})
            </Text>
            <View style={arquivoStyles.listActions}>
              <Menu
                visible={syncOptionsVisible}
                onDismiss={() => setSyncOptionsVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setSyncOptionsVisible(true)}
                    style={arquivoStyles.syncMenuButton}
                  />
                }
              >
                <Menu.Item
                  onPress={handleSync}
                  title="Sincronizar"
                  leadingIcon="sync"
                />
                <Menu.Item
                  onPress={handleRescan}
                  title="Re-scan Local"
                  leadingIcon="refresh"
                />
                <Menu.Item
                  onPress={handleCleanup}
                  title="Limpar Órfãos"
                  leadingIcon="broom"
                />
                <Divider />
                <Menu.Item
                  onPress={() => setSyncOptionsVisible(false)}
                  title="Cancelar"
                  leadingIcon="close"
                />
              </Menu>
            </View>
          </View>

          {/* Indicador de progresso */}
          {isUploading && (
            <View style={arquivoStyles.uploadProgress}>
              <ProgressBar indeterminate color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
                Enviando gravação...
              </Text>
            </View>
          )}
        </View>

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
                      onPress={() => reproduzirPausar(item)}
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

              {/* Status indicators com sync status */}
              <View style={arquivoStyles.statusContainer}>
                {item.isUploading && (
                  <Chip 
                    icon="cloud-upload-outline" 
                    compact
                    style={{ backgroundColor: colors.primary + '20' }}
                    textStyle={{ color: colors.primary }}
                  >
                    Enviando...
                  </Chip>
                )}
                
                {item.isUploaded && !item.isUploading && (
                  <Chip 
                    icon="cloud-check-outline" 
                    compact 
                    style={{ backgroundColor: '#4CAF50' + '20' }}
                    textStyle={{ color: '#4CAF50' }}
                  >
                    Enviado
                  </Chip>
                )}
                
                {item.uploadError && !item.isUploading && (
                  <Chip 
                    icon="cloud-off-outline" 
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

                {/* Indicadores de status de sincronização */}
                {item.syncStatus === 'local_only' && (
                  <Chip 
                    mode="outlined" 
                    compact 
                    textStyle={{ fontSize: 10 }}
                    style={{ backgroundColor: colors.warning + '20' }}
                  >
                    Local apenas
                  </Chip>
                )}
                {item.syncStatus === 'cloud_only' && (
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
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
  syncMenuButton: {
    marginLeft: 8,
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
