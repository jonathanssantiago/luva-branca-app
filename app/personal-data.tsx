import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, Animated } from 'react-native'
import {
  Card,
  Text,
  TextInput,
  Button,
  Avatar,
  Divider,
  ActivityIndicator,
  Menu,
  TouchableRipple,
  Dialog,
  Portal,
  FAB,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CustomHeader, ScreenContainer } from '@/src/components/ui'
import { useProfile } from '@/src/hooks/useProfile'
import { useAuth } from '@/src/context/SupabaseAuthContext'
import { useImageUpload } from '@/src/hooks/useImageUpload'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

interface UserFormData {
  full_name: string
  email: string
  phone: string
  birth_date: string
  cpf: string
  gender: string
}

const PersonalData = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { profile, loading, updateProfile, fetchProfile } = useProfile()
  const { uploading, pickImage, takePhoto, uploadAvatar, deleteImage } =
    useImageUpload()
  const colors = useThemeExtendedColors()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [genderMenuVisible, setGenderMenuVisible] = useState(false)
  const [photoDialogVisible, setPhotoDialogVisible] = useState(false)
  const [editAnimation] = useState(new Animated.Value(0))

  // Opções de gênero
  const genderOptions = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Feminino', value: 'feminino' },
    { label: 'Outro', value: 'outro' },
    { label: 'Prefiro não informar', value: 'nao_informar' },
  ]

  // Dados do formulário
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    cpf: '',
    gender: '',
  })

  // Animação para o modo de edição
  useEffect(() => {
    Animated.timing(editAnimation, {
      toValue: isEditing ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [isEditing, editAnimation])

  // Atualizar dados do formulário quando o perfil for carregado
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        cpf: profile.cpf || '',
        gender: profile.gender || '',
      })
    } else if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || '',
      }))
    }
  }, [profile, user])

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado')
      return
    }

    // Validação apenas do email (se preenchido)
    const errors = []

    if (formData.email && !formData.email.includes('@')) {
      errors.push('Email deve ter um formato válido')
    }

    if (errors.length > 0) {
      Alert.alert('Atenção', errors.join('\n'))
      return
    }

    setIsSaving(true)
    try {
      // Salva apenas o email, mantendo os outros dados inalterados
      const { error } = await updateProfile({
        email: formData.email,
      })

      if (error) {
        Alert.alert(
          'Erro',
          'Não foi possível salvar os dados. Tente novamente.',
        )
        console.error('Erro ao salvar:', error)
        return
      }

      setIsEditing(false)
      Alert.alert('Sucesso', 'Email atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      Alert.alert('Erro', 'Ocorreu um erro ao salvar os dados')
    } finally {
      setIsSaving(false)
    }
  }

  // Função de validação de telefone
  const isValidPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    return numbers.length === 10 || numbers.length === 11
  }

  const handleCancel = () => {
    // Restaurar dados originais
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        cpf: profile.cpf || '',
        gender: profile.gender || '',
      })
    }
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const formatCPF = (cpf: string) => {
    if (!cpf) return ''
    const numbers = cpf.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleCPFChange = (text: string) => {
    const numbers = text.replace(/\D/g, '')
    if (numbers.length <= 11) {
      setFormData((prev) => ({ ...prev, cpf: numbers }))
    }
  }

  const handlePhoneChange = (text: string) => {
    const numbers = text.replace(/\D/g, '')
    if (numbers.length <= 11) {
      let formatted = numbers
      if (numbers.length >= 2) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      }
      if (numbers.length >= 7) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
      }
      setFormData((prev) => ({ ...prev, phone: formatted }))
    }
  }

  const handleDateChange = (text: string) => {
    // Formatação automática de data
    const numbers = text.replace(/\D/g, '')
    let formatted = numbers

    if (numbers.length >= 2) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    }
    if (numbers.length >= 4) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }

    if (numbers.length <= 8) {
      setFormData((prev) => ({ ...prev, birth_date: formatted }))
    }
  }

  const handleGenderSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }))
  }

  // Funções para upload de foto
  const handlePhotoSelection = () => {
    setPhotoDialogVisible(true)
  }

  const handleSelectFromGallery = async () => {
    setPhotoDialogVisible(false)
    try {
      const result = await pickImage()
      if (result && !result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri
        await handlePhotoUpload(imageUri)
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error)
      Alert.alert('Erro', 'Não foi possível selecionar a imagem')
    }
  }

  const handleTakePhoto = async () => {
    setPhotoDialogVisible(false)
    try {
      const result = await takePhoto()
      if (result && !result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri
        await handlePhotoUpload(imageUri)
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error)
      Alert.alert('Erro', 'Não foi possível tirar a foto')
    }
  }

  const handlePhotoUpload = async (imageUri: string) => {
    try {
      const uploadResult = await uploadAvatar(imageUri)

      if (uploadResult.error) {
        Alert.alert('Erro', uploadResult.error)
        return
      }

      if (uploadResult.url && user) {
        // Atualizar o perfil com a nova URL do avatar
        const { error } = await updateProfile({
          avatar_url: uploadResult.url,
        })

        if (error) {
          Alert.alert('Erro', 'Não foi possível salvar a foto no perfil')
          console.error('Erro ao salvar avatar:', error)
          return
        }

        Alert.alert('Sucesso', 'Foto atualizada com sucesso!')
      }
    } catch (error) {
      console.error('Erro no upload da foto:', error)
      Alert.alert('Erro', 'Ocorreu um erro ao fazer upload da foto')
    }
  }

  const handleRemovePhoto = async () => {
    if (!profile?.avatar_url || !user) return

    Alert.alert(
      'Remover Foto',
      'Tem certeza que deseja remover sua foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              // Atualizar o perfil removendo a URL do avatar
              const { error } = await updateProfile({
                avatar_url: null,
              })

              if (error) {
                Alert.alert('Erro', 'Não foi possível remover a foto do perfil')
                console.error('Erro ao remover avatar:', error)
                return
              }

              Alert.alert('Sucesso', 'Foto removida com sucesso!')
            } catch (error) {
              console.error('Erro ao remover foto:', error)
              Alert.alert('Erro', 'Ocorreu um erro ao remover a foto')
            }
          },
        },
      ],
    )
  }

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    multiline?: boolean,
    placeholder?: string,
    required?: boolean,
    editable: boolean = false,
  ) => (
    <View style={styles.fieldContainer}>
      <View
        style={[
          styles.fieldHeader,
          editable && isEditing && dynamicStyles.editableField,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            editable && isEditing && dynamicStyles.editableIconContainer,
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={
              editable && isEditing ? colors.primary : colors.onSurfaceVariant
            }
          />
        </View>
        <Text
          style={[
            dynamicStyles.fieldLabel,
            editable && isEditing && dynamicStyles.editableLabel,
          ]}
        >
          {label}
          {required && <Text style={dynamicStyles.requiredIndicator}> *</Text>}
        </Text>
        {editable && isEditing && (
          <View style={dynamicStyles.editableBadge}>
            <MaterialCommunityIcons
              name="pencil"
              size={10}
              color={colors.onPrimary}
            />
          </View>
        )}
        {!editable && (
          <MaterialCommunityIcons
            name="lock"
            size={14}
            color={colors.onSurfaceDisabled}
          />
        )}
      </View>

      {editable && isEditing ? (
        <TextInput
          mode="outlined"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          style={dynamicStyles.textInput}
          contentStyle={styles.textInputContent}
          theme={{
            colors: {
              primary: colors.primary,
              outline: colors.outline,
              background: colors.surface,
            },
          }}
        />
      ) : (
        <View style={styles.fieldValueContainer}>
          <Text
            style={[
              dynamicStyles.fieldValue,
              !value && dynamicStyles.fieldValueEmpty,
            ]}
          >
            {value || 'Não informado'}
          </Text>
        </View>
      )}
    </View>
  )

  const renderGenderField = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="gender-male-female"
            size={20}
            color={colors.onSurfaceVariant}
          />
        </View>
        <Text style={dynamicStyles.fieldLabel}>Gênero</Text>
        <MaterialCommunityIcons
          name="lock"
          size={14}
          color={colors.onSurfaceDisabled}
        />
      </View>
      <View style={styles.genderValueContainer}>
        <Text style={dynamicStyles.fieldValue}>
          {genderOptions.find((opt) => opt.value === formData.gender)?.label ||
            'Não informado'}
        </Text>
        <View style={dynamicStyles.genderBadge}>
          <MaterialCommunityIcons
            name={
              formData.gender === 'masculino'
                ? 'gender-male'
                : formData.gender === 'feminino'
                  ? 'gender-female'
                  : 'gender-non-binary'
            }
            size={16}
            color={colors.primary}
          />
        </View>
      </View>
    </View>
  )

  // Create dynamic styles using theme colors
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    photoCard: {
      marginBottom: 12,
      elevation: 2,
      backgroundColor: colors.surface,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    avatar: {
      backgroundColor: colors.primaryContainer,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cameraIconBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.onPrimary,
    },
    photoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    photoSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    sectionCard: {
      marginBottom: 12,
      elevation: 2,
      backgroundColor: colors.surface,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginLeft: 8,
    },
    editInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 6,
    },
    editInfo: {
      fontSize: 14,
      color: colors.primary,
      marginLeft: 8,
      fontStyle: 'italic',
    },
    divider: {
      marginBottom: 12,
      backgroundColor: colors.outline,
    },
    editableField: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    editableIconContainer: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 14,
      padding: 4,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      marginLeft: 8,
      flex: 1,
    },
    editableLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
    editableBadge: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    requiredIndicator: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    fieldValue: {
      fontSize: 16,
      color: colors.onSurface,
      lineHeight: 22,
      flex: 1,
    },
    fieldValueEmpty: {
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    textInput: {
      backgroundColor: colors.surface,
    },
    genderSelector: {
      width: '100%',
      justifyContent: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderColor: colors.outline,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    genderSelectorText: {
      fontSize: 16,
      color: colors.onSurface,
    },
    genderBadge: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonsContainer: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    cancelButton: {
      borderColor: colors.onSurfaceVariant,
      borderWidth: 1,
    },
    saveButton: {
      elevation: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    dialogTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
    },
    dialogContent: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      marginBottom: 16,
      lineHeight: 22,
    },
  })

  return (
    <View style={dynamicStyles.container}>
      <CustomHeader
        title="Dados Pessoais"
        backgroundColor={colors.primary}
        textColor={colors.onPrimary}
        iconColor={colors.onPrimary}
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
      />

      <ScreenContainer
        scrollable
        contentStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        keyboardAvoiding={true}
      >
        {loading && !profile ? (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={dynamicStyles.loadingText}>
              Carregando seus dados...
            </Text>
          </View>
        ) : (
          <>
            {/* Profile Photo Section */}
            <Card style={dynamicStyles.photoCard}>
              <Card.Content style={styles.photoContent}>
                <View style={styles.avatarSection}>
                  <View style={styles.avatarContainer}>
                    {profile?.avatar_url ? (
                      <Avatar.Image
                        size={100}
                        source={{ uri: profile.avatar_url }}
                        style={dynamicStyles.avatar}
                      />
                    ) : (
                      <Avatar.Icon
                        size={100}
                        icon="account"
                        style={dynamicStyles.avatar}
                        color={colors.primary}
                      />
                    )}
                    {uploading && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      </View>
                    )}
                    <View style={dynamicStyles.cameraIconBadge}>
                      <MaterialCommunityIcons
                        name="camera"
                        size={16}
                        color={colors.onPrimary}
                      />
                    </View>
                  </View>
                  <View style={styles.photoInfo}>
                    <Text style={dynamicStyles.photoTitle}>Foto do Perfil</Text>
                    <Text style={dynamicStyles.photoSubtitle}>
                      Toque para alterar sua foto
                    </Text>
                  </View>
                </View>
                <Button
                  mode="contained"
                  onPress={handlePhotoSelection}
                  style={styles.photoButton}
                  buttonColor={colors.primaryContainer}
                  textColor={colors.primary}
                  disabled={uploading}
                  loading={uploading}
                  icon="camera-plus"
                  contentStyle={styles.photoButtonContent}
                >
                  {uploading ? 'Enviando...' : 'Alterar Foto'}
                </Button>
              </Card.Content>
            </Card>

            {/* Personal Information */}
            <Card style={dynamicStyles.sectionCard}>
              <Card.Content style={styles.sectionContent}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MaterialCommunityIcons
                      name="account-details"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={dynamicStyles.sectionTitle}>
                      Informações Pessoais
                    </Text>
                  </View>
                  {!isEditing && (
                    <Button
                      mode="text"
                      onPress={() => setIsEditing(true)}
                      textColor={colors.primary}
                      icon="pencil"
                      compact
                      style={styles.editButton}
                    >
                      Editar
                    </Button>
                  )}
                </View>

                {isEditing && (
                  <View style={dynamicStyles.editInfoContainer}>
                    <MaterialCommunityIcons
                      name="information"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={dynamicStyles.editInfo}>
                      Apenas o email pode ser editado
                    </Text>
                  </View>
                )}

                <Divider style={dynamicStyles.divider} />

                {renderField(
                  'Nome Completo',
                  formData.full_name,
                  (text) =>
                    setFormData((prev) => ({ ...prev, full_name: text })),
                  'account',
                  false,
                  'Digite seu nome completo',
                  true,
                  false, // não editável
                )}

                {renderField(
                  'Email',
                  formData.email,
                  (text) => setFormData((prev) => ({ ...prev, email: text })),
                  'email',
                  false,
                  'Digite seu email',
                  true,
                  true, // editável
                )}

                {renderField(
                  'Telefone',
                  formData.phone,
                  handlePhoneChange,
                  'phone',
                  false,
                  '(11) 99999-9999',
                  false,
                  false, // não editável
                )}

                {renderField(
                  'Data de Nascimento',
                  formData.birth_date,
                  handleDateChange,
                  'calendar',
                  false,
                  'DD/MM/AAAA',
                  false,
                  false, // não editável
                )}

                {renderField(
                  'CPF',
                  formatCPF(formData.cpf),
                  handleCPFChange,
                  'card-account-details',
                  false,
                  '000.000.000-00',
                  false,
                  false, // não editável
                )}

                {renderGenderField()}

                {isEditing && (
                  <View style={dynamicStyles.actionButtonsContainer}>
                    <View style={styles.actionButtons}>
                      <Button
                        mode="outlined"
                        onPress={handleCancel}
                        style={[
                          styles.actionButton,
                          dynamicStyles.cancelButton,
                        ]}
                        textColor={colors.onSurfaceVariant}
                        contentStyle={styles.buttonContent}
                      >
                        Cancelar
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleSave}
                        style={[styles.actionButton, dynamicStyles.saveButton]}
                        buttonColor={colors.primary}
                        textColor={colors.onPrimary}
                        loading={isSaving}
                        disabled={isSaving}
                        contentStyle={styles.buttonContent}
                      >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Photo Selection Dialog */}
            <Portal>
              <Dialog
                visible={photoDialogVisible}
                onDismiss={() => setPhotoDialogVisible(false)}
                style={styles.photoDialog}
              >
                <Dialog.Title>
                  <View style={dynamicStyles.dialogTitle}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={24}
                      color={colors.primary}
                      style={styles.dialogIcon}
                    />
                    <Text>Alterar Foto do Perfil</Text>
                  </View>
                </Dialog.Title>
                <Dialog.Content>
                  <Text style={dynamicStyles.dialogContent}>
                    Escolha uma opção para alterar sua foto de perfil:
                  </Text>
                </Dialog.Content>
                <Dialog.Actions style={styles.dialogActions}>
                  <Button
                    onPress={handleSelectFromGallery}
                    textColor={colors.primary}
                    style={styles.dialogButton}
                    icon="image"
                  >
                    Galeria
                  </Button>
                  <Button
                    onPress={handleTakePhoto}
                    textColor={colors.primary}
                    style={styles.dialogButton}
                    icon="camera"
                  >
                    Câmera
                  </Button>
                  {profile?.avatar_url && (
                    <Button
                      onPress={handleRemovePhoto}
                      textColor={colors.error}
                      style={styles.dialogButton}
                      icon="delete"
                    >
                      Remover
                    </Button>
                  )}
                  <Button
                    onPress={() => setPhotoDialogVisible(false)}
                    textColor={colors.onSurfaceVariant}
                    style={styles.dialogButton}
                  >
                    Cancelar
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </>
        )}
      </ScreenContainer>
    </View>
  )
}

// Keep only static styles that don't depend on theme
const styles = StyleSheet.create({
  photoContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photoInfo: {
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  photoButton: {
    borderRadius: 25,
    elevation: 0,
    marginTop: 8,
  },
  photoButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: -8,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
  },
  textInputContent: {
    paddingHorizontal: 12,
  },
  genderSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  genderValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  photoDialog: {
    borderRadius: 16,
  },
  dialogIcon: {
    marginRight: 8,
  },
  dialogActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dialogButton: {
    marginHorizontal: 4,
  },
})

export default PersonalData
