/**
 * Componente para seleção de emoções no diário
 */

import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { Text, Card } from 'react-native-paper'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import {
  DiaryEmotion,
  EMOTION_LABELS,
  EMOTION_EMOJIS,
  EMOTION_COLORS,
} from '@/src/types/diary'

interface EmotionSelectorProps {
  selectedEmotion?: DiaryEmotion | null
  onEmotionSelect: (emotion: DiaryEmotion | null) => void
  style?: any
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onEmotionSelect,
  style,
}) => {
  const colors = useThemeExtendedColors()

  const emotions: DiaryEmotion[] = [
    'happy',
    'calm',
    'hopeful',
    'worried',
    'anxious',
    'sad',
    'angry',
    'fearful',
  ]

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>
        Como você se sentiu?
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.emotionsContainer}
      >
        {/* Opção para limpar seleção */}
        <TouchableOpacity
          style={[
            styles.emotionCard,
            {
              backgroundColor: !selectedEmotion
                ? colors.primary
                : colors.surface,
              borderColor: !selectedEmotion ? colors.primary : colors.outline,
            },
          ]}
          onPress={() => onEmotionSelect(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.emotionEmoji,
              { opacity: !selectedEmotion ? 1 : 0.5 },
            ]}
          >
            ✨
          </Text>
          <Text
            style={[
              styles.emotionLabel,
              {
                color: !selectedEmotion
                  ? colors.onPrimary
                  : colors.textSecondary,
                fontWeight: !selectedEmotion ? 'bold' : 'normal',
              },
            ]}
          >
            Neutro
          </Text>
        </TouchableOpacity>

        {emotions.map((emotion) => {
          const isSelected = selectedEmotion === emotion
          const emotionColor = EMOTION_COLORS[emotion]

          return (
            <TouchableOpacity
              key={emotion}
              style={[
                styles.emotionCard,
                {
                  backgroundColor: isSelected
                    ? emotionColor + '20'
                    : colors.surface,
                  borderColor: isSelected ? emotionColor : colors.outline,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => onEmotionSelect(emotion)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.emotionEmoji, { opacity: isSelected ? 1 : 0.7 }]}
              >
                {EMOTION_EMOJIS[emotion]}
              </Text>
              <Text
                style={[
                  styles.emotionLabel,
                  {
                    color: isSelected ? emotionColor : colors.textSecondary,
                    fontWeight: isSelected ? 'bold' : 'normal',
                  },
                ]}
              >
                {EMOTION_LABELS[emotion]}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emotionsContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  emotionCard: {
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emotionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 14,
  },
})
