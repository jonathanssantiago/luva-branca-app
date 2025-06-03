/**
 * Dialog wrapper que corrige problema com teclado
 */

import React, { useState, useEffect } from 'react'
import { KeyboardAvoidingView, Platform, Keyboard, KeyboardEvent, StyleProp, ViewStyle, Animated } from 'react-native'
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
  const [keyboardHeight] = useState(new Animated.Value(0))

  useEffect(() => {
    function onKeyboardChange(e: KeyboardEvent) {
      if (Platform.OS === 'ios') {
        if (e?.startCoordinates && e.endCoordinates.screenY < e.startCoordinates.screenY) {
          Animated.timing(keyboardHeight, {
            toValue: e.endCoordinates.height,
            duration: 250,
            useNativeDriver: false,
          }).start()
        } else {
          Animated.timing(keyboardHeight, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start()
        }
      } else {
        if (e?.endCoordinates?.height) {
          Animated.timing(keyboardHeight, {
            toValue: e.endCoordinates.height,
            duration: 250,
            useNativeDriver: false,
          }).start()
        } else {
          Animated.timing(keyboardHeight, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start()
        }
      }
    }

    let subscriptions: any[] = []

    if (Platform.OS === 'ios') {
      subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', onKeyboardChange),
        Keyboard.addListener('keyboardWillHide', () => {
          Animated.timing(keyboardHeight, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start()
        }),
      ]
    } else {
      subscriptions = [
        Keyboard.addListener('keyboardDidShow', onKeyboardChange),
        Keyboard.addListener('keyboardDidHide', () => {
          Animated.timing(keyboardHeight, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start()
        }),
      ]
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove())
    }
  }, [])

  const dialogStyle = [
    {
      transform: [
        {
          translateY: keyboardHeight.interpolate({
            inputRange: [0, 500],
            outputRange: [0, -150],
          }),
        },
      ],
    },
    style,
  ]

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled={Platform.OS === 'ios'}
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