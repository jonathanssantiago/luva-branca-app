import React, { useEffect, useState } from 'react'
import {
  Surface,
  Text,
  List,
  Snackbar,
  Button,
  Card,
  Chip,
  IconButton,
  Searchbar,
  FAB,
  useTheme,
} from 'react-native-paper'
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { Locales } from '@/lib'
import { ScreenContainer, CustomHeader } from '@/src/components/ui'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'
import haversine from 'haversine-distance'

const { width } = Dimensions.get('window')

interface LocalApoio {
  id: string
  nome: string
  tipo:
    | 'delegacia'
    | 'casa_acolhimento'
    | 'hospital'
    | 'ong'
    | 'centro_referencia'
  endereco: string
  telefone?: string
  distancia: string
  horarioFuncionamento?: string
  descricao?: string
  coordenadas?: {
    latitude: number
    longitude: number
  }
}

// Dados expandidos para demonstração
const LOCAIS_FIXOS: LocalApoio[] = [
  {
    id: 'manaus-1',
    nome: 'Delegacia Especializada em Crimes Contra a Mulher (DECCM)',
    tipo: 'delegacia',
    endereco: 'Av. Mário Ypiranga, 3395 - Parque 10 de Novembro, Manaus - AM',
    telefone: '(92) 3214-2268',
    distancia: '2.1 km',
    horarioFuncionamento: '24 horas',
    descricao:
      'Atendimento especializado para mulheres vítimas de violência em Manaus',
    coordenadas: { latitude: -3.101944, longitude: -60.014167 },
  },
  {
    id: 'manaus-2',
    nome: 'Casa Abrigo Antônia Nascimento Priante',
    tipo: 'casa_acolhimento',
    endereco: 'Endereço confidencial - Manaus/AM',
    telefone: '',
    distancia: '---',
    horarioFuncionamento: '24 horas',
    descricao: 'Abrigo temporário para mulheres em situação de risco em Manaus',
    coordenadas: undefined, // endereço confidencial
  },
  {
    id: 'manaus-3',
    nome: 'Hospital e Pronto-Socorro 28 de Agosto',
    tipo: 'hospital',
    endereco: 'Av. Mário Ypiranga, 1581 - Adrianópolis, Manaus - AM',
    telefone: '(92) 3641-6161',
    distancia: '',
    horarioFuncionamento: '24 horas',
    descricao: 'Atendimento médico de emergência em Manaus',
    coordenadas: { latitude: -3.101111, longitude: -60.011944 },
  },
  {
    id: 'manaus-4',
    nome: 'Centro de Referência dos Direitos da Mulher - CRDM',
    tipo: 'centro_referencia',
    endereco: 'Rua Ramos Ferreira, 1576 - Centro, Manaus - AM',
    telefone: '(92) 3633-0656',
    distancia: '1.7 km',
    horarioFuncionamento: '8h às 17h (seg-sex)',
    descricao:
      'Atendimento psicológico, social e jurídico gratuito para mulheres',
    coordenadas: { latitude: -3.131944, longitude: -60.023056 },
  },
  {
    id: 'manaus-5',
    nome: 'ONG Mulheres Unidas do Amazonas',
    tipo: 'ong',
    endereco: 'Rua das Flores, 100 - Centro, Manaus - AM',
    telefone: '(92) 99999-8888',
    distancia: '2.8 km',
    horarioFuncionamento: '9h às 17h (seg-sex)',
    descricao: 'Apoio social e psicológico para mulheres em Manaus',
    coordenadas: { latitude: -3.133333, longitude: -60.017222 },
  },
]

const Apoio = () => {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const [locais, setLocais] = useState<LocalApoio[]>([])
  const [locaisFiltrados, setLocaisFiltrados] = useState<LocalApoio[]>([])
  const [snackbar, setSnackbar] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroAtual, setFiltroAtual] = useState<TipoFiltro>('todos')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    buscarLocais()
  }, [])

  useEffect(() => {
    let resultado = locais
    if (searchQuery) {
      resultado = resultado.filter(
        (local) =>
          local.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          local.endereco.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }
    if (filtroAtual !== 'todos') {
      resultado = resultado.filter((local) => local.tipo === filtroAtual)
    }
    setLocaisFiltrados(resultado)
  }, [locais, searchQuery, filtroAtual])

  const calcularDistancia = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): string => {
    const a = { latitude: lat1, longitude: lon1 }
    const b = { latitude: lat2, longitude: lon2 }
    const metros = haversine(a, b)
    if (metros < 1000) return `${Math.round(metros)} m`
    return `${(metros / 1000).toFixed(1)} km`
  }

  const buscarLocais = async () => {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setSnackbar(Locales.t('apoio.permissaoNegada'))
        setCarregando(false)
        return
      }
      const pos = await Location.getCurrentPositionAsync({})
      const userLat = pos.coords.latitude
      const userLon = pos.coords.longitude
      // Adiciona distância calculada para cada local que tem coordenadas
      const locaisComDistancia = LOCAIS_FIXOS.map((local) => {
        if (local.coordenadas) {
          return {
            ...local,
            distancia: calcularDistancia(
              userLat,
              userLon,
              local.coordenadas.latitude,
              local.coordenadas.longitude,
            ),
          }
        }
        return local
      })
      setLocais(locaisComDistancia)
      setSnackbar('Locais atualizados com sucesso')
    } catch {
      setSnackbar(Locales.t('apoio.erroBuscar'))
    }
    setLoading(false)
  }

  const ligarPara = (telefone: string, nome: string) => {
    Alert.alert('Ligar para ' + nome, `Deseja ligar para ${telefone}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ligar',
        onPress: () => Linking.openURL(`tel:${telefone}`),
      },
    ])
  }

  const abrirMapa = (local: LocalApoio) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      local.endereco,
    )}`
    Linking.openURL(url)
  }

  const tiposDisponiveis = [
    'delegacia',
    'casa_acolhimento',
    'hospital',
    'ong',
    'centro_referencia',
  ] as const

  const getCorPorTipo = (tipo: LocalApoio['tipo']): string => {
    switch (tipo) {
      case 'delegacia':
        return '#EA5455' // Vermelho
      case 'casa_acolhimento':
        return '#7b1fa2' // Roxo
      case 'hospital':
        return '#28C76F' // Verde
      case 'ong':
        return '#FF9F43' // Laranja
      case 'centro_referencia':
        return '#1976d2' // Azul
      default:
        return '#666666' // Cinza
    }
  }

  const getIconePorTipo = (tipo: LocalApoio['tipo']): string => {
    switch (tipo) {
      case 'delegacia':
        return 'police-badge'
      case 'casa_acolhimento':
        return 'home-heart'
      case 'hospital':
        return 'hospital-box'
      case 'ong':
        return 'account-group'
      case 'centro_referencia':
        return 'account-tie'
      default:
        return 'map-marker-question'
    }
  }

  const getNomeTipo = (tipo: LocalApoio['tipo']): string => {
    switch (tipo) {
      case 'delegacia':
        return 'Delegacia'
      case 'casa_acolhimento':
        return 'Casa de Acolhimento'
      case 'hospital':
        return 'Hospital'
      case 'ong':
        return 'ONG'
      case 'centro_referencia':
        return 'Centro de Referência'
      default:
        return 'Outro'
    }
  }

  const tipos = ['todos', ...tiposDisponiveis] as const
  type TipoFiltro = (typeof tipos)[number]

  return (
    <View
      style={[apoioStyles.container, { backgroundColor: colors.background }]}
    >
      <CustomHeader title="Apoio e Recursos" rightIcon="menu" />

      <ScreenContainer
        scrollable
        contentStyle={{ ...apoioStyles.content }}
        keyboardAvoiding={true}
      >
        {/* Barra de pesquisa */}
        <Searchbar
          placeholder="Buscar locais de apoio..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[apoioStyles.searchbar, { backgroundColor: colors.surface }]}
          iconColor={colors.iconSecondary}
          placeholderTextColor={colors.placeholder}
        />

        {/* Filtros */}
        <View style={apoioStyles.filtros}>
          <Chip
            selected={filtroAtual === 'todos'}
            onPress={() => setFiltroAtual('todos')}
            style={[
              apoioStyles.filtroChip,
              filtroAtual === 'todos' && {
                backgroundColor: colors.primary + '20',
              },
            ]}
            textStyle={[
              apoioStyles.filtroChipTexto,
              {
                color:
                  filtroAtual === 'todos'
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}
            icon="format-list-bulleted"
          >
            Todos
          </Chip>
          {tiposDisponiveis.map((tipo) => (
            <Chip
              key={tipo}
              selected={filtroAtual === tipo}
              onPress={() => setFiltroAtual(tipo)}
              style={[
                apoioStyles.filtroChip,
                {
                  backgroundColor: getCorPorTipo(tipo) + '20',
                  borderColor: getCorPorTipo(tipo),
                  borderWidth: filtroAtual === tipo ? 2 : 0,
                },
              ]}
              textStyle={[
                apoioStyles.filtroChipTexto,
                {
                  color: getCorPorTipo(tipo),
                  fontWeight: filtroAtual === tipo ? 'bold' : 'normal',
                },
              ]}
              icon={getIconePorTipo(tipo)}
            >
              {getNomeTipo(tipo)}
            </Chip>
          ))}
        </View>

        {loading ? (
          <View style={apoioStyles.loadingContainer}>
            {[1, 2, 3].map((_, i) => (
              <View
                key={i}
                style={[
                  apoioStyles.localCard,
                  {
                    height: 120,
                    marginBottom: 20,
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                    borderWidth: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <View
                  style={{
                    width: '60%',
                    height: 20,
                    backgroundColor: colors.outline,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                />
                <View
                  style={{
                    width: '40%',
                    height: 14,
                    backgroundColor: colors.outline,
                    borderRadius: 8,
                  }}
                />
              </View>
            ))}
            <Text
              style={[apoioStyles.loadingText, { color: colors.textSecondary }]}
            >
              Carregando locais...
            </Text>
          </View>
        ) : (
          <FlatList
            data={locaisFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card
                style={[
                  apoioStyles.localCard,
                  {
                    borderLeftWidth: 5,
                    borderLeftColor: getCorPorTipo(item.tipo),
                    shadowColor: getCorPorTipo(item.tipo),
                    backgroundColor: colors.surface,
                    borderColor: colors.outline + '30',
                    borderWidth: 1,
                  },
                ]}
              >
                <Card.Content style={{ padding: 12 }}>
                  <View style={apoioStyles.localHeader}>
                    <View style={apoioStyles.localInfo}>
                      <Text
                        style={[
                          apoioStyles.localNome,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {item.nome}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 4,
                        }}
                      >
                        <Chip
                          style={[
                            apoioStyles.tipoChip,
                            {
                              backgroundColor: getCorPorTipo(item.tipo) + '20',
                              marginRight: 8,
                            },
                          ]}
                          textStyle={{
                            color: getCorPorTipo(item.tipo),
                            fontWeight: 'bold',
                          }}
                          icon={getIconePorTipo(item.tipo)}
                        >
                          {getNomeTipo(item.tipo)}
                        </Chip>
                        <View
                          style={[
                            apoioStyles.distanciaBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="map-marker-distance"
                            size={16}
                            color={colors.onPrimary}
                          />
                          <Text
                            style={[
                              apoioStyles.distanciaBadgeText,
                              { color: colors.onPrimary },
                            ]}
                          >
                            {item.distancia}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text
                    style={[
                      apoioStyles.descricao,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.descricao}
                  </Text>
                  <View style={apoioStyles.detalhes}>
                    <View style={apoioStyles.detalheItem}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={20}
                        color={colors.iconSecondary}
                      />
                      <Text
                        style={[
                          apoioStyles.detalheTexto,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {item.endereco}
                      </Text>
                    </View>
                    {item.telefone && (
                      <View style={apoioStyles.detalheItem}>
                        <MaterialCommunityIcons
                          name="phone"
                          size={20}
                          color={colors.iconSecondary}
                        />
                        <Text
                          style={[
                            apoioStyles.detalheTexto,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {item.telefone}
                        </Text>
                      </View>
                    )}
                    {item.horarioFuncionamento && (
                      <View style={apoioStyles.detalheItem}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={20}
                          color={colors.iconSecondary}
                        />
                        <Text
                          style={[
                            apoioStyles.detalheTexto,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {item.horarioFuncionamento}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={apoioStyles.acoes}>
                    {item.telefone && (
                      <Button
                        mode="contained"
                        onPress={() => Linking.openURL(`tel:${item.telefone}`)}
                        style={[
                          apoioStyles.botaoAcao,
                          {
                            backgroundColor: getCorPorTipo(item.tipo),
                            minHeight: 48,
                            borderRadius: 10,
                          },
                        ]}
                        icon={({ size, color }) => (
                          <MaterialCommunityIcons
                            name="phone"
                            size={28}
                            color={colors.onPrimary}
                          />
                        )}
                        labelStyle={{
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: colors.onPrimary,
                        }}
                        accessibilityLabel={`Ligar para ${item.nome}`}
                      >
                        Ligar
                      </Button>
                    )}
                    <Button
                      mode="outlined"
                      onPress={() => abrirMapa(item)}
                      style={[
                        apoioStyles.botaoAcao,
                        {
                          borderColor: getCorPorTipo(item.tipo),
                          minHeight: 48,
                          borderRadius: 10,
                        },
                      ]}
                      icon={({ size, color }) => (
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={28}
                          color={getCorPorTipo(item.tipo)}
                        />
                      )}
                      labelStyle={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: getCorPorTipo(item.tipo),
                      }}
                      accessibilityLabel={`Ver ${item.nome} no mapa`}
                    >
                      Ver no Mapa
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}
            ListEmptyComponent={
              <View style={apoioStyles.emptyContainer}>
                <MaterialCommunityIcons
                  name="map-search"
                  size={64}
                  color={colors.iconSecondary}
                />
                <Text
                  style={[apoioStyles.emptyText, { color: colors.textPrimary }]}
                >
                  Nenhum local encontrado
                </Text>
                <Text
                  style={[
                    apoioStyles.emptySubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Tente ajustar os filtros ou a busca
                </Text>
              </View>
            }
            contentContainerStyle={
              locaisFiltrados.length === 0 ? { flex: 1 } : undefined
            }
          />
        )}
      </ScreenContainer>
    </View>
  )
}

const apoioStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  filtroChip: {
    marginBottom: 8,
  },
  filtroChipAtivo: {},
  filtroChipTexto: {
    fontSize: 12,
  },
  filtroChipTextoAtivo: {},
  list: {
    flex: 1,
  },
  localCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  localHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  localInfo: {
    flex: 1,
  },
  localNome: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
  tipoChip: {
    alignSelf: 'flex-start',
  },
  descricao: {
    marginTop: 12,
    marginBottom: 16,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
  },
  detalhes: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  detalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 0,
    marginBottom: 4,
  },
  detalheTexto: {
    flex: 1,
    fontSize: 14,
  },
  acoes: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoAcao: {
    flex: 1,
    minHeight: 44,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  searchInput: {
    fontSize: 14,
  },
  distanciaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
  },
  distanciaBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
})

export default Apoio
