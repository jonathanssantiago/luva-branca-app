import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SecretGestureDetector } from '@/src/components/ui/SecretGestureDetector'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'

const { width } = Dimensions.get('window')

interface Recipe {
  id: string
  title: string
  description: string
  time: string
  difficulty: string
  image: string
  ingredients: string[]
  instructions: string[]
}

const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Bolo de Chocolate',
    description: 'Um delicioso bolo de chocolate fofinho e molhadinho',
    time: '45 min',
    difficulty: 'Fácil',
    image: '🍰',
    ingredients: [
      '2 xícaras de farinha de trigo',
      '1 xícara de açúcar',
      '1/2 xícara de chocolate em pó',
      '3 ovos',
      '1 xícara de leite',
    ],
    instructions: [
      'Pré-aqueça o forno a 180°C',
      'Misture os ingredientes secos',
      'Adicione os líquidos e misture bem',
      'Asse por 30-35 minutos',
    ],
  },
  {
    id: '2',
    title: 'Salada Caesar',
    description: 'Salada clássica com molho caesar caseiro',
    time: '20 min',
    difficulty: 'Fácil',
    image: '🥗',
    ingredients: [
      'Alface romana',
      'Queijo parmesão',
      'Croutons',
      'Molho caesar',
      'Peito de frango grelhado',
    ],
    instructions: [
      'Lave e corte a alface',
      'Grelhe o frango e corte em fatias',
      'Misture todos os ingredientes',
      'Finalize com queijo e croutons',
    ],
  },
  {
    id: '3',
    title: 'Pasta ao Alho e Óleo',
    description: 'Receita italiana simples e saborosa',
    time: '15 min',
    difficulty: 'Fácil',
    image: '🍝',
    ingredients: [
      '400g de espaguete',
      '6 dentes de alho',
      '1/2 xícara de azeite',
      'Salsinha picada',
      'Queijo parmesão',
    ],
    instructions: [
      'Cozinhe o macarrão al dente',
      'Refogue o alho no azeite',
      'Misture o macarrão com o alho',
      'Finalize com salsinha e queijo',
    ],
  },
]

const DisguisedRecipeScreen = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isSecretModeVisible, setIsSecretModeVisible] = useState(false)
  const emergencyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSecretActivation = () => {
    // Mostrar confirmação antes de sair do modo disfarçado
    setIsSecretModeVisible(true)
    setTimeout(() => {
      setIsSecretModeVisible(false)
      // Navegar para o app real do Luva Branca
      router.replace('/(tabs)')
    }, 1500)
  }

  const handleEmergencyActivation = () => {
    // Ativação direta do SOS sem sair do modo disfarçado
    // Aqui você pode implementar uma chamada direta para emergência
    Alert.alert('Emergência', 'Função de emergência ativada silenciosamente')
  }

  const renderRecipeCard = (recipe: Recipe) => (
    <TouchableOpacity
      key={recipe.id}
      style={styles.recipeCard}
      onPress={() => setSelectedRecipe(recipe)}
    >
      <View style={styles.recipeImageContainer}>
        <Text style={styles.recipeEmoji}>{recipe.image}</Text>
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
        <View style={styles.recipeDetails}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={LuvaBrancaColors.textSecondary}
            />
            <Text style={styles.detailText}>{recipe.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="chef-hat" size={16} color={LuvaBrancaColors.textSecondary} />
            <Text style={styles.detailText}>{recipe.difficulty}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderRecipeDetail = (recipe: Recipe) => (
    <ScrollView style={styles.detailContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedRecipe(null)}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={LuvaBrancaColors.textPrimary} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.detailHeader}>
        <Text style={styles.detailEmoji}>{recipe.image}</Text>
        <Text style={styles.detailTitle}>{recipe.title}</Text>
        <Text style={styles.detailDescription}>{recipe.description}</Text>

        <View style={styles.detailMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={LuvaBrancaColors.primary}
            />
            <Text style={styles.metaText}>{recipe.time}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="chef-hat" size={20} color={LuvaBrancaColors.primary} />
            <Text style={styles.metaText}>{recipe.difficulty}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ingredientText}>{ingredient}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de Preparo</Text>
        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>{index + 1}</Text>
            </View>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  )

  if (selectedRecipe) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={LuvaBrancaColors.backgrounds.primary} />
        {renderRecipeDetail(selectedRecipe)}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={LuvaBrancaColors.backgrounds.primary} />

      {/* Header com gesto secreto */}
      <SecretGestureDetector
        onSecretActivated={handleSecretActivation}
        style={styles.header}
        requiredTaps={5}
        timeWindow={2000}
        tapSequence="same-area"
      >
        <Text style={styles.headerTitle}>Dicas de Culinária</Text>
        <Text style={styles.headerSubtitle}>
          Receitas deliciosas para o dia a dia
        </Text>
        <MaterialCommunityIcons name="chef-hat" size={32} color={LuvaBrancaColors.primary} />
      </SecretGestureDetector>

      {/* Lista de receitas */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Receitas Populares</Text>
        {mockRecipes.map(renderRecipeCard)}

        {/* Seção de Emergência Disfarçada */}
        <View style={styles.favoritesSection}>
          <Text style={styles.favoritesTitle}>⭐ Receitas Favoritas</Text>
          <TouchableOpacity
            style={styles.emergencyButton}
            onLongPress={() => {
              emergencyTimeoutRef.current = setTimeout(() => {
                handleEmergencyActivation()
              }, 100)
            }}
            onPressOut={() => {
              if (emergencyTimeoutRef.current) {
                clearTimeout(emergencyTimeoutRef.current)
              }
            }}
            delayLongPress={3000}
          >
            <MaterialCommunityIcons name="heart" size={24} color={LuvaBrancaColors.primary} />
            <Text style={styles.emergencyButtonText}>
              Minhas Receitas Especiais
            </Text>
            <Text style={styles.emergencySubtext}>
              Pressione e segure para acessar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Dica: Toque 5 vezes rapidamente no título para acessar recursos
            especiais
          </Text>
        </View>
      </ScrollView>

      {/* Indicador de Modo Secreto */}
      {isSecretModeVisible && (
        <View style={styles.secretModeOverlay}>
          <View style={styles.secretModeCard}>
            <MaterialCommunityIcons
              name="shield-check"
              size={48}
              color={LuvaBrancaColors.success}
            />
            <Text style={styles.secretModeTitle}>Modo Seguro Ativado</Text>
            <Text style={styles.secretModeSubtitle}>Redirecionando...</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuvaBrancaColors.backgrounds.surface,
  },
  header: {
    backgroundColor: LuvaBrancaColors.backgrounds.card,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: LuvaBrancaColors.divider,
    elevation: 3,
    shadowColor: LuvaBrancaColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: LuvaBrancaColors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: LuvaBrancaColors.textPrimary,
    marginTop: 24,
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  recipeCard: {
    backgroundColor: LuvaBrancaColors.backgrounds.card,
    borderRadius: 16,
    marginBottom: 16,
    padding: 18,
    flexDirection: 'row',
    elevation: 4,
    shadowColor: LuvaBrancaColors.textPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: LuvaBrancaColors.divider,
  },
  recipeImageContainer: {
    width: 85,
    height: 85,
    backgroundColor: LuvaBrancaColors.lightPink,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  recipeEmoji: {
    fontSize: 42,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  recipeDescription: {
    fontSize: 15,
    color: LuvaBrancaColors.textSecondary,
    marginBottom: 14,
    lineHeight: 22,
  },
  recipeDetails: {
    flexDirection: 'row',
    gap: 18,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: LuvaBrancaColors.textSecondary,
    fontWeight: '500',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: LuvaBrancaColors.backgrounds.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingTop: 60,
    backgroundColor: LuvaBrancaColors.backgrounds.card,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: LuvaBrancaColors.divider,
  },
  backText: {
    fontSize: 17,
    color: LuvaBrancaColors.textPrimary,
    fontWeight: '600',
  },
  detailHeader: {
    backgroundColor: LuvaBrancaColors.backgrounds.card,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: LuvaBrancaColors.divider,
  },
  detailEmoji: {
    fontSize: 64,
    marginBottom: 18,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  detailDescription: {
    fontSize: 17,
    color: LuvaBrancaColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 32,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 15,
    color: LuvaBrancaColors.textPrimary,
    fontWeight: '600',
  },
  section: {
    backgroundColor: LuvaBrancaColors.backgrounds.card,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 3,
    shadowColor: LuvaBrancaColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: LuvaBrancaColors.divider,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 18,
    color: LuvaBrancaColors.primary,
    marginRight: 14,
    marginTop: 2,
    fontWeight: 'bold',
  },
  ingredientText: {
    fontSize: 16,
    color: LuvaBrancaColors.textPrimary,
    flex: 1,
    lineHeight: 24,
    fontWeight: '500',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepNumber: {
    width: 28,
    height: 28,
    backgroundColor: LuvaBrancaColors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepText: {
    fontSize: 13,
    color: LuvaBrancaColors.onPrimary,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 16,
    color: LuvaBrancaColors.textPrimary,
    flex: 1,
    lineHeight: 24,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: LuvaBrancaColors.veryLightPink,
    marginHorizontal: 0,
    marginTop: 24,
    marginBottom: 40,
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: LuvaBrancaColors.primary,
  },
  footerText: {
    fontSize: 15,
    color: LuvaBrancaColors.primary,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  favoritesSection: {
    backgroundColor: LuvaBrancaColors.backgrounds.card,
    marginHorizontal: 0,
    marginTop: 24,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    elevation: 3,
    shadowColor: LuvaBrancaColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: LuvaBrancaColors.divider,
  },
  favoritesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: LuvaBrancaColors.textPrimary,
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emergencyButton: {
    backgroundColor: LuvaBrancaColors.lightPink,
    borderWidth: 2,
    borderColor: LuvaBrancaColors.primaryWithOpacity(0.3),
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: LuvaBrancaColors.primary,
    marginTop: 10,
    letterSpacing: 0.2,
  },
  emergencySubtext: {
    fontSize: 13,
    color: LuvaBrancaColors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  secretModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: LuvaBrancaColors.backgrounds.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  secretModeCard: {
    backgroundColor: LuvaBrancaColors.backgrounds.card,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    maxWidth: 300,
    elevation: 10,
    shadowColor: LuvaBrancaColors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: LuvaBrancaColors.success,
  },
  secretModeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: LuvaBrancaColors.success,
    marginTop: 18,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  secretModeSubtitle: {
    fontSize: 15,
    color: LuvaBrancaColors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
})

export default DisguisedRecipeScreen
