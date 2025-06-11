/**
 * Formulário para criar/editar entradas do diário
 */

import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import {
  Text,
  TextInput,
  Switch,
  Button,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper'
import DateTimePicker from '@react-native-community/datetimepicker'
import { TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { useSafetyDiary } from '@/src/hooks/useSafetyDiary'
import {
  SafetyDiaryEntry,
  CreateDiaryEntryInput,
  UpdateDiaryEntryInput,
  DiaryEmotion,
} from '@/src/types/diary'
import { EmotionSelector } from './EmotionSelector'
import { TagSelector } from './TagSelector'
import { DiaryImagePicker } from './DiaryImagePicker'

interface DiaryFormProps {
  entry?: SafetyDiaryEntry | null
  onSubmit: (data: CreateDiaryEntryInput) => Promise<void>
  onUpdate?: (data: UpdateDiaryEntryInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  style?: any
}

export const DiaryForm: React.FC<DiaryFormProps> = ({
  entry,
  onSubmit,
  onUpdate,
  onCancel,
  isLoading = false,
  style,
}) => {
  const colors = useThemeExtendedColors()
  const { uploadDiaryImage } = useSafetyDiary()
  const isEditing = !!entry

  // Form state
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')
  const [location, setLocation] = useState(entry?.location || '')
  const [entryDate, setEntryDate] = useState(
    entry?.entry_date ? new Date(entry.entry_date) : new Date(),
  )
  const [emotion, setEmotion] = useState<DiaryEmotion | null>(
    entry?.emotion || null,
  )
  const [tags, setTags] = useState<string[]>(entry?.tags || [])
  const [images, setImages] = useState<string[]>(entry?.images || [])
  const [isPrivate, setIsPrivate] = useState(entry?.is_private ?? true)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório'
    } else if (title.length > 100) {
      newErrors.title = 'Título deve ter no máximo 100 caracteres'
    }

    if (!content.trim()) {
      newErrors.content = 'Conteúdo é obrigatório'
    } else if (content.length > 5000) {
      newErrors.content = 'Conteúdo deve ter no máximo 5000 caracteres'
    }

    if (location && location.length > 200) {
      newErrors.location = 'Local deve ter no máximo 200 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      // Upload das imagens novas (que são URIs locais)
      const uploadedImageUrls: string[] = []
      const uploadPromises: Promise<void>[] = []

      for (const imageUri of images) {
        // Se a imagem já é uma URL (começa com http), mantém como está
        if (imageUri.startsWith('http')) {
          uploadedImageUrls.push(imageUri)
        } else {
          // Se é uma URI local, faz o upload
          const uploadPromise = uploadDiaryImage(imageUri).then((result) => {
            if (result.url) {
              uploadedImageUrls.push(result.url)
            } else if (result.error) {
              console.error('Erro no upload da imagem:', result.error)
              throw new Error(result.error)
            }
          })
          uploadPromises.push(uploadPromise)
        }
      }

      // Aguardar todos os uploads
      await Promise.all(uploadPromises)

      if (isEditing && onUpdate) {
        const updateData: UpdateDiaryEntryInput = {
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || undefined,
          entry_date: entryDate.toISOString(),
          emotion: emotion || undefined,
          tags,
          images: uploadedImageUrls,
          is_private: isPrivate,
        }
        await onUpdate(updateData)
      } else {
        const createData: CreateDiaryEntryInput = {
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || undefined,
          entry_date: entryDate.toISOString(),
          emotion: emotion || undefined,
          tags,
          images: uploadedImageUrls,
          is_private: isPrivate,
        }
        await onSubmit(createData)
      }
    } catch (error: any) {
      console.error('Erro ao salvar entrada do diário:', error)
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível salvar a entrada do diário.',
      )
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      const newDate = new Date(entryDate)
      newDate.setFullYear(selectedDate.getFullYear())
      newDate.setMonth(selectedDate.getMonth())
      newDate.setDate(selectedDate.getDate())
      setEntryDate(newDate)
    }
  }

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      const newDate = new Date(entryDate)
      newDate.setHours(selectedTime.getHours())
      newDate.setMinutes(selectedTime.getMinutes())
      setEntryDate(newDate)
    }
  }

  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Título */}
      <View style={styles.field}>
        <TextInput
          label="Título *"
          value={title}
          onChangeText={setTitle}
          error={!!errors.title}
          style={styles.input}
          maxLength={100}
        />
        {errors.title && <HelperText type="error">{errors.title}</HelperText>}
      </View>

      {/* Data e hora */}
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity
          style={[styles.dateTimeButton, { borderColor: colors.outline }]}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.dateTimeText, { color: colors.textPrimary }]}>
            {formatDate(entryDate)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateTimeButton, { borderColor: colors.outline }]}
          onPress={() => setShowTimePicker(true)}
        >
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.dateTimeText, { color: colors.textPrimary }]}>
            {formatTime(entryDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <View style={styles.field}>
        <TextInput
          label="Como foi seu dia? *"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          error={!!errors.content}
          style={styles.input}
          maxLength={5000}
        />
        {errors.content && (
          <HelperText type="error">{errors.content}</HelperText>
        )}
        <HelperText type="info">{content.length}/5000 caracteres</HelperText>
      </View>

      {/* Local */}
      <View style={styles.field}>
        <TextInput
          label="Local (opcional)"
          value={location}
          onChangeText={setLocation}
          error={!!errors.location}
          style={styles.input}
          maxLength={200}
          left={<TextInput.Icon icon="map-marker-outline" size={20} />}
        />
        {errors.location && (
          <HelperText type="error">{errors.location}</HelperText>
        )}
      </View>

      {/* Seletor de emoção */}
      <EmotionSelector selectedEmotion={emotion} onEmotionSelect={setEmotion} />

      {/* Seletor de tags */}
      <TagSelector selectedTags={tags} onTagsChange={setTags} />

      {/* Seletor de imagens */}
      <DiaryImagePicker images={images} onImagesChange={setImages} />

      {/* Privacidade */}
      <View style={styles.privacyContainer}>
        <View style={styles.privacyInfo}>
          <MaterialCommunityIcons
            name={isPrivate ? 'lock' : 'lock-open-outline'}
            size={20}
            color={colors.primary}
          />
          <View style={styles.privacyTexts}>
            <Text style={[styles.privacyLabel, { color: colors.textPrimary }]}>
              Entrada privada
            </Text>
            <Text
              style={[
                styles.privacyDescription,
                { color: colors.textSecondary },
              ]}
            >
              {isPrivate
                ? 'Apenas você pode ver esta entrada'
                : 'Esta entrada pode ser compartilhada'}
            </Text>
          </View>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          color={colors.primary}
        />
      </View>

      {/* Botões de ação */}
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.button}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={isLoading}
          disabled={isLoading}
        >
          {isEditing ? 'Atualizar' : 'Salvar'}
        </Button>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={entryDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={entryDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginVertical: 16,
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  privacyTexts: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 1,
  },
})
