import React, { useState, useRef, useEffect } from 'react'
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
  ActivityIndicator,
  Animated,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { SecretGestureDetector } from '@/src/components/ui/SecretGestureDetector'
import { LuvaBrancaColors } from '@/lib/ui/styles/luvabranca-colors'
import { supabase } from '@/lib/supabase'
import {
  DISGUISED_MODE_STORAGE_KEYS,
  saveDisguisedModeCredentials,
  clearDisguisedModeCredentials,
  hasDisguisedModeCredentials,
  getLastLoginInfo,
  updateLastLogin,
  SilentLoginResult,
} from '@/lib/utils/disguised-mode-auth'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import * as Haptics from 'expo-haptics'

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
  const colors = useThemeExtendedColors()

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isSecretModeVisible, setIsSecretModeVisible] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [gestureProgress, setGestureProgress] = useState(0)
  const emergencyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gestureAnimValue = useRef(new Animated.Value(0)).current
  const progressBarAnim = useRef(new Animated.Value(0)).current

  // Efeito para animar indicador de progresso do gesto
  useEffect(() => {
    if (gestureProgress > 0) {
      Animated.timing(progressBarAnim, {
        toValue: gestureProgress / 3, // 3 toques necessários
        duration: 200,
        useNativeDriver: false,
      }).start()

      // Reset após timeout
      setTimeout(() => {
        if (gestureProgress < 3) {
          setGestureProgress(0)
          Animated.timing(progressBarAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start()
        }
      }, 2000)
    }
  }, [gestureProgress])

  /**
   * Função principal de login silencioso otimizada
   */
  const silentLoginIfNeeded = async (): Promise<SilentLoginResult> => {
    try {
      setIsAuthenticating(true)
      setAuthMessage('Verificando acesso...')

      // 1. Verificar último login
      const { lastLogin, isRecent } = await getLastLoginInfo()

      if (isRecent) {
        setAuthMessage('Acesso liberado!')
        await new Promise((resolve) => setTimeout(resolve, 800))
        return {
          success: true,
          message: 'Login recente ainda válido',
          reason: 'recent_login',
        }
      }

      // 2. Verificar credenciais
      const hasCredentials = await hasDisguisedModeCredentials()
      if (!hasCredentials) {
        return {
          success: false,
          message:
            'É necessário fazer login manual primeiro para usar o modo disfarçado.',
          reason: 'no_credentials',
        }
      }

      // 3. Tentar restaurar sessão
      setAuthMessage('Restaurando sessão...')

      const [sessionToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN),
      ])

      if (sessionToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: sessionToken,
            refresh_token: refreshToken,
          })

          if (!error && data.session) {
            await updateLastLogin()
            setAuthMessage('Sessão restaurada!')
            await new Promise((resolve) => setTimeout(resolve, 600))
            return {
              success: true,
              message: 'Sessão restaurada com sucesso',
              reason: 'session_restored',
            }
          }
        } catch (sessionError) {
          console.log(
            'Erro ao restaurar sessão, tentando login com credenciais...',
          )
        }
      }

      // 4. Login com credenciais salvas
      setAuthMessage('Autenticando...')

      const [userEmail, userPassword] = await Promise.all([
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_EMAIL),
        SecureStore.getItemAsync(DISGUISED_MODE_STORAGE_KEYS.USER_PASSWORD),
      ])

      if (!userEmail || !userPassword) {
        return {
          success: false,
          message: 'Credenciais incompletas encontradas',
          reason: 'no_credentials',
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      })

      if (error) {
        console.error('Erro no login silencioso:', error)
        return {
          success: false,
          message: `Erro na autenticação: ${error.message}`,
          reason: 'auth_error',
        }
      }

      if (!data.session) {
        return {
          success: false,
          message: 'Não foi possível estabelecer sessão',
          reason: 'auth_error',
        }
      }

      // 5. Atualizar tokens
      await Promise.all([
        SecureStore.setItemAsync(
          DISGUISED_MODE_STORAGE_KEYS.SESSION_TOKEN,
          data.session.access_token,
        ),
        SecureStore.setItemAsync(
          DISGUISED_MODE_STORAGE_KEYS.REFRESH_TOKEN,
          data.session.refresh_token,
        ),
        updateLastLogin(),
      ])

      setAuthMessage('Login realizado!')
      await new Promise((resolve) => setTimeout(resolve, 600))

      return {
        success: true,
        message: 'Login silencioso realizado com sucesso',
        reason: 'credentials_login',
      }
    } catch (error) {
      console.error('Erro no login silencioso:', error)
      return {
        success: false,
        message: 'Erro inesperado durante a autenticação',
        reason: 'network_error',
      }
    } finally {
      setIsAuthenticating(false)
      setAuthMessage('')
    }
  }

  const handleSecretActivation = async () => {
    // Feedback háptico
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    // Mostrar overlay de modo secreto
    setIsSecretModeVisible(true)
    setGestureProgress(0)

    try {
      // Realizar login silencioso
      const loginResult = await silentLoginIfNeeded()

      if (loginResult.success) {
        // Login bem-sucedido - navegar para o app real
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        )
        setAuthMessage('Acesso liberado!')

        setTimeout(() => {
          setIsSecretModeVisible(false)
          // Usar replace para evitar volta ao modo disfarçado
          router.replace('/(tabs)')
        }, 1200)
      } else {
        // Login falhou - mostrar erro e voltar ao modo disfarçado
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setTimeout(() => {
          setIsSecretModeVisible(false)

          // Personalizar mensagem de erro baseado no motivo
          let errorMessage = 'Não foi possível acessar o aplicativo.'

          if (loginResult.reason === 'no_credentials') {
            errorMessage =
              'É necessário fazer login pelo menos uma vez antes de usar o modo disfarçado.'
          } else if (loginResult.reason === 'auth_error') {
            errorMessage =
              'Credenciais expiradas. Faça login novamente no aplicativo.'
          } else if (loginResult.reason === 'network_error') {
            errorMessage =
              'Erro de conexão. Verifique sua internet e tente novamente.'
          }

          Alert.alert('Acesso Negado', errorMessage, [
            {
              text: 'OK',
              style: 'default',
            },
            {
              text: 'Fazer Login',
              style: 'default',
              onPress: () => router.replace('/(auth)/login'),
            },
          ])
        }, 1500)
      }
    } catch (error) {
      console.error('❌ Erro na ativação do modo secreto:', error)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

      setTimeout(() => {
        setIsSecretModeVisible(false)
        Alert.alert(
          'Erro Inesperado',
          'Ocorreu um erro inesperado. Tente novamente mais tarde.',
          [{ text: 'OK' }],
        )
      }, 1500)
    }
  }

  const handleGestureProgress = (progress: number) => {
    setGestureProgress(progress)
    if (progress > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const handleEmergencyActivation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    // Ativação direta do SOS sem sair do modo disfarçado
    Alert.alert('Emergência', 'Função de emergência ativada silenciosamente', [
      { text: 'OK' },
    ])
  }

  const renderRecipeCard = (recipe: Recipe) => (
    <TouchableOpacity
      key={recipe.id}
      style={createStyles(colors).recipeCard}
      onPress={() => setSelectedRecipe(recipe)}
    >
      <View style={createStyles(colors).recipeImageContainer}>
        <Text style={createStyles(colors).recipeEmoji}>{recipe.image}</Text>
      </View>
      <View style={createStyles(colors).recipeInfo}>
        <Text style={createStyles(colors).recipeTitle}>{recipe.title}</Text>
        <Text style={createStyles(colors).recipeDescription}>
          {recipe.description}
        </Text>
        <View style={createStyles(colors).recipeDetails}>
          <View style={createStyles(colors).detailItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={createStyles(colors).detailText}>{recipe.time}</Text>
          </View>
          <View style={createStyles(colors).detailItem}>
            <MaterialCommunityIcons
              name="chef-hat"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={createStyles(colors).detailText}>
              {recipe.difficulty}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderRecipeDetail = (recipe: Recipe) => (
    <ScrollView style={createStyles(colors).detailContainer}>
      <TouchableOpacity
        style={createStyles(colors).backButton}
        onPress={() => setSelectedRecipe(null)}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.textPrimary}
        />
        <Text style={createStyles(colors).backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={createStyles(colors).detailHeader}>
        <Text style={createStyles(colors).detailEmoji}>{recipe.image}</Text>
        <Text style={createStyles(colors).detailTitle}>{recipe.title}</Text>
        <Text style={createStyles(colors).detailDescription}>
          {recipe.description}
        </Text>

        <View style={createStyles(colors).detailMeta}>
          <View style={createStyles(colors).metaItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={createStyles(colors).metaText}>{recipe.time}</Text>
          </View>
          <View style={createStyles(colors).metaItem}>
            <MaterialCommunityIcons
              name="chef-hat"
              size={20}
              color={colors.primary}
            />
            <Text style={createStyles(colors).metaText}>
              {recipe.difficulty}
            </Text>
          </View>
        </View>
      </View>

      <View style={createStyles(colors).section}>
        <Text style={createStyles(colors).sectionTitle}>Ingredientes</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={createStyles(colors).ingredientItem}>
            <Text style={createStyles(colors).bullet}>•</Text>
            <Text style={createStyles(colors).ingredientText}>
              {ingredient}
            </Text>
          </View>
        ))}
      </View>

      <View style={createStyles(colors).section}>
        <Text style={createStyles(colors).sectionTitle}>Modo de Preparo</Text>
        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={createStyles(colors).instructionItem}>
            <View style={createStyles(colors).stepNumber}>
              <Text style={createStyles(colors).stepText}>{index + 1}</Text>
            </View>
            <Text style={createStyles(colors).instructionText}>
              {instruction}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  )

  if (selectedRecipe) {
    return (
      <View style={createStyles(colors).container}>
        <StatusBar
          barStyle={
            colors.textPrimary === '#F5F5F5' ? 'light-content' : 'dark-content'
          }
          backgroundColor={colors.background}
        />
        {renderRecipeDetail(selectedRecipe)}
      </View>
    )
  }

  return (
    <View style={createStyles(colors).container}>
      <StatusBar
        barStyle={
          colors.textPrimary === '#F5F5F5' ? 'light-content' : 'dark-content'
        }
        backgroundColor={colors.background}
      />

      {/* Header com gesto secreto melhorado */}
      <SecretGestureDetector
        onSecretActivated={handleSecretActivation}
        onGestureProgress={handleGestureProgress}
        style={createStyles(colors).header}
        requiredTaps={3}
        timeWindow={2000}
        tapSequence="same-area"
      >
        <Text style={createStyles(colors).headerTitle}>Dicas de Culinária</Text>
        <Text style={createStyles(colors).headerSubtitle}>
          Receitas deliciosas para o dia a dia
        </Text>
        <MaterialCommunityIcons
          name="chef-hat"
          size={32}
          color={colors.primary}
        />

        {/* Indicador de progresso do gesto */}
        {gestureProgress > 0 && (
          <View style={createStyles(colors).gestureProgressContainer}>
            <Animated.View
              style={[
                createStyles(colors).gestureProgressBar,
                {
                  width: progressBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
      </SecretGestureDetector>

      {/* Lista de receitas */}
      <ScrollView
        style={createStyles(colors).content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={createStyles(colors).sectionHeader}>
          Receitas Populares
        </Text>
        {mockRecipes.map(renderRecipeCard)}

        {/* Seção de Emergência Disfarçada */}
        <View style={createStyles(colors).favoritesSection}>
          <Text style={createStyles(colors).favoritesTitle}>
            ⭐ Receitas Favoritas
          </Text>
          <TouchableOpacity
            style={createStyles(colors).emergencyButton}
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
            <MaterialCommunityIcons
              name="heart"
              size={24}
              color={colors.primary}
            />
            <Text style={createStyles(colors).emergencyButtonText}>
              Minhas Receitas Especiais
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Overlay de Modo Secreto Melhorado */}
      {isSecretModeVisible && (
        <View style={createStyles(colors).secretModeOverlay}>
          <View style={createStyles(colors).secretModeCard}>
            {isAuthenticating ? (
              <>
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ marginBottom: 16 }}
                />
                <Text style={createStyles(colors).secretModeTitle}>
                  Verificando Acesso
                </Text>
                <Text style={createStyles(colors).secretModeSubtitle}>
                  {authMessage || 'Aguarde...'}
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={48}
                  color={colors.success}
                />
                <Text style={createStyles(colors).secretModeTitle}>
                  Modo Seguro Ativado
                </Text>
                <Text style={createStyles(colors).secretModeSubtitle}>
                  Redirecionando...
                </Text>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
      elevation: 3,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
    },
    gestureProgressContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: colors.outline,
    },
    gestureProgressBar: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 24,
      marginBottom: 18,
      letterSpacing: 0.3,
    },
    recipeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      padding: 18,
      flexDirection: 'row',
      elevation: 4,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    recipeImageContainer: {
      width: 85,
      height: 85,
      backgroundColor: colors.primary + '20',
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
      color: colors.textPrimary,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    recipeDescription: {
      fontSize: 15,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
      fontWeight: '500',
    },
    detailContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
      paddingTop: 60,
      backgroundColor: colors.surface,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    backText: {
      fontSize: 17,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    detailHeader: {
      backgroundColor: colors.surface,
      padding: 24,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    detailEmoji: {
      fontSize: 64,
      marginBottom: 18,
    },
    detailTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 10,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    detailDescription: {
      fontSize: 17,
      color: colors.textSecondary,
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
      color: colors.textPrimary,
      fontWeight: '600',
    },
    section: {
      backgroundColor: colors.surface,
      margin: 16,
      padding: 24,
      borderRadius: 16,
      elevation: 3,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
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
      color: colors.primary,
      marginRight: 14,
      marginTop: 2,
    },
    ingredientText: {
      fontSize: 16,
      color: colors.textPrimary,
      flex: 1,
      lineHeight: 24,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    stepNumber: {
      width: 28,
      height: 28,
      backgroundColor: colors.primary,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      marginTop: 2,
    },
    stepText: {
      fontSize: 13,
      color: colors.onPrimary,
      fontWeight: '700',
    },
    instructionText: {
      fontSize: 16,
      color: colors.textPrimary,
      flex: 1,
      lineHeight: 24,
      fontWeight: '500',
    },
    footer: {
      backgroundColor: colors.primary + '10',
      marginHorizontal: 0,
      marginTop: 24,
      marginBottom: 32,
      padding: 20,
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    footerText: {
      fontSize: 15,
      color: colors.primary,
      lineHeight: 22,
      textAlign: 'center',
      fontWeight: '500',
    },
    favoritesSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 0,
      marginTop: 24,
      marginBottom: 32,
      padding: 24,
      borderRadius: 16,
      elevation: 3,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    favoritesTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 18,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    emergencyButton: {
      backgroundColor: colors.primary + '20',
      borderWidth: 2,
      borderColor: colors.primary + '50',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    emergencyButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 10,
      letterSpacing: 0.2,
    },
    emergencySubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
      textAlign: 'center',
      lineHeight: 18,
    },
    secretModeOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.primary + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    secretModeCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 36,
      alignItems: 'center',
      maxWidth: 300,
      elevation: 10,
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    secretModeTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 18,
      marginBottom: 10,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    secretModeSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
  })

export default DisguisedRecipeScreen

/**
 * INTEGRAÇÃO COM O SISTEMA DE AUTENTICAÇÃO
 *
 * Para que o login silencioso funcione corretamente, as seguintes funções
 * devem ser chamadas nos momentos apropriados do ciclo de vida do app:
 *
 * 1. saveLoginCredentials() - Chamar após login manual bem-sucedido
 *    Exemplo: Na tela de login (/app/(auth)/login.tsx)
 *
 * 2. clearStoredCredentials() - Chamar durante logout
 *    Exemplo: Na função de logout do contexto de autenticação
 *
 * 3. silentLoginIfNeeded() - Já está integrada no handleSecretActivation()
 *    Será executada automaticamente quando o gesto secreto for detectado
 *
 * FLUXO DE FUNCIONAMENTO:
 * - Usuária faz login manual pela primeira vez → credenciais são salvas
 * - Usuária ativa modo disfarçado → gesto secreto → login silencioso
 * - Se último login < 24h → acesso direto sem reautenticação
 * - Se último login > 24h → reautenticação automática via credenciais salvas
 * - Se credenciais inválidas → erro e permanência no modo disfarçado
 */
