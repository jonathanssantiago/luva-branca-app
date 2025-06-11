/**
 * Componente de card para exibir uma entrada do diário na lista
 */

import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Card, Chip, Avatar } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import {
  SafetyDiaryEntry,
  EMOTION_LABELS,
  EMOTION_EMOJIS,
  EMOTION_COLORS,
} from '@/src/types/diary'

interface DiaryEntryCardProps {
  entry: SafetyDiaryEntry
  onPress: () => void
  onEdit?: () => void
  onDelete?: () => void
  style?: any
}

export const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({
  entry,
  onPress,
  onEdit,
  onDelete,
  style,
}) => {
  const colors = useThemeExtendedColors()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEmotionDisplay = () => {
    if (!entry.emotion) return null

    return {
      emoji: EMOTION_EMOJIS[entry.emotion],
      label: EMOTION_LABELS[entry.emotion],
      color: EMOTION_COLORS[entry.emotion],
    }
  }

  const emotion = getEmotionDisplay()
  const hasImages = entry.images && entry.images.length > 0
  const imageCount = entry.images?.length || 0

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style}>
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {entry.title}
              </Text>
              {entry.is_private && (
                <MaterialCommunityIcons
                  name="lock"
                  size={16}
                  color={colors.textSecondary}
                  style={styles.lockIcon}
                />
              )}
            </View>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(entry.entry_date)}
            </Text>
          </View>

          {/* Content preview */}
          <Text
            style={[styles.content, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {entry.content}
          </Text>

          {/* Location */}
          {entry.location && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.location, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {entry.location}
              </Text>
            </View>
          )}

          {/* Emotion */}
          {emotion && (
            <View style={styles.emotionRow}>
              <Avatar.Text
                size={32}
                label={emotion.emoji}
                style={[
                  styles.emotionAvatar,
                  { backgroundColor: emotion.color + '20' },
                ]}
                labelStyle={[styles.emotionEmoji, { color: emotion.color }]}
              />
              <Text
                style={[
                  styles.emotionLabel,
                  { color: emotion.color, fontWeight: '600' },
                ]}
              >
                {emotion.label}
              </Text>
            </View>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {entry.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  compact
                  textStyle={[styles.tagText, { color: colors.primary }]}
                  style={[
                    styles.tag,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  {tag}
                </Chip>
              ))}
              {entry.tags.length > 3 && (
                <Text
                  style={[styles.moreTagsText, { color: colors.textSecondary }]}
                >
                  +{entry.tags.length - 3}
                </Text>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.statsRow}>
              {hasImages && (
                <View style={styles.stat}>
                  <MaterialCommunityIcons
                    name="image-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.statText, { color: colors.textSecondary }]}
                  >
                    {imageCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  style={styles.actionButton}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  style={styles.actionButton}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  lockIcon: {
    marginLeft: 8,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emotionAvatar: {
    marginRight: 8,
  },
  emotionEmoji: {
    fontSize: 16,
  },
  emotionLabel: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    height: 28,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
})
