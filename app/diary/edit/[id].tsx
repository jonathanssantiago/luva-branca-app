/**
 * Tela para editar uma entrada do diário
 */

import React, { useState, useEffect } from 'react'
import { Alert, ActivityIndicator, View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { router, useLocalSearchParams } from 'expo-router'
import { ScreenContainer, CustomHeader } from '@/src/components/ui'
import { useSafetyDiary } from '@/src/hooks/useSafetyDiary'
import { DiaryForm } from '@/src/components/diary/DiaryForm'
import { UpdateDiaryEntryInput, SafetyDiaryEntry } from '@/src/types/diary'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { DIARY_COLORS } from '@/src/constants/diaryColors'

export default function EditDiaryEntryScreen() {
  const colors = useThemeExtendedColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { entries, updateEntry, refreshEntries, loading } = useSafetyDiary()

  const [entry, setEntry] = useState<SafetyDiaryEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEntry, setIsLoadingEntry] = useState(true)

  useEffect(() => {
    // Se ainda está carregando as entradas do hook, aguarda
    if (loading) {
      setIsLoadingEntry(true)
      return
    }

    // Buscar a entrada pelo ID
    console.log('🔍 Procurando entrada para edição com ID:', id)
    console.log('📋 Total de entradas carregadas:', entries.length)

    const foundEntry = entries.find((e) => e.id === id)

    if (foundEntry) {
      console.log('✅ Entrada encontrada para edição:', foundEntry.title)
      setEntry(foundEntry)
    } else {
      console.log(
        '❌ Entrada não encontrada para edição. IDs disponíveis:',
        entries.map((e) => e.id),
      )
    }
    setIsLoadingEntry(false)
  }, [id, entries, loading])

  const handleSubmit = async (data: UpdateDiaryEntryInput) => {
    if (!entry || isLoading) return

    setIsLoading(true)
    try {
      const success = await updateEntry(entry.id, data)
      if (success) {
        Alert.alert('Sucesso', 'Entrada do diário atualizada com sucesso!', [
          {
            text: 'OK',

            onPress: () => {
              router.back()
            },
          },
        ])
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a entrada do diário.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (isLoading) return
    router.back()
  }

  if (isLoadingEntry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader
          title="Editar Entrada"
          backgroundColor={DIARY_COLORS.primary}
          textColor={DIARY_COLORS.onPrimary}
          iconColor={DIARY_COLORS.onPrimary}
          showBackButton={true}
          onLeftPress={handleCancel}
        />

        <ScreenContainer
          scrollable
          contentStyle={{ paddingBottom: 60, paddingTop: 30 }}
          keyboardAvoiding={true}
        >
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
          title="Editar Entrada"
          backgroundColor={DIARY_COLORS.primary}
          textColor={DIARY_COLORS.onPrimary}
          iconColor={DIARY_COLORS.onPrimary}
          showBackButton={true}
          onLeftPress={handleCancel}
        />

        <ScreenContainer
          scrollable
          contentStyle={{ paddingBottom: 60, paddingTop: 30 }}
          keyboardAvoiding={true}
        >
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              Entrada não encontrada
            </Text>
          </View>
        </ScreenContainer>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Editar Entrada"
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
          entry={entry}
          onSubmit={() => Promise.resolve()}
          onUpdate={handleSubmit}
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
})
