/**
 * Tela principal do Diário de Segurança da Mulher
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native'
import {
  Text,
  FAB,
  Searchbar,
  Chip,
  ActivityIndicator,
  Surface,
  Card,
  IconButton,
  Menu,
} from 'react-native-paper'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import { ScreenContainer, CustomHeader } from '@/src/components/ui'
import { useSafetyDiary } from '@/src/hooks/useSafetyDiary'
import { DiaryEntryCard } from '@/src/components/diary/DiaryEntryCard'
import {
  SafetyDiaryEntry,
  DiaryEmotion,
  EMOTION_LABELS,
} from '@/src/types/diary'
import { DIARY_COLORS } from '@/src/constants/diaryColors'

const { width } = Dimensions.get('window')

export default function SafetyDiaryScreen() {
  const colors = useThemeExtendedColors()
  const {
    entries,
    loading,
    searchEntries,
    deleteEntry,
    refreshEntries,
    getStatistics,
  } = useSafetyDiary()

  // State para busca e filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState<DiaryEmotion | null>(
    null,
  )
  const [showFilters, setShowFilters] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [statistics, setStatistics] = useState<any>(null)

  // State para dados filtrados
  const [filteredEntries, setFilteredEntries] = useState<SafetyDiaryEntry[]>([])

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      refreshEntries()
      loadStatistics()
    }, []),
  )

  // Função para carregar estatísticas
  const loadStatistics = async () => {
    try {
      const stats = await getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // Filtrar entradas quando os filtros mudarem
  useEffect(() => {
    let filtered = [...entries]

    // Filtro por busca de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          (entry.location && entry.location.toLowerCase().includes(query)),
      )
    }

    // Filtro por emoção
    if (selectedEmotion) {
      filtered = filtered.filter((entry) => entry.emotion === selectedEmotion)
    }

    // Ordenar por data (mais recentes primeiro)
    filtered.sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    )

    setFilteredEntries(filtered)
  }, [entries, searchQuery, selectedEmotion])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshEntries()
    setRefreshing(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleEmotionFilter = (emotion: DiaryEmotion | null) => {
    setSelectedEmotion(emotion)
    setShowFilters(false)
  }

  const handleEntryPress = (entry: SafetyDiaryEntry) => {
    // Navegar para tela de detalhes/visualização
    router.push(`/diary/view/${entry.id}`)
  }

  const handleEditEntry = (entry: SafetyDiaryEntry) => {
    router.push(`/diary/edit/${entry.id}`)
  }

  const handleDeleteEntry = async (entry: SafetyDiaryEntry) => {
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
              Alert.alert('Sucesso', 'Entrada excluída com sucesso.')
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a entrada.')
            }
          },
        },
      ],
    )
  }

  const handleCreateEntry = () => {
    router.push('/diary/create')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedEmotion(null)
    setShowFilters(false)
  }

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

  const hasActiveFilters = searchQuery.trim() || selectedEmotion

  const renderEntry = ({ item }: { item: SafetyDiaryEntry }) => (
    <DiaryEntryCard
      entry={item}
      onPress={() => handleEntryPress(item)}
      onEdit={() => handleEditEntry(item)}
      onDelete={() => handleDeleteEntry(item)}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="book-open-page-variant-outline"
        size={80}
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {hasActiveFilters
          ? 'Nenhuma entrada encontrada'
          : 'Seu diário está vazio'}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {hasActiveFilters
          ? 'Tente ajustar os filtros de busca'
          : 'Comece escrevendo sobre seu dia e suas experiências'}
      </Text>
      {hasActiveFilters && (
        <Text
          style={[styles.clearFiltersText, { color: colors.primary }]}
          onPress={clearFilters}
        >
          Limpar filtros
        </Text>
      )}
    </View>
  )

  const renderStatistics = () => {
    if (!statistics || statistics.totalEntries === 0) return null

    return (
      <Card style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {statistics.totalEntries}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total de entradas
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {statistics.entriesThisMonth}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Este mês
            </Text>
          </View>
          {statistics.mostUsedEmotion && (
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {EMOTION_LABELS[statistics.mostUsedEmotion as DiaryEmotion]}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Emoção principal
              </Text>
            </View>
          )}
        </View>
      </Card>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Meu Diário"
        backgroundColor={DIARY_COLORS.primary}
        textColor={DIARY_COLORS.onPrimary}
        iconColor={DIARY_COLORS.onPrimary}
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
      />

      <ScreenContainer
        scrollable
        contentStyle={{ paddingBottom: 60, paddingTop: 30 }}
        keyboardAvoiding={true}
      >
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Registre suas experiências e sentimentos de forma segura e privada
        </Text>

        {/* Botão Nova Entrada */}
        <View style={styles.topButtonContainer}>
          <FAB
            icon="plus"
            style={[styles.topFab, { backgroundColor: DIARY_COLORS.primary }]}
            onPress={handleCreateEntry}
            label="Nova entrada"
          />
        </View>

        {/* Barra de busca */}
        <Searchbar
          placeholder="Buscar no diário..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />

        {/* Filtros */}
        {showFilters && (
          <Surface
            style={[
              styles.filtersContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.filtersTitle, { color: colors.textPrimary }]}>
              Filtrar por emoção:
            </Text>
            <View style={styles.emotionFilters}>
              <Chip
                selected={!selectedEmotion}
                onPress={() => handleEmotionFilter(null)}
                style={styles.emotionChip}
              >
                Todas
              </Chip>
              {emotions.map((emotion) => (
                <Chip
                  key={emotion}
                  selected={selectedEmotion === emotion}
                  onPress={() => handleEmotionFilter(emotion)}
                  style={styles.emotionChip}
                >
                  {EMOTION_LABELS[emotion]}
                </Chip>
              ))}
            </View>
          </Surface>
        )}

        {/* Estatísticas */}
        {renderStatistics()}

        {loading && filteredEntries.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DIARY_COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Carregando suas entradas...
            </Text>
          </View>
        )}

        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            filteredEntries.length === 0 ? { flex: 1 } : styles.listContainer
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[DIARY_COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </ScreenContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  emotionFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    marginBottom: 4,
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 100,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  topButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  topFab: {
    alignSelf: 'center',
    borderRadius: 16,
  },
})
