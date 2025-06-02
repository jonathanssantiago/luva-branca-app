import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Platform } from 'react-native'
import { Surface } from 'react-native-paper'

import { Locales, styles } from '@/lib'

const Modal = () => (
  <Surface style={styles.screen}>
    {/* Use a light status bar on iOS to account for the black space above the modal */}
    <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
  </Surface>
)

export default Modal
