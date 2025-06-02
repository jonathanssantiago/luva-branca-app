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
    id: '1',
    nome: 'Delegacia Especializada da Mulher',
    tipo: 'delegacia',
    endereco: 'Rua Central, 123 - Centro',
    telefone: '(11) 3333-4444',
    distancia: '1.2 km',
    horarioFuncionamento: '24 horas',
    descricao: 'Atendimento especializado para crimes contra a mulher',
  },
  {
    id: '2',
    nome: 'Casa de Acolhimento Esperança',
    tipo: 'casa_acolhimento',
    endereco: 'Av. Paz, 456 - Bela Vista',
    telefone: '(11) 2222-3333',
    distancia: '2.5 km',
    horarioFuncionamento: '24 horas',
    descricao: 'Abrigo temporário para mulheres em situação de risco',
  },
  {
    id: '3',
    nome: 'Hospital Municipal - Emergência',
    tipo: 'hospital',
    endereco: 'Rua Saúde, 789 - Vila Nova',
    telefone: '(11) 1111-2222',
    distancia: '3.1 km',
    horarioFuncionamento: '24 horas',
    descricao: 'Atendimento médico de emergência',
  },
  {
    id: '4',
    nome: 'Centro de Referência da Mulher',
    tipo: 'centro_referencia',
    endereco: 'Praça da Cidadania, 100 - Centro',
    telefone: '(11) 4444-5555',
    distancia: '1.8 km',
    horarioFuncionamento: '8h às 18h (seg-sex)',
    descricao: 'Orientação jurídica e psicológica gratuita',
  },
  {
    id: '5',
    nome: 'ONG Mulheres Unidas',
    tipo: 'ong',
    endereco: 'Rua Solidariedade, 321 - Jardim',
    telefone: '(11) 5555-6666',
    distancia: '4.2 km',
    horarioFuncionamento: '9h às 17h (seg-sex)',
    descricao: 'Apoio psicológico e social para mulheres',
  },
]

const Apoio = () => {
  const theme = useTheme()
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

  const buscarLocais = async () => {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setSnackbar(Locales.t('apoio.permissaoNegada'))
        setCarregando(false)
        return
      }
      // Simular busca com dados estáticos
      setLocais(LOCAIS_FIXOS)
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
  type TipoFiltro = typeof tipos[number]

  return (
    <View style={apoioStyles.container}>
      <CustomHeader
        title="Apoio e Recursos"
        iconColor="#666666"
        rightIcon="menu"
      />

      <ScreenContainer 
        scrollable 
        contentStyle={apoioStyles.content}
        keyboardAvoidingView={true}
      >
        {/* Barra de pesquisa */}
        <Searchbar
          placeholder="Buscar locais de apoio..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={apoioStyles.searchbar}
          iconColor="#666666"
          inputStyle={apoioStyles.searchInput}
        />

        {/* Filtros */}
        <View style={apoioStyles.filtros}>
          <Chip
            selected={filtroAtual === 'todos'}
            onPress={() => setFiltroAtual('todos')}
            style={[
              apoioStyles.filtroChip,
              filtroAtual === 'todos' && apoioStyles.filtroChipAtivo,
            ]}
            textStyle={[
              apoioStyles.filtroChipTexto,
              filtroAtual === 'todos' && apoioStyles.filtroChipTextoAtivo,
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
                filtroAtual === tipo && apoioStyles.filtroChipAtivo,
                { backgroundColor: getCorPorTipo(tipo) + '20', borderColor: getCorPorTipo(tipo), borderWidth: filtroAtual === tipo ? 2 : 0 },
              ]}
              textStyle={[
                apoioStyles.filtroChipTexto,
                filtroAtual === tipo && apoioStyles.filtroChipTextoAtivo,
                { color: getCorPorTipo(tipo), fontWeight: filtroAtual === tipo ? 'bold' : 'normal' },
              ]}
              icon={getIconePorTipo(tipo)}
            >
              {getNomeTipo(tipo)}
            </Chip>
          ))}
        </View>

        {loading ? (
          <View style={apoioStyles.loadingContainer}>
            {[1,2,3].map((_,i) => (
              <View key={i} style={[apoioStyles.localCard, {height: 120, marginBottom: 20, backgroundColor: '#ececec', borderColor: '#eee', borderWidth: 1, justifyContent: 'center', alignItems: 'center'}]}>
                <View style={{width: '60%', height: 20, backgroundColor: '#ddd', borderRadius: 8, marginBottom: 10}} />
                <View style={{width: '40%', height: 14, backgroundColor: '#e0e0e0', borderRadius: 8}} />
              </View>
            ))}
            <Text style={apoioStyles.loadingText}>Carregando locais...</Text>
          </View>
        ) : (
          <FlatList
            data={locaisFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={[apoioStyles.localCard, { borderLeftWidth: 5, borderLeftColor: getCorPorTipo(item.tipo), shadowColor: getCorPorTipo(item.tipo) }]}> 
                <Card.Content style={{padding: 12}}>
                  <View style={apoioStyles.localHeader}>
                    <View style={apoioStyles.localInfo}>
                      <Text style={apoioStyles.localNome}>{item.nome}</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                        <Chip
                          style={[
                            apoioStyles.tipoChip,
                            { backgroundColor: getCorPorTipo(item.tipo) + '20', marginRight: 8 }
                          ]}
                          textStyle={{ color: getCorPorTipo(item.tipo), fontWeight: 'bold' }}
                          icon={getIconePorTipo(item.tipo)}
                        >
                          {getNomeTipo(item.tipo)}
                        </Chip>
                        <View style={apoioStyles.distanciaBadge}>
                          <MaterialCommunityIcons name="map-marker-distance" size={16} color="#fff" />
                          <Text style={apoioStyles.distanciaBadgeText}>{item.distancia}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text style={apoioStyles.descricao}>{item.descricao}</Text>
                  <View style={apoioStyles.detalhes}>
                    <View style={apoioStyles.detalheItem}>
                      <MaterialCommunityIcons name="map-marker" size={20} color="#222" />
                      <Text style={apoioStyles.detalheTexto}>{item.endereco}</Text>
                    </View>
                    {item.telefone && (
                      <View style={apoioStyles.detalheItem}>
                        <MaterialCommunityIcons name="phone" size={20} color="#222" />
                        <Text style={apoioStyles.detalheTexto}>{item.telefone}</Text>
                      </View>
                    )}
                    {item.horarioFuncionamento && (
                      <View style={apoioStyles.detalheItem}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#222" />
                        <Text style={apoioStyles.detalheTexto}>{item.horarioFuncionamento}</Text>
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
                          { backgroundColor: getCorPorTipo(item.tipo), minHeight: 48, borderRadius: 10 }
                        ]}
                        icon={({size, color}) => <MaterialCommunityIcons name="phone" size={28} color="#fff" />}
                        labelStyle={{fontSize: 18, fontWeight: 'bold', color: '#fff'}}
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
                        { borderColor: getCorPorTipo(item.tipo), minHeight: 48, borderRadius: 10 }
                      ]}
                      icon={({size, color}) => <MaterialCommunityIcons name="map-marker" size={28} color={getCorPorTipo(item.tipo)} />}
                      labelStyle={{fontSize: 18, fontWeight: 'bold', color: getCorPorTipo(item.tipo)}}
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
                  color="#CCCCCC"
                />
                <Text style={apoioStyles.emptyText}>
                  Nenhum local encontrado
                </Text>
                <Text style={apoioStyles.emptySubtext}>
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
    backgroundColor: '#F9F9F9',
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    color: '#666666',
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
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
  filtroChipAtivo: {
    backgroundColor: '#7b1fa2',
  },
  filtroChipTexto: {
    fontSize: 12,
  },
  filtroChipTextoAtivo: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  localCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
    color: '#666666',
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
    color: '#666666',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    color: '#999999',
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
    color: '#666666',
  },
  searchInput: {
    fontSize: 14,
  },
  distanciaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  distanciaBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
})

export default Apoio

