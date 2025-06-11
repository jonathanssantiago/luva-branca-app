/**
 * Tela para visualizar uma entrada do diário
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native'
import {
  Text,
  Card,
  Chip,
  IconButton,
  FAB,
  Avatar,
  Menu,
} from 'react-native-paper'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { ScreenContainer, CustomHeader } from '@/src/components/ui'
import { useSafetyDiary } from '@/src/hooks/useSafetyDiary'
import {
  SafetyDiaryEntry,
  EMOTION_LABELS,
  EMOTION_EMOJIS,
  EMOTION_COLORS,
} from '@/src/types/diary'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { DIARY_COLORS } from '@/src/constants/diaryColors'

const { width } = Dimensions.get('window')

export default function ViewDiaryEntryScreen() {
  const colors = useThemeExtendedColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { entries, deleteEntry, loading } = useSafetyDiary()

  const [entry, setEntry] = useState<SafetyDiaryEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    // Se ainda está carregando as entradas do hook, aguarda
    if (loading) {
      setIsLoading(true)
      return
    }

    // Buscar a entrada pelo ID
    console.log('🔍 Procurando entrada com ID:', id)
    console.log('📋 Total de entradas carregadas:', entries.length)

    const foundEntry = entries.find((e) => e.id === id)

    if (foundEntry) {
      console.log('✅ Entrada encontrada:', foundEntry.title)
      setEntry(foundEntry)
    } else {
      console.log(
        '❌ Entrada não encontrada. IDs disponíveis:',
        entries.map((e) => e.id),
      )
    }
    setIsLoading(false)
  }, [id, entries, loading])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEdit = () => {
    if (!entry) return
    setMenuVisible(false)
    router.push(`/diary/edit/${entry.id}`)
  }

  const handleDelete = () => {
    if (!entry) return

    setMenuVisible(false)
    Alert.alert(
      'Excluir entrada',
      'Tem certeza que deseja excluir esta entrada do diário? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.id)
              Alert.alert('Sucesso', 'Entrada excluída com sucesso.', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ])
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a entrada.')
            }
          },
        },
      ],
    )
  }

  const getEmotionDisplay = () => {
    if (!entry?.emotion) return null

    return {
      emoji: EMOTION_EMOJIS[entry.emotion],
      label: EMOTION_LABELS[entry.emotion],
      color: EMOTION_COLORS[entry.emotion],
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader
          title="Carregando..."
          backgroundColor={DIARY_COLORS.primary}
          textColor={DIARY_COLORS.onPrimary}
          iconColor={DIARY_COLORS.onPrimary}
          showBackButton={true}
        />

        <ScreenContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DIARY_COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Carregando entrada...
            </Text>
          </View>
        </ScreenContainer>
      </View>
    )
  }

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader
          title="Erro"
          backgroundColor={DIARY_COLORS.primary}
          textColor={DIARY_COLORS.onPrimary}
          iconColor={DIARY_COLORS.onPrimary}
          showBackButton={true}
        />

        <ScreenContainer>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              Entrada não encontrada
            </Text>
          </View>
        </ScreenContainer>
      </View>
    )
  }

  const emotion = getEmotionDisplay()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Entrada do Diário"
        backgroundColor={DIARY_COLORS.primary}
        textColor={DIARY_COLORS.onPrimary}
        iconColor={DIARY_COLORS.onPrimary}
        showBackButton={true}
      />

      <View style={styles.menuContainer}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              iconColor={colors.iconPrimary}
              onPress={() => setMenuVisible(true)}
              style={styles.menuButton}
            />
          }
        >
          <Menu.Item leadingIcon="pencil" title="Editar" onPress={handleEdit} />
          <Menu.Item
            leadingIcon="delete"
            title="Excluir"
            onPress={handleDelete}
          />
        </Menu>
      </View>

      <ScreenContainer scrollable>
        {/* Header Card */}
        <Card style={[styles.headerCard, { backgroundColor: colors.surface }]}>
          <View style={styles.headerContent}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {entry.title}
              </Text>
              {entry.is_private && (
                <MaterialCommunityIcons
                  name="lock"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.lockIcon}
                />
              )}
            </View>

            <Text style={[styles.date, { color: colors.primary }]}>
              {formatDate(entry.entry_date)}
            </Text>

            {entry.location && (
              <View style={styles.locationRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.location, { color: colors.textSecondary }]}
                >
                  {entry.location}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Emotion Card */}
        {emotion && (
          <Card
            style={[styles.emotionCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.emotionContent}>
              <Avatar.Text
                size={48}
                label={emotion.emoji}
                style={[
                  styles.emotionAvatar,
                  { backgroundColor: emotion.color + '20' },
                ]}
                labelStyle={[styles.emotionEmoji, { color: emotion.color }]}
              />
              <View style={styles.emotionInfo}>
                <Text
                  style={[styles.emotionLabel, { color: colors.textPrimary }]}
                >
                  Sentimento
                </Text>
                <Text
                  style={[
                    styles.emotionValue,
                    { color: emotion.color, fontWeight: '600' },
                  ]}
                >
                  {emotion.label}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Content Card */}
        <Card style={[styles.contentCard, { backgroundColor: colors.surface }]}>
          <View style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Conteúdo
            </Text>
            <Text style={[styles.content, { color: colors.textSecondary }]}>
              {entry.content}
            </Text>
          </View>
        </Card>

        {/* Tags Card */}
        {entry.tags && entry.tags.length > 0 && (
          <Card style={[styles.tagsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.cardContent}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Tags
              </Text>
              <View style={styles.tagsContainer}>
                {entry.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                    textStyle={{ color: colors.primary }}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Images Card */}
        {entry.images && entry.images.length > 0 && (
          <Card
            style={[styles.imagesCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.cardContent}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Imagens ({entry.images.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesContainer}
              >
                {entry.images.map((imageUrl, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </Card>
        )}

        {/* Metadata Card */}
        <Card
          style={[styles.metadataCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Informações
            </Text>
            <View style={styles.metadataRow}>
              <Text
                style={[styles.metadataLabel, { color: colors.textSecondary }]}
              >
                Criado em:
              </Text>
              <Text
                style={[styles.metadataValue, { color: colors.textPrimary }]}
              >
                {formatCreatedAt(entry.created_at)}
              </Text>
            </View>
            {entry.created_at !== entry.updated_at && (
              <View style={styles.metadataRow}>
                <Text
                  style={[
                    styles.metadataLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Atualizado em:
                </Text>
                <Text
                  style={[styles.metadataValue, { color: colors.textPrimary }]}
                >
                  {formatCreatedAt(entry.updated_at)}
                </Text>
              </View>
            )}
            <View style={styles.metadataRow}>
              <Text
                style={[styles.metadataLabel, { color: colors.textSecondary }]}
              >
                Privacidade:
              </Text>
              <Text
                style={[styles.metadataValue, { color: colors.textPrimary }]}
              >
                {entry.is_private ? 'Privado' : 'Compartilhável'}
              </Text>
            </View>
          </View>
        </Card>
      </ScreenContainer>

      {/* Edit FAB */}
      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: DIARY_COLORS.primary }]}
        onPress={handleEdit}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  headerContent: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  lockIcon: {
    marginLeft: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
  },
  emotionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  emotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  emotionAvatar: {
    marginRight: 16,
  },
  emotionEmoji: {
    fontSize: 24,
  },
  emotionInfo: {
    flex: 1,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  emotionValue: {
    fontSize: 18,
  },
  contentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  tagsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  imagesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  metadataCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 16,
  },
  imagesContainer: {
    gap: 12,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 150,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 46,
    borderRadius: 16,
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1000,
  },
  menuButton: {
    margin: 0,
  },
})
