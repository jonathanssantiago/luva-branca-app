import React, { useState, useEffect } from 'react'
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
  ActivityIndicator,
} from 'react-native-paper'
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Locales } from '@/lib'
import {
  ScreenContainer,
  CustomHeader,
  KeyboardAvoidingDialog,
} from '@/src/components/ui'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGuardians, GuardianInput } from '@/src/hooks/useGuardians'
import { Guardian } from '@/lib/supabase'

const { width } = Dimensions.get('window')

const Guardioes = () => {
  const theme = useTheme()

  // Hook para gerenciamento de guardiões com Supabase
  const {
    guardians,
    loading,
    error,
    addGuardian,
    updateGuardian,
    removeGuardian,
    getEmergencyContacts,
  } = useGuardians()

  // Estados para o formulário
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [parentesco, setParentesco] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null)

  // Debug: Log para verificar mudanças nos guardiões
  useEffect(() => {
    console.log('Guardiões atualizados:', guardians.length, guardians)
  }, [guardians])

  // Efeito para mostrar erros
  useEffect(() => {
    if (error) {
      setSnackbar(error)
    }
  }, [error])

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
    setParentesco('')
    setEditingGuardian(null)
  }

  const handleAddGuardian = async () => {
    if (!nome || !telefone || !parentesco) {
      setSnackbar('Nome, telefone e parentesco são obrigatórios')
      return
    }

    const guardianData: GuardianInput = {
      name: nome.trim(),
      phone: telefone.trim(),
      relationship: parentesco.trim(),
    }

    if (editingGuardian) {
      const success = await updateGuardian(editingGuardian.id, guardianData)
      if (success) {
        setSnackbar('Guardião atualizado com sucesso')
        clearForm()
        setDialogVisible(false)
      }
    } else {
      const newGuardian = await addGuardian(guardianData)
      if (newGuardian) {
        setSnackbar('Guardião adicionado com sucesso')
        clearForm()
        setDialogVisible(false)
      }
    }
  }

  const handleEditGuardian = (guardian: Guardian) => {
    setNome(guardian.name)
    setTelefone(guardian.phone)
    setParentesco(guardian.relationship)
    setEditingGuardian(guardian)
    setDialogVisible(true)
  }

  const handleRemoveGuardian = async (id: string) => {
    Alert.alert(
      'Remover Guardião',
      'Tem certeza que deseja remover este guardião?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const success = await removeGuardian(id)
            if (success) {
              setSnackbar('Guardião removido com sucesso')
            }
          },
        },
      ],
    )
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
          Meus Guardiões
        </Text>

        <Text variant="bodyMedium" style={guardioesStyles.subtitle}>
          Configure até 5 pessoas de confiança que receberão alertas de
          emergência
        </Text>

        {loading && guardians.length === 0 && (
          <View style={guardioesStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF3B7C" />
            <Text style={guardioesStyles.loadingText}>
              Carregando guardiões...
            </Text>
          </View>
        )}

        <FlatList
          data={guardians}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={guardioesStyles.guardianCard}>
              <List.Item
                title={item.name}
                description={
                  <>
                    <Text style={guardioesStyles.guardianDescription}>
                      {item.relationship}
                    </Text>
                    <View style={guardioesStyles.guardianDetails}>
                      <View style={guardioesStyles.detailItem}>
                        <MaterialCommunityIcons
                          name="phone"
                          size={20}
                          color="#666666"
                        />
                        <Text style={guardioesStyles.detailText}>
                          {item.phone}
                        </Text>
                      </View>
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
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="#FF3B7C"
                      onPress={() => handleEditGuardian(item)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#EA5455"
                      onPress={() => handleRemoveGuardian(item.id)}
                    />
                  </View>
                )}
                titleStyle={guardioesStyles.guardianName}
                descriptionStyle={guardioesStyles.guardianDescription}
              />
              <View style={guardioesStyles.chipContainer}>
                <Chip
                  compact
                  mode="outlined"
                  style={[
                    guardioesStyles.chip,
                    { borderColor: '#FF3B7C', marginRight: 8 },
                  ]}
                  textStyle={{ color: '#FF3B7C' }}
                >
                  {item.relationship}
                </Chip>
                <Chip
                  compact
                  mode="outlined"
                  style={[
                    guardioesStyles.chip,
                    { backgroundColor: '#FF3B7C', borderColor: '#FF3B7C' },
                  ]}
                  textStyle={{ color: '#FFFFFF' }}
                >
                  Emergência
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
                Adicione pessoas de confiança para receberem alertas de
                emergência
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
            guardians.length === 0 ? { flex: 1 } : undefined
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
            {editingGuardian ? 'Editar Guardião' : 'Adicionar Guardião'}
          </KeyboardAvoidingDialog.Title>
          <KeyboardAvoidingDialog.Content style={guardioesStyles.dialogContent}>
            <TextInput
              label="Nome"
              value={nome}
              onChangeText={setNome}
              style={guardioesStyles.input}
              mode="outlined"
              outlineColor="#CCCCCC"
              activeOutlineColor="#FF3B7C"
              disabled={loading}
            />
            <TextInput
              label="Telefone/WhatsApp"
              value={telefone}
              onChangeText={(text) => setTelefone(formatPhone(text))}
              keyboardType="phone-pad"
              style={guardioesStyles.input}
              mode="outlined"
              outlineColor="#CCCCCC"
              activeOutlineColor="#FF3B7C"
              disabled={loading}
            />
            <TextInput
              label="Parentesco"
              value={parentesco}
              onChangeText={setParentesco}
              style={guardioesStyles.input}
              mode="outlined"
              outlineColor="#CCCCCC"
              activeOutlineColor="#FF3B7C"
              disabled={loading}
              placeholder="Ex: Mãe, Pai, Irmã, Amiga..."
            />
          </KeyboardAvoidingDialog.Content>
          <KeyboardAvoidingDialog.Actions style={guardioesStyles.dialogActions}>
            <Button
              onPress={() => {
                setDialogVisible(false)
                clearForm()
              }}
              textColor="#666666"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleAddGuardian}
              mode="contained"
              buttonColor="#FF3B7C"
              textColor="#FFFFFF"
              disabled={loading}
              loading={loading}
            >
              {editingGuardian ? 'Atualizar' : 'Adicionar'}
            </Button>
          </KeyboardAvoidingDialog.Actions>
        </KeyboardAvoidingDialog>
      </Portal>

      {guardians.length > 0 && (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
})

export default Guardioes
