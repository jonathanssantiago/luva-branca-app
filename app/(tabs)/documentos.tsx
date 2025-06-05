import React, { useState } from 'react'
import {
  Surface,
  Text,
  Button,
  List,
  Snackbar,
  FAB,
  Card,
  Chip,
  IconButton,
  useTheme,
  Dialog,
  Portal,
  TextInput,
  Menu,
  HelperText,
  ProgressBar,
} from 'react-native-paper'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { FlatList, View, StyleSheet, Dimensions, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Locales } from '@/lib'
import { ScreenContainer, KeyboardAvoidingDialog } from '@/src/components/ui'
// Adicionando hooks de tema
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
// import { useSupabaseDocumentos } from '@/src/hooks/useSupabaseDocumentos' // Exemplo de hook para integração

const { width } = Dimensions.get('window')

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const SUPPORTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

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

interface Documento {
  id: string
  name: string
  uri: string
  size?: number
  mimeType?: string
  dateAdded: string
  description?: string
  category?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error'
}

const Documentos = () => {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const [docs, setDocs] = useState<Documento[]>([])
  const [snackbar, setSnackbar] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [menuVisible, setMenuVisible] = useState(false)
  const [errors, setErrors] = useState<{ description?: string; category?: string; file?: string }>({})
  const [uploadProgress, setUploadProgress] = useState(0)

  // Exemplo de integração Supabase (substitua pelo hook real)
  // const { docs, addDocumento, loading, error } = useSupabaseDocumentos()

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return 'file-document-outline'
    if (mimeType.includes('image')) return 'image'
    if (mimeType.includes('pdf')) return 'file-pdf-box'
    if (mimeType.includes('word')) return 'file-word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return 'file-excel'
    return 'file-document-outline'
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  const validateFile = (file: any) => {
    const newErrors: { file?: string } = {}

    if (file.size > MAX_FILE_SIZE) {
      newErrors.file = 'O arquivo é muito grande. Tamanho máximo: 10MB'
    }

    if (!SUPPORTED_TYPES.includes(file.mimeType)) {
      newErrors.file = 'Tipo de arquivo não suportado'
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = async () => {
    setLoading(true)
    setErrors({})
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0]
        if (validateFile(file)) {
          setSelectedFile(file)
          setDialogVisible(true)
        } else {
          setSnackbar('Arquivo inválido')
        }
      }
    } catch (error) {
      setSnackbar('Erro ao selecionar arquivo')
    }
    setLoading(false)
  }

  const validateForm = () => {
    const newErrors: { description?: string; category?: string } = {}
    
    if (description && description.length > 200) {
      newErrors.description = 'A descrição deve ter no máximo 200 caracteres'
    }
    
    if (category && category.length > 50) {
      newErrors.category = 'A categoria deve ter no máximo 50 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const simulateUpload = async (file: any) => {
    return new Promise<void>((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          resolve()
        }
      }, 200)
    })
  }

  const handleSaveDocument = async () => {
    if (!selectedFile) return
    if (!validateForm()) return

    setLoading(true)
    const tempDoc: Documento = {
      id: Date.now().toString() + Math.random().toString(),
      name: selectedFile.name,
      uri: selectedFile.uri,
      size: selectedFile.size,
      mimeType: selectedFile.mimeType,
      dateAdded: new Date().toLocaleDateString('pt-BR'),
      description: description.trim(),
      category: category.trim(),
      uploadStatus: 'uploading',
      uploadProgress: 0,
    }

    setDocs((prev) => [...prev, tempDoc])

    try {
      // Simulate file upload
      await simulateUpload(selectedFile)

      // TODO: Implement actual file upload to backend
      // const formData = new FormData()
      // formData.append('file', {
      //   uri: selectedFile.uri,
      //   name: selectedFile.name,
      //   type: selectedFile.mimeType,
      // })
      // formData.append('description', description.trim())
      // formData.append('category', category.trim())
      // const response = await fetch('YOUR_UPLOAD_ENDPOINT', {
      //   method: 'POST',
      //   body: formData,
      // })

      setDocs((prev) =>
        prev.map((doc) =>
          doc.id === tempDoc.id
            ? { ...doc, uploadStatus: 'completed', uploadProgress: 100 }
            : doc
        )
      )

      setSnackbar(Locales.t('documentos.adicionado'))
      setDialogVisible(false)
      setSelectedFile(null)
      setDescription('')
      setCategory('')
      setErrors({})
      setUploadProgress(0)
    } catch (error) {
      setDocs((prev) =>
        prev.map((doc) =>
          doc.id === tempDoc.id
            ? { ...doc, uploadStatus: 'error' }
            : doc
        )
      )
      setSnackbar('Erro ao fazer upload do arquivo')
    }
    setLoading(false)
  }

  const removeDocument = (id: string) => {
    setDocs(docs.filter((doc) => doc.id !== id))
    setSnackbar('Documento removido')
  }

  const isImageFile = (mimeType?: string) => {
    return mimeType?.startsWith('image/')
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

        <Text variant="bodyMedium" style={[documentosStyles.subtitle, { color: colors.textSecondary }]}>
          Mantenha seus documentos importantes sempre à mão
        </Text>

        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={[documentosStyles.documentCard, { 
              backgroundColor: colors.surface,
              borderColor: colors.outline + '30'
            }]}>
              <List.Item
                title={item.name}
                description={
                  <>
                    <Text style={[documentosStyles.documentDescription, { color: colors.textSecondary }]}>
                      {item.dateAdded}{item.size ? ` • ${formatFileSize(item.size)}` : ''}
                    </Text>
                    {item.description && (
                      <Text style={[documentosStyles.documentDescription, { color: colors.textSecondary, marginTop: 4 }]}>
                        {item.description}
                      </Text>
                    )}
                    {item.uploadStatus === 'uploading' && (
                      <View style={documentosStyles.uploadProgress}>
                        <ProgressBar
                          progress={item.uploadProgress ? item.uploadProgress / 100 : 0}
                          color={colors.primary}
                        />
                        <Text style={[documentosStyles.uploadText, { color: colors.textSecondary }]}>
                          Enviando... {item.uploadProgress}%
                        </Text>
                      </View>
                    )}
                    {item.uploadStatus === 'error' && (
                      <Text style={[documentosStyles.documentDescription, { color: colors.error }]}>
                        Erro no upload
                      </Text>
                    )}
                  </>
                }
                left={(props) => (
                  <View style={[documentosStyles.iconContainer, { backgroundColor: colors.primary }]}>
                    {isImageFile(item.mimeType) ? (
                      <Image
                        source={{ uri: item.uri }}
                        style={documentosStyles.thumbnail}
                      />
                    ) : (
                      <Ionicons
                        name={getFileIcon(item.mimeType) as any}
                        size={24}
                        color={colors.onPrimary}
                      />
                    )}
                  </View>
                )}
                right={(props) => (
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => removeDocument(item.id)}
                  />
                )}
                titleStyle={[documentosStyles.documentTitle, { color: colors.textPrimary }]}
                descriptionStyle={documentosStyles.documentDescription}
                titleNumberOfLines={2}
              />
              <View style={documentosStyles.chipContainer}>
                {item.category && (
                  <Chip 
                    compact 
                    mode="outlined" 
                    style={[documentosStyles.chip, { borderColor: colors.primary, marginRight: 8 }]}
                    textStyle={{ color: colors.primary }}
                  >
                    {item.category}
                  </Chip>
                )}
                {item.mimeType && (
                  <Chip 
                    compact 
                    mode="outlined" 
                    style={[documentosStyles.chip, { borderColor: colors.primary }]}
                    textStyle={{ color: colors.primary }}
                  >
                    {item.mimeType.split('/')[1]?.toUpperCase() || 'ARQUIVO'}
                  </Chip>
                )}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={documentosStyles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.iconSecondary} />
              <Text style={[documentosStyles.emptyText, { color: colors.textPrimary }]}>
                {Locales.t('documentos.nenhum')}
              </Text>
              <Text style={[documentosStyles.emptySubtext, { color: colors.textSecondary }]}>
                Adicione documentos importantes como RG, CPF, comprovantes, etc.
              </Text>
              <Button
                mode="contained"
                onPress={handleAdd}
                style={documentosStyles.addButton}
                icon="plus"
                loading={loading}
                disabled={loading}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
              >
                Adicionar Documento
              </Button>
            </View>
          }
          style={documentosStyles.list}
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
          style={documentosStyles.snackbar}
        >
          {snackbar}
        </Snackbar>
      </ScreenContainer>

      <Portal>
        <KeyboardAvoidingDialog
          visible={dialogVisible}
          onDismiss={() => {
            if (!loading) {
              setDialogVisible(false)
              setSelectedFile(null)
              setDescription('')
              setCategory('')
              setErrors({})
              setUploadProgress(0)
            }
          }}
          style={[documentosStyles.dialog, { backgroundColor: colors.surface }]}
          dismissable={!loading}
        >
          <KeyboardAvoidingDialog.Title style={[documentosStyles.dialogTitle, { color: colors.textPrimary }]}>
            {loading ? 'Enviando Documento...' : 'Adicionar Documento'}
          </KeyboardAvoidingDialog.Title>
          <KeyboardAvoidingDialog.Content style={documentosStyles.dialogContent}>
            {loading && (
              <View style={documentosStyles.uploadProgressContainer}>
                <ProgressBar
                  progress={uploadProgress / 100}
                  color={colors.primary}
                  style={documentosStyles.uploadProgressBar}
                />
                <Text style={[documentosStyles.uploadProgressText, { color: colors.textSecondary }]}>
                  Enviando... {uploadProgress}%
                </Text>
              </View>
            )}
            {selectedFile && !loading && (
              <View style={[documentosStyles.fileInfo, { backgroundColor: colors.primary + '10' }]}>
                {isImageFile(selectedFile.mimeType) ? (
                  <Image
                    source={{ uri: selectedFile.uri }}
                    style={documentosStyles.previewImage}
                  />
                ) : (
                  <Ionicons
                    name={getFileIcon(selectedFile.mimeType) as any}
                    size={24}
                    color={colors.primary}
                  />
                )}
                <Text style={[documentosStyles.fileName, { color: colors.textPrimary }]}>
                  {selectedFile.name}
                </Text>
                {selectedFile.size && (
                  <Text style={[documentosStyles.fileSize, { color: colors.textSecondary }]}>
                    {formatFileSize(selectedFile.size)}
                  </Text>
                )}
              </View>
            )}
            {errors.file && (
              <HelperText type="error" visible={!!errors.file}>
                {errors.file}
              </HelperText>
            )}
            <TextInput
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              style={[documentosStyles.input, { backgroundColor: colors.inputBackground }]}
              mode="outlined"
              multiline
              numberOfLines={3}
              error={!!errors.description}
              disabled={loading}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.placeholder}
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
            />
            {errors.description && (
              <HelperText type="error" visible={!!errors.description}>
                {errors.description}
              </HelperText>
            )}
            <Menu
              visible={menuVisible && !loading}
              onDismiss={() => setMenuVisible(false)}
              contentStyle={{ backgroundColor: colors.surface }}
              anchor={
                <TextInput
                  label="Categoria (opcional)"
                  value={category}
                  onPressIn={() => !loading && setMenuVisible(true)}
                  style={[documentosStyles.input, { backgroundColor: colors.inputBackground }]}
                  mode="outlined"
                  placeholder="Selecione uma categoria"
                  right={<TextInput.Icon icon="chevron-down" />}
                  error={!!errors.category}
                  disabled={loading}
                  textColor={colors.textPrimary}
                  placeholderTextColor={colors.placeholder}
                  outlineColor={colors.inputBorder}
                  activeOutlineColor={colors.primary}
                />
              }
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <Menu.Item
                  key={cat}
                  onPress={() => {
                    setCategory(cat)
                    setMenuVisible(false)
                  }}
                  title={cat}
                  titleStyle={{ color: colors.textPrimary }}
                />
              ))}
            </Menu>
            {errors.category && (
              <HelperText type="error" visible={!!errors.category}>
                {errors.category}
              </HelperText>
            )}
          </KeyboardAvoidingDialog.Content>
          <KeyboardAvoidingDialog.Actions style={documentosStyles.dialogActions}>
            <Button
              onPress={() => {
                if (!loading) {
                  setDialogVisible(false)
                  setSelectedFile(null)
                  setDescription('')
                  setCategory('')
                  setErrors({})
                  setUploadProgress(0)
                }
              }}
              textColor={colors.textSecondary}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSaveDocument}
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Salvar'}
            </Button>
          </KeyboardAvoidingDialog.Actions>
        </KeyboardAvoidingDialog>
      </Portal>

      {docs.length > 0 && (
        <FAB
          icon="plus"
          style={[documentosStyles.fab, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          loading={loading}
          disabled={loading}
        />
      )}
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
    marginBottom: 24,
    paddingHorizontal: width < 400 ? 8 : 16,
    lineHeight: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 4,
  },
  documentCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  iconContainer: {
    width: width < 400 ? 44 : 48,
    height: width < 400 ? 44 : 48,
    borderRadius: width < 400 ? 22 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    elevation: 2,
  },
  documentTitle: {
    fontWeight: '600',
    fontSize: width < 400 ? 15 : 16,
    lineHeight: width < 400 ? 20 : 22,
  },
  documentDescription: {
    fontSize: width < 400 ? 13 : 14,
    lineHeight: 18,
  },
  chipContainer: {
    paddingHorizontal: width < 400 ? 12 : 16,
    paddingBottom: 12,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: width < 400 ? 13 : 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 6,
  },
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  dialogContent: {
    padding: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  fileSize: {
    fontSize: 12,
    marginLeft: 8,
  },
  input: {
    marginBottom: 16,
  },
  dialogActions: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: width < 400 ? 22 : 24,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
  },
  uploadProgress: {
    marginTop: 8,
  },
  uploadText: {
    marginTop: 4,
  },
  addButton: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  snackbar: {
  },
  uploadProgressContainer: {
    marginBottom: 16,
  },
  uploadProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  uploadProgressText: {
    marginTop: 8,
    textAlign: 'center',
  },
})

export default Documentos
