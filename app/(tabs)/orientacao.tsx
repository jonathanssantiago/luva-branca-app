import React, { useState, useEffect } from 'react'
import {
  Surface,
  Text,
  List,
  Searchbar,
  ActivityIndicator,
  Card,
  Chip,
  Button,
  Divider,
} from 'react-native-paper'
import {
  FlatList,
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Locales } from '@/lib'
import { ScreenContainer, CustomHeader } from '@/src/components/ui'
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

const { width } = Dimensions.get('window')

interface Orientacao {
  id: string
  categoria:
    | 'juridico'
    | 'emergencia'
    | 'prevencao'
    | 'psicologico'
    | 'recursos'
  pergunta: string
  resposta: string
  relevancia: 'alta' | 'media' | 'baixa'
  tags: string[]
}

// Dados expandidos e organizados por categoria
const ORIENTACOES: Orientacao[] = [
  // Jurídico
  {
    id: '1',
    categoria: 'juridico',
    pergunta: 'Como solicitar uma medida protetiva de urgência?',
    resposta:
      'A medida protetiva pode ser solicitada em qualquer delegacia, mesmo que não seja especializada. Você pode ir acompanhada de advogado, mas não é obrigatório. O pedido é gratuito e deve ser analisado pelo juiz em até 48 horas. É importante levar documentos pessoais, boletim de ocorrência (se houver) e qualquer prova da violência (fotos, laudos médicos, áudios, etc.).',
    relevancia: 'alta',
    tags: ['medida protetiva', 'lei maria da penha', 'delegacia', 'justiça'],
  },
  {
    id: '2',
    categoria: 'juridico',
    pergunta: 'Quais são meus direitos segundo a Lei Maria da Penha?',
    resposta:
      'A Lei 11.340/2006 garante diversos direitos: atendimento humanizado pela polícia e judiciário, medidas protetivas, assistência social e jurídica gratuita, prioridade na tramitação processual, sigilo dos dados pessoais, encaminhamento a programa oficial de proteção, e acesso a serviços de contracepção de emergência e profilaxia DST/HIV.',
    relevancia: 'alta',
    tags: ['lei maria da penha', 'direitos', 'violência doméstica'],
  },
  {
    id: '3',
    categoria: 'juridico',
    pergunta: 'Posso denunciar sem testemunhas?',
    resposta:
      'Sim. Sua palavra tem valor legal e a ausência de testemunhas não impede a denúncia. O relato da vítima é considerado meio de prova. Busque preservar evidências como fotos de lesões, áudios, mensagens, laudos médicos, e procure ajuda profissional para fortalecer o caso.',
    relevancia: 'alta',
    tags: ['denúncia', 'testemunhas', 'prova', 'evidência'],
  },

  // Emergência
  {
    id: '4',
    categoria: 'emergencia',
    pergunta: 'Quando e como acionar a polícia?',
    resposta:
      'Acione imediatamente através do 190 ou 180 se estiver em situação de perigo iminente. Mantenha o telefone em local acessível, tenha um plano de fuga, identifique vizinhos de confiança e mantenha documentos importantes sempre à mão. Em casos menos urgentes, procure a delegacia mais próxima.',
    relevancia: 'alta',
    tags: ['190', '180', 'emergência', 'polícia', 'perigo'],
  },
  {
    id: '5',
    categoria: 'emergencia',
    pergunta: 'Como me proteger durante uma discussão que pode escalar?',
    resposta:
      'Mantenha a calma, não contrarie excessivamente, fique próxima de saídas, evite cômodos com objetos que possam ser usados como arma (cozinha, garagem), proteja cabeça e rosto se houver agressão, grite por ajuda e saia do local assim que possível. Tenha sempre um plano de escape.',
    relevancia: 'alta',
    tags: ['proteção', 'plano de fuga', 'segurança', 'discussão'],
  },

  // Prevenção
  {
    id: '6',
    categoria: 'prevencao',
    pergunta: 'Como identificar sinais de um relacionamento abusivo?',
    resposta:
      'Fique atenta a: controle excessivo (roupas, amizades, trabalho), isolamento social, ciúmes possessivos, chantagens emocionais, desvalorização constante, controle financeiro, ameaças, agressões verbais que evoluem para físicas, monitoramento de redes sociais e localização.',
    relevancia: 'alta',
    tags: ['relacionamento abusivo', 'sinais', 'controle', 'ciúmes'],
  },
  {
    id: '7',
    categoria: 'prevencao',
    pergunta: 'Como criar uma rede de apoio segura?',
    resposta:
      'Mantenha contato com familiares e amigos de confiança, compartilhe sua situação com pessoas próximas, tenha sempre uma alternativa de moradia temporária, mantenha uma reserva financeira de emergência, e cadastre contatos de confiança em aplicativos de segurança.',
    relevancia: 'media',
    tags: ['rede de apoio', 'família', 'amigos', 'segurança'],
  },

  // Psicológico
  {
    id: '8',
    categoria: 'psicologico',
    pergunta: 'Como lidar com o trauma após a violência?',
    resposta:
      'Busque ajuda psicológica especializada, não se culpe pela violência sofrida, mantenha rotinas saudáveis, pratique autocuidado, conte com sua rede de apoio, considere grupos de apoio com outras mulheres, e lembre-se que a recuperação é um processo gradual.',
    relevancia: 'alta',
    tags: ['trauma', 'psicologia', 'autocuidado', 'recuperação'],
  },
  {
    id: '9',
    categoria: 'psicologico',
    pergunta: 'É normal sentir medo de denunciar?',
    resposta:
      'Sim, é completamente normal. O medo de retaliação, de não ser acreditada, ou de mudanças na vida são sentimentos comuns. Lembre-se: você não está sozinha, existem leis de proteção, profissionais capacitados para ajudar, e a denúncia é um direito seu.',
    relevancia: 'alta',
    tags: ['medo', 'denúncia', 'normal', 'proteção'],
  },

  // Recursos
  {
    id: '10',
    categoria: 'recursos',
    pergunta: 'Onde buscar ajuda gratuita?',
    resposta:
      'Central de Atendimento à Mulher (180), Defensoria Pública, CRAS/CREAS, Centros de Referência da Mulher, ONGs especializadas, Casas-Abrigo, serviços de psicologia em universidades, e postos de saúde com atendimento especializado.',
    relevancia: 'alta',
    tags: ['ajuda gratuita', '180', 'defensoria', 'cras', 'ongs'],
  },
]

const Orientacao = () => {
  const colors = useThemeExtendedColors()
  
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null)
  const [orientacoesFiltradas, setOrientacoesFiltradas] =
    useState<Orientacao[]>(ORIENTACOES)

  useEffect(() => {
    filtrarOrientacoes()
  }, [busca, categoriaFiltro])

  const filtrarOrientacoes = () => {
    let resultado = ORIENTACOES

    if (busca.trim()) {
      resultado = resultado.filter(
        (orientacao) =>
          orientacao.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
          orientacao.resposta.toLowerCase().includes(busca.toLowerCase()) ||
          orientacao.tags.some((tag) =>
            tag.toLowerCase().includes(busca.toLowerCase()),
          ),
      )
    }

    if (categoriaFiltro) {
      resultado = resultado.filter(
        (orientacao) => orientacao.categoria === categoriaFiltro,
      )
    }

    setOrientacoesFiltradas(resultado)
  }

  const getNomeCategoria = (categoria: string) => {
    switch (categoria) {
      case 'juridico':
        return 'Jurídico'
      case 'emergencia':
        return 'Emergência'
      case 'prevencao':
        return 'Prevenção'
      case 'psicologico':
        return 'Psicológico'
      case 'recursos':
        return 'Recursos'
      default:
        return 'Outro'
    }
  }

  const getIconeCategoria = (categoria: string) => {
    switch (categoria) {
      case 'juridico':
        return 'library-outline'
      case 'emergencia':
        return 'alert-circle-outline'
      case 'prevencao':
        return 'shield-checkmark-outline'
      case 'psicologico':
        return 'heart-outline'
      case 'recursos':
        return 'information-circle-outline'
      default:
        return 'help-circle-outline'
    }
  }

  const getCorCategoria = (categoria: string) => {
    switch (categoria) {
      case 'juridico':
        return '#1976d2'
      case 'emergencia':
        return '#d32f2f'
      case 'prevencao':
        return '#388e3c'
      case 'psicologico':
        return '#7b1fa2'
      case 'recursos':
        return '#f57c00'
      default:
        return '#666'
    }
  }

  const categorias = Array.from(new Set(ORIENTACOES.map((o) => o.categoria)))

  return (
    <View style={[orientacaoStyles.container, { backgroundColor: colors.background }]}>
      <CustomHeader 
        title="Orientações e Dúvidas" 
        rightIcon="help-circle"
      />
      
      <ScreenContainer scrollable contentStyle={{ ...orientacaoStyles.content }}>
        <Text variant="bodyMedium" style={[orientacaoStyles.subtitle, { color: colors.textSecondary }]}>
          Informações importantes sobre seus direitos e segurança
        </Text>

        <Searchbar
          placeholder="Buscar orientações, dicas ou palavras-chave..."
          value={busca}
          onChangeText={setBusca}
          style={[orientacaoStyles.searchbar, { backgroundColor: colors.surface }]}
          iconColor={colors.iconSecondary}
          placeholderTextColor={colors.placeholder}
        />

        <View style={orientacaoStyles.filtrosContainer}>
          <View style={orientacaoStyles.filtros}>
            <Chip
              selected={!categoriaFiltro}
              onPress={() => setCategoriaFiltro(null)}
              style={[
                orientacaoStyles.filtroChip,
                !categoriaFiltro && { backgroundColor: colors.primary + '20' }
              ]}
              textStyle={[
                orientacaoStyles.filtroTexto,
                { color: !categoriaFiltro ? colors.primary : colors.textSecondary }
              ]}
            >
              Todas
            </Chip>
            {categorias.map((categoria) => (
              <Chip
                key={categoria}
                selected={categoriaFiltro === categoria}
                onPress={() => setCategoriaFiltro(categoriaFiltro === categoria ? null : categoria)}
                style={[
                  orientacaoStyles.filtroChip,
                  categoriaFiltro === categoria && {
                    backgroundColor: getCorCategoria(categoria) + '20',
                  },
                ]}
                textStyle={[
                  orientacaoStyles.filtroTexto,
                  { color: categoriaFiltro === categoria ? getCorCategoria(categoria) : colors.textSecondary },
                ]}
              >
                {getNomeCategoria(categoria)}
              </Chip>
            ))}
          </View>
        </View>

        {!busca && !categoriaFiltro && (
          <Card style={[orientacaoStyles.emergencyCard, { 
            backgroundColor: colors.surface,
            borderColor: colors.error,
          }]}>
            <View style={orientacaoStyles.emergencyContent}>
              <Text variant="titleMedium" style={[orientacaoStyles.emergencyTitle, { color: colors.error }]}>
                🚨 Emergência
              </Text>
              <View style={orientacaoStyles.emergencyNumbers}>
                <Button
                  mode="contained"
                  icon="phone"
                  onPress={() => {}}
                  style={[
                    orientacaoStyles.emergencyButton,
                    { backgroundColor: colors.error },
                  ]}
                  textColor={colors.onError}
                >
                  190 - Polícia
                </Button>
                <Button
                  mode="contained"
                  icon="phone"
                  onPress={() => {}}
                  style={[
                    orientacaoStyles.emergencyButton,
                    { backgroundColor: '#7b1fa2' },
                  ]}
                  textColor={colors.onPrimary}
                >
                  180 - Mulher
                </Button>
              </View>
            </View>
          </Card>
        )}

        {loading ? (
          <View style={orientacaoStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[orientacaoStyles.loadingText, { color: colors.textSecondary }]}>
              Carregando orientações...
            </Text>
          </View>
        ) : (
          <FlatList
            data={orientacoesFiltradas}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={[orientacaoStyles.orientacaoCard, { 
                backgroundColor: colors.surface,
                borderColor: colors.outline + '30'
              }]}>
                <List.Accordion
                  title={item.pergunta}
                  titleStyle={[orientacaoStyles.perguntaTitle, { color: colors.textPrimary }]}
                  titleNumberOfLines={3}
                  left={(props) => (
                    <View style={[orientacaoStyles.categoriaIconContainer, { backgroundColor: colors.background }]}>
                      <Ionicons
                        name={getIconeCategoria(item.categoria) as any}
                        size={24}
                        color={getCorCategoria(item.categoria)}
                      />
                    </View>
                  )}
                  right={(props) => (
                    <View style={orientacaoStyles.accordionHeader}>
                      <Chip
                        compact
                        style={[
                          orientacaoStyles.categoriaChip,
                          {
                            backgroundColor: getCorCategoria(item.categoria) + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            orientacaoStyles.categoriaTexto,
                            { color: getCorCategoria(item.categoria) },
                          ]}
                        >
                          {getNomeCategoria(item.categoria)}
                        </Text>
                      </Chip>
                    </View>
                  )}
                  style={orientacaoStyles.accordion}
                >
                  <View style={[orientacaoStyles.respostaContainer, { backgroundColor: colors.background }]}>
                    <Text style={[orientacaoStyles.respostaTexto, { color: colors.textPrimary }]}>
                      {item.resposta}
                    </Text>

                    {item.tags.length > 0 && (
                      <>
                        <Divider style={[orientacaoStyles.divider, { backgroundColor: colors.outline }]} />
                        <View style={orientacaoStyles.tagsContainer}>
                          <Text style={[orientacaoStyles.tagsLabel, { color: colors.textSecondary }]}>Tags:</Text>
                          <View style={orientacaoStyles.tags}>
                            {item.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                compact
                                style={[orientacaoStyles.tag, { backgroundColor: colors.background }]}
                                textStyle={[orientacaoStyles.tagTexto, { color: colors.textSecondary }]}
                              >
                                {tag}
                              </Chip>
                            ))}
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </List.Accordion>
              </Card>
            )}
            ListEmptyComponent={
              <View style={orientacaoStyles.emptyContainer}>
                <Ionicons name="help-circle-outline" size={64} color={colors.iconSecondary} />
                <Text style={[orientacaoStyles.emptyText, { color: colors.textPrimary }]}>
                  {busca || categoriaFiltro
                    ? 'Nenhuma orientação encontrada'
                    : Locales.t('orientacao.nenhuma')}
                </Text>
                <Text style={[orientacaoStyles.emptySubtext, { color: colors.textSecondary }]}>
                  {busca || categoriaFiltro
                    ? 'Tente ajustar sua busca ou filtros'
                    : 'As orientações aparecerão aqui quando disponíveis'}
                </Text>
              </View>
            }
            style={orientacaoStyles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              orientacoesFiltradas.length === 0 ? { flex: 1 } : undefined
            }
          />
        )}
      </ScreenContainer>
    </View>
  )
}

const orientacaoStyles = StyleSheet.create({
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
  filtrosContainer: {
    marginBottom: 24,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filtroChip: {
    marginBottom: 8,
  },
  filtroTexto: {
    fontSize: 12,
  },
  emergencyCard: {
    marginBottom: 24,
    elevation: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  emergencyContent: {
    padding: 16,
    alignItems: 'center',
  },
  emergencyTitle: {
    marginBottom: 16,
    fontWeight: '600',
    fontSize: 18,
  },
  emergencyNumbers: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  emergencyButton: {
    flex: 1,
    minHeight: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  orientacaoCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  accordion: {
    backgroundColor: 'transparent',
  },
  categoriaIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  accordionHeader: {
    justifyContent: 'center',
    paddingRight: 8,
  },
  categoriaChip: {
    alignSelf: 'center',
  },
  categoriaTexto: {
    fontSize: 11,
    fontWeight: '500',
  },
  perguntaTitle: {
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
  respostaContainer: {
    padding: 16,
    paddingTop: 0,
  },
  respostaTexto: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    marginVertical: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  tagsLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
  },
  tagTexto: {
    fontSize: 11,
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
})

export default Orientacao
