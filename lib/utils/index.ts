/**
 * Utilities
 */

import Languages from '@/lib/utils/languages'
import {
  translateAuthError,
  isRecoverableError,
  getErrorActions,
  AUTH_ERROR_MAPPINGS,
} from '@/lib/utils/auth-errors'
import {
  DISGUISED_MODE_STORAGE_KEYS,
  saveDisguisedModeCredentials,
  clearDisguisedModeCredentials,
  hasDisguisedModeCredentials,
  getLastLoginInfo,
  updateLastLogin,
  debugDisguisedModeStorage,
} from '@/lib/utils/disguised-mode-auth'

export {
  Languages,
  translateAuthError,
  isRecoverableError,
  getErrorActions,
  AUTH_ERROR_MAPPINGS,
  DISGUISED_MODE_STORAGE_KEYS,
  saveDisguisedModeCredentials,
  clearDisguisedModeCredentials,
  hasDisguisedModeCredentials,
  getLastLoginInfo,
  updateLastLogin,
  debugDisguisedModeStorage,
}
