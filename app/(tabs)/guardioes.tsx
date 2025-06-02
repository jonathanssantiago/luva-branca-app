import React, { useState } from 'react'
import {
  Surface,
  Text,
  Button,
  List,
  TextInput,
  Snackbar,
  IconButton,
  FAB,
  Dialog,
  Portal,
  Card,
  useTheme,
  Chip,
} from 'react-native-paper'
import { FlatList, View, StyleSheet, Dimensions, TouchableOpacity, Linking } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Locales } from '@/lib'
import { ScreenContainer, CustomHeader, KeyboardAvoidingDialog } from '@/src/components/ui'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
// import { useSupabaseGuardioes } from '@/src/hooks/useSupabaseGuardioes' // Exemplo de hook para integração

const { width } = Dimensions.get('window')

interface Guardiao {
  id: string
  nome: string
  telefone: string
  whatsapp?: string
  parentesco?: string
  relacao?: string
  email?: string
}

const Guardioes = () => {
  const theme = useTheme()
  const [guardioes, setGuardioes] = useState<Guardiao[]>([])
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [parentesco, setParentesco] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editingGuardiao, setEditingGuardiao] = useState<Guardiao | null>(null)

  // Exemplo de integração Supabase (substitua pelo hook real)
  // const { guardioes, addGuardiao, removeGuardiao, loading, error } = useSupabaseGuardioes()

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const clearForm = () => {
    setNome('')
    setTelefone('')
    setWhatsapp('')
    setParentesco('')
    setEditingGuardiao(null)
  }

  const addGuardiao = () => {
    if (!nome || !telefone) {
      setSnackbar(Locales.t('guardioes.preencha'))
      return
    }
    if (guardioes.length >= 5) {
      setSnackbar(Locales.t('guardioes.limite'))
      return
    }

    const novoGuardiao: Guardiao = {
      id: Date.now().toString(),
      nome: nome.trim(),
      telefone: telefone.trim(),
      whatsapp: whatsapp.trim() || telefone.trim(),
      parentesco: parentesco.trim(),
      relacao: 'Parente',
    }

    if (editingGuardiao) {
      setGuardioes(
        guardioes.map((g) =>
          g.id === editingGuardiao.id
            ? { ...novoGuardiao, id: editingGuardiao.id }
            : g,
        ),
      )
      setSnackbar(Locales.t('guardioes.atualizado'))
    } else {
      setGuardioes([...guardioes, novoGuardiao])
      setSnackbar(Locales.t('guardioes.adicionado'))
    }

    clearForm()
    setDialogVisible(false)
  }

  const editGuardiao = (guardiao: Guardiao) => {
    setNome(guardiao.nome)
    setTelefone(guardiao.telefone)
    setWhatsapp(guardiao.whatsapp || '')
    setParentesco(guardiao.parentesco || '')
    setEditingGuardiao(guardiao)
    setDialogVisible(true)
  }

  const removeGuardiao = (id: string) => {
    setGuardioes(guardioes.filter((g) => g.id !== id))
    setSnackbar(Locales.t('guardioes.removido'))
  }

  return (
    <View style={guardioesStyles.container}>
      <CustomHeader
        title="Meus Guardiões"
        iconColor="#666666"
        rightIcon="menu"
      />

      <ScreenContainer 
        scrollable 
        contentStyle={{ paddingBottom: 120 }}
        keyboardAvoiding={true}
      >
        <Text variant="headlineMedium" style={guardioesStyles.title}>
          {Locales.t('guardioes.titulo')}
        </Text>

        <Text variant="bodyMedium" style={guardioesStyles.subtitle}>
          Configure até 5 pessoas de confiança que receberão alertas de
          emergência
        </Text>

        <FlatList
          data={guardioes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={guardioesStyles.guardianCard}>
              <List.Item
                title={item.nome}
                description={
                  <>
                    <Text style={guardioesStyles.guardianDescription}>
                      {item.relacao}
                    </Text>
                    <View style={guardioesStyles.guardianDetails}>
                      <View style={guardioesStyles.detailItem}>
                        <MaterialCommunityIcons
                          name="phone"
                          size={20}
                          color="#666666"
                        />
                        <Text style={guardioesStyles.detailText}>
                          {item.telefone}
                        </Text>
                      </View>
                      {item.email && (
                        <View style={guardioesStyles.detailItem}>
                          <MaterialCommunityIcons
                            name="email"
                            size={20}
                            color="#666666"
                          />
                          <Text style={guardioesStyles.detailText}>
                            {item.email}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                }
                left={(props) => (
                  <View style={guardioesStyles.iconContainer}>
                    <MaterialCommunityIcons
                      name="account-circle"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                )}
                right={(props) => (
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#EA5455"
                    onPress={() => removeGuardiao(item.id)}
                  />
                )}
                titleStyle={guardioesStyles.guardianName}
                descriptionStyle={guardioesStyles.guardianDescription}
              />
              <View style={guardioesStyles.chipContainer}>
                {item.parentesco && (
                  <Chip 
                    compact 
                    mode="outlined" 
                    style={[guardioesStyles.chip, { borderColor: '#FF3B7C', marginRight: 8 }]}
                    textStyle={{ color: '#FF3B7C' }}
                  >
                    {item.parentesco}
                  </Chip>
                )}
                <Chip 
                  compact 
                  mode="outlined" 
                  style={[guardioesStyles.chip, { borderColor: '#FF3B7C' }]}
                  textStyle={{ color: '#FF3B7C' }}
                >
                  {item.relacao}
                </Chip>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={guardioesStyles.emptyContainer}>
              <MaterialCommunityIcons
                name="account-group"
                size={64}
                color="#CCCCCC"
              />
              <Text style={guardioesStyles.emptyText}>
                Nenhum guardião cadastrado
              </Text>
              <Text style={guardioesStyles.emptySubtext}>
                Adicione pessoas de confiança para receberem alertas de emergência
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  clearForm()
                  setDialogVisible(true)
                }}
                style={guardioesStyles.addButton}
                icon="plus"
                buttonColor="#FF3B7C"
                textColor="#FFFFFF"
              >
                Adicionar Guardião
              </Button>
            </View>
          }
          contentContainerStyle={
            guardioes.length === 0 ? { flex: 1 } : undefined
          }
          style={guardioesStyles.list}
          showsVerticalScrollIndicator={false}
        />

        <Snackbar
          visible={!!snackbar}
          onDismiss={() => setSnackbar('')}
          action={{
            label: 'OK',
            onPress: () => setSnackbar(''),
          }}
          style={guardioesStyles.snackbar}
        >
          {snackbar}
        </Snackbar>
      </ScreenContainer>

      <Portal>
        <KeyboardAvoidingDialog
          visible={dialogVisible}
          onDismiss={() => {
            setDialogVisible(false)
            clearForm()
          }}
          style={guardioesStyles.dialog}
        >
          <KeyboardAvoidingDialog.Title style={guardioesStyles.dialogTitle}>
            {editingGuardiao ? 'Editar Guardião' : 'Adicionar Guardião'}
          </KeyboardAvoidingDialog.Title>
          <KeyboardAvoidingDialog.Content style={guardioesStyles.dialogContent}>
            <TextInput
              label={Locales.t('guardioes.nome')}
              value={nome}
              onChangeText={setNome}
              style={guardioesStyles.input}
              mode="outlined"
              outlineColor="#CCCCCC"
              activeOutlineColor="#FF3B7C"
            />
            <TextInput
              label={Locales.t('guardioes.telefone')}
              value={telefone}
              onChangeText={(text) => setTelefone(formatPhone(text))}
              keyboardType="phone-pad"
              style={guardioesStyles.input}
              mode="outlined"
              outlineColor="#CCCCCC"
              activeOutlineColor="#FF3B7C"
            />
            <TextInput
              label="WhatsApp (opcional)"
              value={whatsapp}
              onChangeText={(text) => setWhatsapp(formatPhone(text))}
              keyboardType="phone-pad"
              style={guardioesStyles.input}
              mode="outlined"
              outlineColor="#CCCCCC"
              activeOutlineColor="#FF3B7C"
            />
            <TextInput
              label="Parentesco (opcional)"
              value={parentesco}
              onChangeText={setParentesco}
              style={guardioesStyles.input}
              mode="outlined"
              outlineColor="#CCCCCC"
              activeOutlineColor="#FF3B7C"
            />
          </KeyboardAvoidingDialog.Content>
          <KeyboardAvoidingDialog.Actions style={guardioesStyles.dialogActions}>
            <Button
              onPress={() => {
                setDialogVisible(false)
                clearForm()
              }}
              textColor="#666666"
            >
              Cancelar
            </Button>
            <Button
              onPress={addGuardiao}
              mode="contained"
              buttonColor="#FF3B7C"
              textColor="#FFFFFF"
            >
              {editingGuardiao ? 'Atualizar' : 'Adicionar'}
            </Button>
          </KeyboardAvoidingDialog.Actions>
        </KeyboardAvoidingDialog>
      </Portal>

      {guardioes.length > 0 && (
        <FAB
          icon="plus"
          style={[guardioesStyles.fab, { backgroundColor: '#FF3B7C' }]}
          onPress={() => {
            clearForm()
            setDialogVisible(true)
          }}
        />
      )}
    </View>
  )
}

const guardioesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#FF3B7C',
    fontWeight: 'bold',
    fontSize: width < 400 ? 24 : 28,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: width < 400 ? 8 : 16,
    lineHeight: 20,
    color: '#666666',
  },
  list: {
    flex: 1,
    paddingHorizontal: 4,
  },
  guardianCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    marginHorizontal: 4,
    backgroundColor: '#F9F9F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  iconContainer: {
    width: width < 400 ? 44 : 48,
    height: width < 400 ? 44 : 48,
    borderRadius: width < 400 ? 22 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    elevation: 2,
    backgroundColor: '#FF3B7C',
  },
  guardianName: {
    fontWeight: '600',
    fontSize: width < 400 ? 15 : 16,
    lineHeight: width < 400 ? 20 : 22,
    color: '#222222',
  },
  guardianDescription: {
    fontSize: width < 400 ? 13 : 14,
    lineHeight: 18,
    color: '#666666',
  },
  guardianDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
    marginLeft: 8,
  },
  chipContainer: {
    paddingHorizontal: width < 400 ? 12 : 16,
    paddingBottom: 12,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#666666',
  },
  emptySubtext: {
    fontSize: width < 400 ? 13 : 14,
    textAlign: 'center',
    lineHeight: 20,
    color: '#CCCCCC',
  },
  addButton: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 6,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  dialogContent: {
    padding: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  dialogActions: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  snackbar: {
    backgroundColor: '#333333',
  },
})

export default Guardioes
