/**
 * Componente para seleção e preview de imagens do diário
 */

import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native'
import { Text, IconButton, ActivityIndicator, Card } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

interface DiaryImagePickerProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  style?: any
}

export const DiaryImagePicker: React.FC<DiaryImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  style,
}) => {
  const colors = useThemeExtendedColors()
  const [isLoading, setIsLoading] = useState(false)

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar suas fotos.',
      )
      return false
    }
    return true
  }

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        'Limite atingido',
        `Você pode adicionar no máximo ${maxImages} imagens.`,
      )
      return
    }

    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    setIsLoading(true)

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri]
        onImagesChange(newImages)
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a imagem.')
    } finally {
      setIsLoading(false)
    }
  }

  const takePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        'Limite atingido',
        `Você pode adicionar no máximo ${maxImages} imagens.`,
      )
      return
    }

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
    if (cameraPermission.status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar a câmera.',
      )
      return
    }

    setIsLoading(true)

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri]
        onImagesChange(newImages)
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto.')
    } finally {
      setIsLoading(false)
    }
  }

  const removeImage = (index: number) => {
    Alert.alert(
      'Remover imagem',
      'Tem certeza que deseja remover esta imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index)
            onImagesChange(newImages)
          },
        },
      ],
    )
  }

  const showImageOptions = () => {
    Alert.alert(
      'Adicionar imagem',
      'Como você gostaria de adicionar uma imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Câmera', onPress: takePhoto },
        { text: 'Galeria', onPress: pickImage },
      ],
    )
  }

  const canAddMore = images.length < maxImages

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Imagens ({images.length}/{maxImages})
        </Text>
        {canAddMore && !isLoading && (
          <IconButton
            icon="camera-plus"
            size={24}
            iconColor={colors.primary}
            onPress={showImageOptions}
          />
        )}
        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesContainer}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Card style={styles.imageCard}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    { backgroundColor: colors.error },
                  ]}
                  onPress={() => removeImage(index)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={colors.onError}
                  />
                </TouchableOpacity>
              </Card>
            </View>
          ))}
        </ScrollView>
      )}

      {images.length === 0 && !isLoading && (
        <TouchableOpacity
          style={[
            styles.emptyContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
          onPress={showImageOptions}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="camera-plus-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Toque para adicionar imagens
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Máximo {maxImages} fotos
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagesContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  imageCard: {
    width: 120,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  emptyContainer: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 12,
    marginTop: 4,
  },
})
