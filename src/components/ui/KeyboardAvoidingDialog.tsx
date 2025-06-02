/**
 * Dialog wrapper que corrige problema com teclado
 */

import React, { useState, useEffect } from 'react'
import { KeyboardAvoidingView, Platform, Keyboard, KeyboardEvent, StyleProp, ViewStyle } from 'react-native'
import { Dialog } from 'react-native-paper'

interface KeyboardAvoidingDialogProps {
  children: React.ReactNode
  visible: boolean
  onDismiss: () => void
  style?: StyleProp<ViewStyle>
  dismissable?: boolean
  dismissableBackButton?: boolean
  testID?: string
}

const KeyboardAvoidingDialogComponent: React.FC<KeyboardAvoidingDialogProps> = ({
  children,
  style,
  visible,
  onDismiss,
  dismissable = true,
  dismissableBackButton,
  testID,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    function onKeyboardChange(e: KeyboardEvent) {
      if (Platform.OS === 'ios') {
        // No iOS, verificamos se o teclado está aparecendo ou desaparecendo
        if (e?.startCoordinates && e.endCoordinates.screenY < e.startCoordinates.screenY) {
          setKeyboardHeight(e.endCoordinates.height)
        } else {
          setKeyboardHeight(0)
        }
      } else {
        // No Android, verificamos se há altura do teclado
        if (e?.endCoordinates?.height) {
          setKeyboardHeight(e.endCoordinates.height)
        } else {
          setKeyboardHeight(0)
        }
      }
    }

    let subscriptions: any[] = []

    if (Platform.OS === 'ios') {
      subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', onKeyboardChange),
        Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0)),
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', onKeyboardChange),
        Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0)),
      ]
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove())
    }
  }, [])

  // Calculamos o offset baseado na altura do teclado
  const keyboardOffset = keyboardHeight > 0 ? -keyboardHeight / 3 : 0

  const dialogStyle = [
    {
      marginBottom: keyboardHeight > 0 ? keyboardHeight / 2 : 0,
      transform: [{ translateY: keyboardOffset }],
    },
    style,
  ]

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled={keyboardHeight > 0}
    >
      <Dialog 
        style={dialogStyle} 
        visible={visible}
        onDismiss={onDismiss}
        dismissable={dismissable}
        dismissableBackButton={dismissableBackButton}
        testID={testID}
      >
        {children}
      </Dialog>
    </KeyboardAvoidingView>
  )
}

// Criamos um objeto composto com os subcomponentes do Dialog
export const KeyboardAvoidingDialog = Object.assign(KeyboardAvoidingDialogComponent, {
  Title: Dialog.Title,
  Content: Dialog.Content,
  Actions: Dialog.Actions,
  ScrollArea: Dialog.ScrollArea,
  Icon: Dialog.Icon,
}) 