/**
 * Componente para seleção de tags no diário
 */

import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import {
  Text,
  Chip,
  TextInput,
  IconButton,
  HelperText,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { PREDEFINED_DIARY_TAGS } from '@/src/types/diary'

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
  style?: any
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  maxTags = 10,
  style,
}) => {
  const colors = useThemeExtendedColors()
  const [newTag, setNewTag] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remover tag
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      // Adicionar tag se não exceder o limite
      if (selectedTags.length < maxTags) {
        onTagsChange([...selectedTags, tag])
      }
    }
  }

  const handleAddCustomTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (tag && !selectedTags.includes(tag) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag])
      setNewTag('')
      setShowCustomInput(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove))
  }

  const isLimitReached = selectedTags.length >= maxTags

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Tags ({selectedTags.length}/{maxTags})
        </Text>
        <IconButton
          icon="plus"
          size={20}
          iconColor={colors.primary}
          onPress={() => setShowCustomInput(!showCustomInput)}
          disabled={isLimitReached}
        />
      </View>

      {/* Tags selecionadas */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Selecionadas:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedTags}
          >
            {selectedTags.map((tag) => (
              <Chip
                key={tag}
                mode="flat"
                style={[
                  styles.selectedTag,
                  { backgroundColor: colors.primary + '20' },
                ]}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
                onClose={() => handleRemoveTag(tag)}
                closeIcon={() => (
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={colors.primary}
                  />
                )}
              >
                {tag}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input para tag customizada */}
      {showCustomInput && (
        <View style={styles.customTagContainer}>
          <TextInput
            label="Nova tag"
            value={newTag}
            onChangeText={setNewTag}
            style={[styles.customTagInput, { backgroundColor: colors.surface }]}
            mode="outlined"
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.textPrimary}
            placeholderTextColor={colors.placeholder}
            right={
              <TextInput.Icon
                icon="check"
                onPress={handleAddCustomTag}
                disabled={!newTag.trim() || isLimitReached}
              />
            }
            onSubmitEditing={handleAddCustomTag}
            maxLength={20}
          />
          <HelperText type="info" style={{ color: colors.textSecondary }}>
            Pressione Enter ou toque em ✓ para adicionar
          </HelperText>
        </View>
      )}

      {/* Tags predefinidas */}
      <View style={styles.predefinedTagsContainer}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Sugestões:
        </Text>
        <View style={styles.predefinedTags}>
          {PREDEFINED_DIARY_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag)
            const isDisabled = !isSelected && isLimitReached

            return (
              <Chip
                key={tag}
                mode={isSelected ? 'flat' : 'outlined'}
                style={[
                  styles.predefinedTag,
                  isSelected && { backgroundColor: colors.primary + '15' },
                  isDisabled && { opacity: 0.5 },
                ]}
                textStyle={{
                  color: isSelected ? colors.primary : colors.textSecondary,
                  fontSize: 12,
                }}
                onPress={() => !isDisabled && handleToggleTag(tag)}
                disabled={isDisabled}
              >
                {tag}
              </Chip>
            )
          })}
        </View>
      </View>

      {isLimitReached && (
        <HelperText type="error" style={{ color: colors.error }}>
          Limite máximo de {maxTags} tags atingido
        </HelperText>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectedTagsContainer: {
    marginBottom: 16,
  },
  selectedTags: {
    gap: 8,
    paddingHorizontal: 4,
  },
  selectedTag: {
    marginHorizontal: 2,
  },
  customTagContainer: {
    marginBottom: 16,
  },
  customTagInput: {
    marginBottom: 4,
  },
  predefinedTagsContainer: {
    marginTop: 8,
  },
  predefinedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  predefinedTag: {
    marginBottom: 4,
  },
})
