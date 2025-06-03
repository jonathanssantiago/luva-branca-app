import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native'
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

const KeyboardAvoidingDialogComponent: React.FC<
  KeyboardAvoidingDialogProps
> = ({
  children,
  style,
  visible,
  onDismiss,
  dismissable = true,
  dismissableBackButton,
  testID,
}) => {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Dialog
        style={style}
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
export const KeyboardAvoidingDialog = Object.assign(
  KeyboardAvoidingDialogComponent,
  {
    Title: Dialog.Title,
    Content: Dialog.Content,
    Actions: Dialog.Actions,
    ScrollArea: Dialog.ScrollArea,
    Icon: Dialog.Icon,
  },
)
