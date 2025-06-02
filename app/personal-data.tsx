import React, { useState } from 'react'
import { ScrollView, View, StyleSheet, Alert } from 'react-native'
import {
  Card,
  Text,
  TextInput,
  Button,
  Avatar,
  IconButton,
  Divider,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { CustomHeader } from '@/src/components/ui'

interface UserData {
  name: string
  email: string
  phone: string
  birthDate: string
  address: string
  city: string
  zipCode: string
  emergencyContact: string
  emergencyPhone: string
}

const PersonalData = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    name: 'Usuário',
    email: 'email@exemplo.com',
    phone: '(11) 99999-9999',
    birthDate: '01/01/1990',
    address: 'Rua Exemplo, 123',
    city: 'São Paulo - SP',
    zipCode: '01234-567',
    emergencyContact: 'Contato de Emergência',
    emergencyPhone: '(11) 88888-8888',
  })

  const [editedData, setEditedData] = useState<UserData>(userData)

  const handleSave = () => {
    setUserData(editedData)
    setIsEditing(false)
    Alert.alert('Sucesso', 'Dados atualizados com sucesso!')
  }

  const handleCancel = () => {
    setEditedData(userData)
    setIsEditing(false)
  }

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    multiline?: boolean
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <MaterialCommunityIcons name={icon} size={20} color="#666666" />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.textInput}
          mode="outlined"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <CustomHeader
        title="Dados Pessoais"
        iconColor="#666666"
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
        rightIcon={isEditing ? undefined : "pencil"}
        onRightPress={isEditing ? undefined : () => setIsEditing(true)}
      />

      <View style={styles.content}>
        {/* Profile Photo Section */}
        <Card style={styles.photoCard}>
          <Card.Content style={styles.photoContent}>
            <Avatar.Icon
              size={80}
              icon="account"
              style={styles.avatar}
            />
            <Text style={styles.photoText}>Foto do Perfil</Text>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Em breve', 'Funcionalidade de foto em desenvolvimento')}
              style={styles.photoButton}
            >
              Alterar Foto
            </Button>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            <Divider style={styles.divider} />
            
            {renderField(
              'Nome Completo',
              editedData.name,
              (text) => setEditedData(prev => ({ ...prev, name: text })),
              'account'
            )}

            {renderField(
              'Email',
              editedData.email,
              (text) => setEditedData(prev => ({ ...prev, email: text })),
              'email'
            )}

            {renderField(
              'Telefone',
              editedData.phone,
              (text) => setEditedData(prev => ({ ...prev, phone: text })),
              'phone'
            )}

            {renderField(
              'Data de Nascimento',
              editedData.birthDate,
              (text) => setEditedData(prev => ({ ...prev, birthDate: text })),
              'calendar'
            )}
          </Card.Content>
        </Card>

        {/* Address Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Endereço</Text>
            <Divider style={styles.divider} />
            
            {renderField(
              'Endereço',
              editedData.address,
              (text) => setEditedData(prev => ({ ...prev, address: text })),
              'home',
              true
            )}

            {renderField(
              'Cidade/Estado',
              editedData.city,
              (text) => setEditedData(prev => ({ ...prev, city: text })),
              'city'
            )}

            {renderField(
              'CEP',
              editedData.zipCode,
              (text) => setEditedData(prev => ({ ...prev, zipCode: text })),
              'map-marker'
            )}
          </Card.Content>
        </Card>

        {/* Emergency Contact */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Contato de Emergência</Text>
            <Divider style={styles.divider} />
            
            {renderField(
              'Nome do Contato',
              editedData.emergencyContact,
              (text) => setEditedData(prev => ({ ...prev, emergencyContact: text })),
              'account-heart'
            )}

            {renderField(
              'Telefone de Emergência',
              editedData.emergencyPhone,
              (text) => setEditedData(prev => ({ ...prev, emergencyPhone: text })),
              'phone-alert'
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={[styles.actionButton, styles.cancelButton]}
              textColor="#666666"
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.actionButton, styles.saveButton]}
            >
              Salvar
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  photoCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  photoContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: '#E3F2FD',
    marginBottom: 12,
  },
  photoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
  },
  photoButton: {
    borderColor: '#2196F3',
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333333',
    paddingLeft: 28,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
  },
  cancelButton: {
    borderColor: '#666666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
})

export default PersonalData 