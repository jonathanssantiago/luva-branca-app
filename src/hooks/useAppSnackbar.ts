import { useState } from 'react'

export type SnackbarType = 'success' | 'error' | 'info' | 'warning'

export interface SnackbarState {
  message: string
  type: SnackbarType
}

export const useAppSnackbar = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)

  const show = (message: string, type: SnackbarType = 'info') =>
    setSnackbar({ message, type })

  const dismiss = () => setSnackbar(null)

  return {
    snackbar,
    dismiss,
    showSuccess: (msg: string) => show(msg, 'success'),
    showError: (msg: string) => show(msg, 'error'),
    showInfo: (msg: string) => show(msg, 'info'),
    showWarning: (msg: string) => show(msg, 'warning'),
  }
}
