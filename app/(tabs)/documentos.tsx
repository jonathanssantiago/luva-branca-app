import React, { useState } from 'react'
import {
  Text,
  Button,
  FAB,
  Card,
  Chip,
  IconButton,
  Portal,
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
import { Locales } from '@/lib'
import {
  ScreenContainer,
  KeyboardAvoidingDialog,
  AppSnackbar,
} from '@/src/components/ui'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { useDocumentUpload } from '@/src/hooks/useDocumentUpload'
import { useMediaStore } from '@/src/stores/useMediaStore'
import { Document } from '@/src/database/models/Document'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppSnackbar } from '@/src/hooks/useAppSnackbar'
import * as Linking from 'expo-linking'

const { width } = Dimensions.get('window')

const DOCUMENT_CATEGORIES = [
  'RG',
  'CPF',
  'CNH',
  'Comprovante de Residência',
  'Comprovante de Renda',
  'Boletim de Ocorrência',
  'Medida Protetiva',
  'Outros',
]

const Documentos = () => {
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { snackbar, dismiss, showSuccess, showError, showWarning } = useAppSnackbar()
  const [showSelectionDialog, setShowSelectionDialog] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const {
    isUploading,
    selectDocument,
    selectImageFromCamera,
    selectImageFromGallery,
    formatFileSize,
    getFileIcon,
  } = useDocumentUpload()

  const { documents, addDocument, removeDocument } = useMediaStore()

  const saveDocumentLocally = async (doc: ReturnType<typeof selectDocument> extends Promise<infer R> ? R extends { document?: infer D } ? D : never : never) => {
    if (!doc) return
    try {
      await addDocument(
        {
          filename: doc.fileName,
          localUri: doc.uri || '',
          mimeType: doc.fileType,
          size: doc.size,
          remoteUrl: doc.publicUrl ?? null,
        },
        user!.id,
      )
    } catch (err) {
      console.error('[documentos] Error saving document to WatermelonDB:', err)
    }
  }

  const handleSelectDocument = async () => {
    setShowSelectionDialog(false)
    const result = await selectDocument()
    if (result.success && result.document) {
      await saveDocumentLocally(result.document)
      showSuccess(
        result.document.isUploaded === false
          ? 'Documento salvo localmente. Será enviado quando houver conexão.'
          : 'Documento enviado com sucesso!',
      )
    } else if (!result.success) {
      showError(result.error || 'Erro ao selecionar documento')
    }
  }

  const handleSelectFromCamera = async () => {
    setShowSelectionDialog(false)
    const result = await selectImageFromCamera()
    if (result.success && result.document) {
      await saveDocumentLocally(result.document)
      showSuccess(
        result.document.isUploaded === false
          ? 'Foto salva localmente. Será enviada quando houver conexão.'
          : 'Foto enviada com sucesso!',
      )
    } else if (!result.success) {
      showError(result.error || 'Erro ao capturar foto')
    }
  }

  const handleSelectFromGallery = async () => {
    setShowSelectionDialog(false)
    const result = await selectImageFromGallery()
    if (result.success && result.document) {
      await saveDocumentLocally(result.document)
      showSuccess(
        result.document.isUploaded === false
          ? 'Imagem salva localmente. Será enviada quando houver conexão.'
          : 'Imagem enviada com sucesso!',
      )
    } else if (!result.success) {
      showError(result.error || 'Erro ao selecionar imagem')
    }
  }

  const handleDeleteDocument = (document: Document) => {
    Alert.alert(
      'Remover Documento',
      `Tem certeza que deseja remover "${document.filename}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDocument(document.id)
              showSuccess('Documento removido')
            } catch {
              showError('Erro ao remover documento')
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

  const isImageFile = (mimeType?: string) => {
    return mimeType?.startsWith('image/')
  }

  const getStatusChip = (document: Document) => {
    if (document.syncStatus === 'synced' || document.remoteUrl) {
      return (
        <Chip
          icon="cloud-check-outline"
          compact
          style={{ backgroundColor: '#4CAF50' + '20' }}
          textStyle={{ color: '#4CAF50' }}
        >
          Enviado
        </Chip>
      )
    } else if (document.syncStatus === 'conflict') {
      return (
        <Chip
          icon="cloud-off-outline"
          compact
          style={{ backgroundColor: colors.error + '20' }}
          textStyle={{ color: colors.error }}
        >
          Erro no envio
        </Chip>
      )
    } else if (document.syncStatus === 'pending') {
      return (
        <Chip
          icon="cloud-sync-outline"
          compact
          style={{ backgroundColor: colors.primary + '20' }}
          textStyle={{ color: colors.primary }}
        >
          Aguardando envio
        </Chip>
      )
    }
    return null
  }

  const handlePreviewDocument = (document: Document) => {
    if (document.remoteUrl) {
      Alert.alert(
        'Abrir Documento',
        'O documento será aberto no navegador. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir',
            onPress: () => Linking.openURL(document.remoteUrl as string),
          },
        ],
      )
    } else {
      showWarning('URL do documento não disponível')
    }
  }

  return (
    <>
      <ScreenContainer>
        <Text
          variant="headlineMedium"
          style={[documentosStyles.title, { color: colors.textPrimary }]}
        >
          {Locales.t('documentos.titulo')}
        </Text>

        <Text
          variant="bodyMedium"
          style={[documentosStyles.subtitle, { color: colors.textSecondary }]}
        >
          Mantenha seus documentos importantes sempre à mão
        </Text>

        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={[
                documentosStyles.documentCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline + '30',
                },
              ]}
              onPress={() => handlePreviewDocument(item)}
            >
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  {/* Icon */}
                  <View
                    style={[
                      documentosStyles.iconContainer,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    {isImageFile(item.mimeType) ? (
                      <View style={documentosStyles.thumbnail}>
                        <Ionicons
                          name="image"
                          size={28}
                          color={colors.onPrimary}
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name={getFileIcon(item.mimeType) as any}
                        size={28}
                        color={colors.onPrimary}
                      />
                    )}
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={[
                        documentosStyles.documentTitle,
                        { color: colors.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.filename}
                    </Text>
                    <Text
                      style={[
                        documentosStyles.documentDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.createdAt.toLocaleDateString('pt-BR')}
                      {item.size ? ` • ${formatFileSize(item.size)}` : ''}
                    </Text>

                    {/* Status Chip */}
                    <View style={{ marginTop: 8 }}>{getStatusChip(item)}</View>
                  </View>

                  {/* Delete Button */}
                  <View style={{ paddingTop: 4 }}>
                    <IconButton
                      icon="delete"
                      size={22}
                      iconColor={colors.error}
                      onPress={() => handleDeleteDocument(item)}
                      style={{ margin: 0 }}
                    />
                  </View>
                </View>
              </View>

              {/* File Type Chip */}
              <View style={documentosStyles.chipContainer}>
                {item.mimeType && (
                  <Chip
                    compact
                    mode="outlined"
                    style={[
                      documentosStyles.chip,
                      { borderColor: colors.primary },
                    ]}
                    textStyle={{ color: colors.primary, fontSize: 12 }}
                  >
                    {item.mimeType.split('/')[1]?.toUpperCase() || 'ARQUIVO'}
                  </Chip>
                )}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={documentosStyles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colors.iconSecondary}
              />
              <Text
                style={[
                  documentosStyles.emptyText,
                  { color: colors.textPrimary },
                ]}
              >
                {Locales.t('documentos.nenhum')}
              </Text>
              <Text
                style={[
                  documentosStyles.emptySubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Adicione documentos importantes como RG, CPF, comprovantes, etc.
              </Text>
              <Text
                style={[
                  documentosStyles.emptySubtext,
                  {
                    color: colors.textSecondary,
                    marginTop: 16,
                    fontStyle: 'italic',
                  },
                ]}
              >
                Toque no botão + para começar
              </Text>
            </View>
          }
          style={documentosStyles.list}
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

      <Portal>
        <KeyboardAvoidingDialog
          visible={showSelectionDialog}
          onDismiss={() => {
            if (!isUploading) {
              setShowSelectionDialog(false)
            }
          }}
          style={[documentosStyles.dialog, { backgroundColor: colors.surface }]}
          dismissable={!isUploading}
        >
          <KeyboardAvoidingDialog.Title
            style={[
              documentosStyles.dialogTitle,
              { color: colors.textPrimary },
            ]}
          >
            Selecionar Documento
          </KeyboardAvoidingDialog.Title>
          <KeyboardAvoidingDialog.Content
            style={documentosStyles.dialogContent}
          >
            <View style={documentosStyles.selectionDialog}>
              <Button
                mode="contained"
                onPress={handleSelectFromCamera}
                style={documentosStyles.selectionButton}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                icon="camera"
              >
                Tirar Foto
              </Button>
              <Button
                mode="contained"
                onPress={handleSelectFromGallery}
                style={documentosStyles.selectionButton}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                icon="image"
              >
                Galeria
              </Button>
              <Button
                mode="contained"
                onPress={handleSelectDocument}
                style={documentosStyles.selectionButton}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                icon="file-document"
              >
                Arquivo
              </Button>
            </View>
          </KeyboardAvoidingDialog.Content>
          <KeyboardAvoidingDialog.Actions
            style={documentosStyles.dialogActions}
          >
            <Button
              onPress={() => {
                if (!isUploading) {
                  setShowSelectionDialog(false)
                }
              }}
              textColor={colors.textSecondary}
              disabled={isUploading}
            >
              Cancelar
            </Button>
          </KeyboardAvoidingDialog.Actions>
        </KeyboardAvoidingDialog>
      </Portal>

      <FAB
        icon="plus"
        style={[
          documentosStyles.fab,
          {
            backgroundColor: colors.primary,
            bottom: 100 + Math.max(insets.bottom, 8),
          },
        ]}
        onPress={() => setShowSelectionDialog(true)}
        loading={isUploading}
        disabled={isUploading}
      />
    </>
  )
}

const documentosStyles = StyleSheet.create({
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
    marginBottom: 32,
    paddingHorizontal: width < 400 ? 16 : 24,
    lineHeight: 22,
  },
  list: {
    flex: 1,
    paddingHorizontal: 8,
  },
  documentCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  iconContainer: {
    width: width < 400 ? 52 : 56,
    height: width < 400 ? 52 : 56,
    borderRadius: width < 400 ? 26 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
  },
  documentTitle: {
    fontWeight: '600',
    fontSize: width < 400 ? 16 : 17,
    lineHeight: width < 400 ? 22 : 24,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: width < 400 ? 14 : 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  chipContainer: {
    paddingHorizontal: width < 400 ? 16 : 20,
    paddingBottom: 16,
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    alignSelf: 'flex-start',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: width < 400 ? 18 : 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 26,
  },
  emptySubtext: {
    fontSize: width < 400 ? 15 : 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 80,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dialog: {
    borderRadius: 20,
    marginHorizontal: 24,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  dialogContent: {
    padding: 24,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  fileName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  fileSize: {
    fontSize: 13,
    marginLeft: 12,
  },
  input: {
    marginBottom: 20,
  },
  dialogActions: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: width < 400 ? 26 : 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  uploadProgress: {
    marginTop: 12,
  },
  uploadText: {
    marginTop: 8,
  },
  addButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 4,
  },
  snackbar: {
    marginBottom: 10,
  },
  uploadProgressContainer: {
    marginBottom: 20,
  },
  uploadProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  uploadProgressText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  selectionDialog: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
  },
  selectionButton: {
    marginVertical: 6,
    paddingVertical: 8,
  },
})

export default Documentos
