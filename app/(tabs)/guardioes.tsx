import React, { useState, useEffect, useCallback } from 'react'
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
import { useFocusEffect } from '@react-navigation/native'
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
import { useThemeExtendedColors } from '@/src/context/ThemeContext'

const { width } = Dimensions.get('window')

const Guardioes = () => {
  const theme = useTheme()
  const colors = useThemeExtendedColors()
  const insets = useSafeAreaInsets()

  // Hook para gerenciamento de guardiões com Supabase
  const {
    guardians,
    loading,
    error,
    addGuardian,
    updateGuardian,
    removeGuardian,
    getEmergencyContacts,
    refreshGuardians,
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

  // Refresh automático dos guardiões quando a tela for focada
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Tela guardiões focada - atualizando lista')
      refreshGuardians()
    }, [refreshGuardians]),
  )

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
    <View
      style={[
        guardioesStyles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <CustomHeader title="Meus Guardiões" rightIcon="menu" />

      <ScreenContainer
        scrollable
        contentStyle={{ paddingBottom: 60, paddingTop: 30 }}
        keyboardAvoiding={true}
      >
        <Text
          variant="bodyMedium"
          style={[guardioesStyles.subtitle, { color: colors.textSecondary }]}
        >
          Configure até 5 pessoas de confiança que receberão alertas de
          emergência
        </Text>

        {loading && guardians.length === 0 && (
          <View style={guardioesStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                guardioesStyles.loadingText,
                { color: colors.textSecondary },
              ]}
            >
              Carregando guardiões...
            </Text>
          </View>
        )}

        <FlatList
          data={guardians}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={[
                guardioesStyles.guardianCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline + '30',
                },
              ]}
            >
              <List.Item
                title={item.name}
                description={
                  <>
                    {item.phone ? (
                      <View
                        style={[
                          guardioesStyles.guardianDetails,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <View style={guardioesStyles.detailItem}>
                          <MaterialCommunityIcons
                            name="phone"
                            size={20}
                            color={colors.iconSecondary}
                          />
                          <Text
                            style={[
                              guardioesStyles.detailText,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {item.phone}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </>
                }
                left={(props) => (
                  <View
                    style={[
                      guardioesStyles.iconContainer,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-circle"
                      size={24}
                      color={colors.onPrimary}
                    />
                  </View>
                )}
                right={(props) => (
                  <View style={guardioesStyles.actionButtons}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor={colors.primary}
                      onPress={() => handleEditGuardian(item)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={colors.error}
                      onPress={() => handleRemoveGuardian(item.id)}
                    />
                  </View>
                )}
                titleStyle={[
                  guardioesStyles.guardianName,
                  { color: colors.textPrimary },
                ]}
                style={guardioesStyles.listItem}
              />
              <View
                style={[
                  guardioesStyles.chipContainer,
                  {
                    backgroundColor: colors.background,
                    borderTopColor: colors.outline + '30',
                  },
                ]}
              >
                <Chip
                  compact
                  mode="outlined"
                  style={[
                    guardioesStyles.chip,
                    { borderColor: colors.primary, marginRight: 8 },
                  ]}
                  textStyle={{ color: colors.primary }}
                >
                  {item.relationship}
                </Chip>
                <Chip
                  compact
                  mode="outlined"
                  style={[
                    guardioesStyles.chip,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  textStyle={{ color: colors.onPrimary }}
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
                color={colors.iconSecondary}
              />
              <Text
                style={[
                  guardioesStyles.emptyText,
                  { color: colors.textPrimary },
                ]}
              >
                Nenhum guardião cadastrado
              </Text>
              <Text
                style={[
                  guardioesStyles.emptySubtext,
                  { color: colors.textSecondary },
                ]}
              >
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
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
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
          wrapperStyle={{ bottom: 80 }}
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
          style={[guardioesStyles.dialog, { backgroundColor: colors.surface }]}
        >
          <KeyboardAvoidingDialog.Title
            style={[guardioesStyles.dialogTitle, { color: colors.textPrimary }]}
          >
            {editingGuardian ? 'Editar Guardião' : 'Adicionar Guardião'}
          </KeyboardAvoidingDialog.Title>
          <KeyboardAvoidingDialog.Content style={guardioesStyles.dialogContent}>
            <TextInput
              label="Nome"
              value={nome}
              onChangeText={setNome}
              style={[
                guardioesStyles.input,
                { backgroundColor: colors.inputBackground },
              ]}
              mode="outlined"
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.placeholder}
              disabled={loading}
            />
            <TextInput
              label="Telefone/WhatsApp"
              value={telefone}
              onChangeText={(text) => setTelefone(formatPhone(text))}
              keyboardType="phone-pad"
              style={[
                guardioesStyles.input,
                { backgroundColor: colors.inputBackground },
              ]}
              mode="outlined"
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.placeholder}
              disabled={loading}
            />
            <TextInput
              label="Parentesco"
              value={parentesco}
              onChangeText={setParentesco}
              style={[
                guardioesStyles.input,
                { backgroundColor: colors.inputBackground },
              ]}
              mode="outlined"
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.placeholder}
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
              textColor={colors.textSecondary}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleAddGuardian}
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
              loading={loading}
              disabled={loading}
            >
              {editingGuardian ? 'Atualizar' : 'Adicionar'}
            </Button>
          </KeyboardAvoidingDialog.Actions>
        </KeyboardAvoidingDialog>
      </Portal>

      {guardians.length < 5 && (
        <FAB
          icon="plus"
          style={[
            guardioesStyles.fab,
            {
              backgroundColor: colors.primary,
              bottom: 100 + Math.max(insets.bottom, 8),
            },
          ]}
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
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: width < 400 ? 24 : 28,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: width < 400 ? 8 : 16,
    lineHeight: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 4,
  },
  guardianCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconContainer: {
    width: width < 400 ? 48 : 52,
    height: width < 400 ? 48 : 52,
    borderRadius: width < 400 ? 24 : 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  guardianName: {
    fontWeight: '700',
    fontSize: width < 400 ? 16 : 17,
    lineHeight: width < 400 ? 22 : 24,
    marginBottom: 4,
  },
  guardianDetails: {
    paddingTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    lineHeight: 20,
    marginLeft: 10,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  chip: {
    alignSelf: 'flex-start',
    marginRight: 8,
    height: 37,
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
  },
  emptySubtext: {
    fontSize: width < 400 ? 13 : 14,
    textAlign: 'center',
    lineHeight: 20,
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
    borderRadius: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  dialogContent: {
    padding: 16,
  },
  input: {
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
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -8,
  },
})

export default Guardioes
