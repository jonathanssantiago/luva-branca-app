/**
 * Tela para criar uma nova entrada do diário
 */

import React, { useState } from 'react'
import { Alert, View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { ScreenContainer, CustomHeader } from '@/src/components/ui'
import { useSafetyDiary } from '@/src/hooks/useSafetyDiary'
import { DiaryForm } from '@/src/components/diary/DiaryForm'
import { CreateDiaryEntryInput } from '@/src/types/diary'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { DIARY_COLORS } from '@/src/constants/diaryColors'

export default function CreateDiaryEntryScreen() {
  const colors = useThemeExtendedColors()
  const { addEntry, refreshEntries } = useSafetyDiary()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateDiaryEntryInput) => {
    setIsLoading(true)
    try {
      const result = await addEntry(data)
      if (result) {
        Alert.alert('Sucesso', 'Entrada do diário criada com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              router.back()
            },
          },
        ])
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a entrada do diário.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (isLoading) return
    router.back()
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Nova Entrada"
        backgroundColor={DIARY_COLORS.primary}
        textColor={DIARY_COLORS.onPrimary}
        iconColor={DIARY_COLORS.onPrimary}
        showBackButton={true}
        onLeftPress={handleCancel}
      />

      <ScreenContainer
        scrollable
        contentStyle={{ paddingBottom: 60, paddingTop: 10 }}
        keyboardAvoiding={true}
      >
        <DiaryForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </ScreenContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
