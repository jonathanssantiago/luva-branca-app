# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start dev server (NODE_ENV=development expo start)
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device
npm run web            # Run web version
npm test               # Run Jest tests (watch mode)
npm run lint           # ESLint with auto-fix
npm run format         # Prettier formatting
npm run expo:fix       # Auto-fix Expo dependency versions
npm run expo:lint      # Expo-specific linting
```

Run a single test file:

```bash
npx jest path/to/test.spec.ts
```

## Environment Setup

Copy `.env.example` to `.env` and fill in:

```
NODE_ENV=development

EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...
EXPO_PUBLIC_USE_PHONE_AUTH=true
EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=true

# Optional: override Edge Functions base URL (defaults to SUPABASE_URL/functions/v1)
# EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1

# Deep linking scheme (automatic via app.config.js): siapepm://
```

## App Identity

- **Name**: SIAPeP-M
- **Scheme**: `siapepm://`
- **Platforms**: iOS (17.0+), Android
- **Bundle IDs**: `com.jonathanssantiago.siapepm-app` (iOS), `com.jonathanssantiago.siapepm` (Android)

## Architecture

### Routing (Expo Router — file-based)

- `app/(auth)/` — Unauthenticated screens: `login`, `signup`, `forgot-password`, `verify-email`
- `app/(tabs)/` — Main tabbed interface:
  - Tabs: SOS (`index`), Rede (`guardioes`), Guia (`orientacao`), Apoio (`apoio`), Menu (`config-profile`)
  - Non-tab screens: `documentos`, `arquivo`, `settings`
- `app/diary/` — Safety diary: `index` (list), `create`, `view/[id]`, `edit/[id]`
- Top-level screens: `notifications`, `search`, `disguised-mode`, `personal-data`, `privacy`, `modal`
- Navigation is gated by auth state and disguised mode, both from Context providers.
- Root layout (`app/_layout.tsx`) mounts the full provider hierarchy and biometric lock screen.

### State Management

**React Context** (`src/context/`): `SupabaseAuthContext`, `ThemeContext`, `NotificationContext`, `DisguisedModeContext` — use `useAuth()` and the other context hooks. `PrivacySettingsProvider` (in `src/hooks/usePrivacySettings.ts`) manages biometric, lock timeout, and disguised mode settings via `usePrivacySettings()`.

**Local-first data**: [WatermelonDB](https://nozbe.github.io/WatermelonDB/) in `src/database/` with 7 models:

| Model | Table | Notes |
|---|---|---|
| `Profile` | `profiles` | User profile |
| `Guardian` | `guardians` | Emergency contacts |
| `SafetyDiaryEntry` | `safety_diary_entries` | Diary with emotions, tags, images |
| `AudioRecording` | `audio_recordings` | Audio file metadata |
| `Document` | `documents` | Document file metadata |
| `EmergencyAlert` | `emergency_alerts` | Emergency alerts with location |
| `SyncQueueItem` | `sync_queue` | Offline sync queue |

All models track `sync_status` (`synced` | `pending` | `conflict`) and use soft-delete (`is_deleted` flag).

**Zustand stores** (`src/stores/`): `useProfileStore`, `useGuardiansStore`, `useDiaryStore`, `useMediaStore`, `useEmergencyAlertsStore`, `useSyncStore`.

**Reactive observers** (`src/stores/observers/`): Each store has an observer that subscribes to WatermelonDB table changes — `profileObserver`, `guardiansObserver`, `diaryObserver`, `mediaObserver`, `emergencyAlertsObserver`, `syncQueueObserver`. The sync queue observer auto-triggers `SyncService.runPendingSync()` with a 2s debounce.

### Sync Architecture

Offline-first sync flow: **WatermelonDB model** → **SyncQueueItem** → **SyncService** → **Edge Functions** (`sync-push` / `sync-pull`).

- `SyncService` (`src/services/SyncService.ts`) — static methods `runPendingSync()` and `retryAllFailed()`. Uses mutex lock to prevent concurrent syncs, exponential backoff (max 5 attempts).
- Sync modules (`src/services/sync/`): `syncProfile`, `syncGuardians`, `syncDiary`, `syncMedia`, `syncEmergencyAlerts` — each handles upsert/delete for its entity type.
- `DatabaseProvider` (`src/providers/DatabaseProvider.tsx`) — mounts all observers, tracks connectivity via `@react-native-community/netinfo`, runs deferred pull sync after UI render.

### Custom Hooks (`src/hooks/`)

Business logic lives here, not in components:

- `useProfile()` — Profile fetch/update from Supabase
- `useAudioRecording()` — Capture audio + upload to Supabase storage
- `useDocumentUpload()` — Document selection and upload (PDF, Word, TXT; max 50MB)
- `useImageUpload()` — Image selection and upload (max 5MB)
- `useGuardians()` — Emergency contacts CRUD with offline support
- `useGuardiansValidator()` — Validate guardians for emergency alerts
- `useSafetyDiary()` — Diary entries CRUD with emotion/location/image/audio
- `useNotifications()` — Push notification management (wraps NotificationContext)
- `useSyncStatus()` — Sync state: online/offline, pending/failed counts and breakdowns
- `useBiometricAuth()` — Fingerprint/Face ID with privacy settings integration
- `usePrivacySettings()` — Privacy, biometric auth, lock timeout, disguised mode settings (SecureStore persistence)
- `usePermissions()` — Camera, microphone, location, notifications, media library permissions
- `useEdgeFunctions()` / `useAuthFunctions()` — Supabase Edge Function calls
- `useOfflineAlerts()` — Offline alert queue with retry (max 3 attempts, 5-min backoff)
- `useAppSnackbar()` — In-app snackbar messages (success/error/info/warning)
- `useLocation()` — Geolocation with reverse geocoding (defined in `src/hooks/index.ts`)
- `useEmergency()` — Emergency alert creation adapter over store (defined in `src/hooks/index.ts`)
- `useFormValidation<T>()` — Generic form state with Yup validation (defined in `src/hooks/index.ts`)

### Components (`src/components/`)

- `src/components/ui/` — Reusable UI: `Button`, `Card`, `Input`, `Loading`, `LoadingIndicator`, `ScreenContainer`, `CustomHeader`, `StackHeader`, `TabBar`, `TabsHeader`, `GradientBackground`, `SOSButton`, `AppSnackbar`, `KeyboardAvoidingDialog`, `SecretGestureDetector`
- `src/components/auth/` — Auth forms: `EmailLoginForm`, `PhonePasswordLoginForm`, `SignupForm`, `EmailVerificationComponent`
- `src/components/diary/` — Diary: `DiaryForm`, `DiaryEntryCard`, `DiaryImagePicker`, `EmotionSelector`, `TagSelector`
- Root-level: `BiometricLockScreen`, `PermissionsManager`, `PermissionsSetup`, `PermissionsStatus`, `NotificationItem`, `NotificationTest`, `AuthErrorDisplay`

### Backend (Supabase only — no external server)

- Client config: `lib/supabase.ts` — uses `expo-secure-store` on mobile (with chunking for sessions >2048 bytes), `localStorage` on web.
- Remote DB tables: `profiles`, `guardians`, `safety_diary_entries`, `audio_recordings`, `documents`, `emergency_alerts`, `user_push_tokens`, `notification_logs` (see `supabase/migrations/`).
- Storage buckets:

| Bucket | Visibility | Max Size | Allowed MIME |
|---|---|---|---|
| `avatars` | Public | 5 MB | PNG, JPEG, WebP |
| `images` | Public | 10 MB | PNG, JPEG, WebP, GIF |
| `audios` | Private (RLS) | 50 MB | MP3, WAV, M4A, AAC |
| `documentos` | Private (RLS) | 50 MB | PDF, Word, Images, TXT |
| `diary-photos` | Private (RLS) | 10 MB | PNG, JPEG, WebP, HEIC |

- Edge Functions (`supabase/functions/`):
  - `sync-pull` — `GET ?since=<ms>` — returns all user data updated after timestamp (profile, guardians, diary_entries, audio_recordings, documents, deleted_ids)
  - `sync-push` — `POST {entityType, operation, payload}` — routes writes to the correct table. Entities: guardians, diary-entries, profiles, audio-recordings, documents, emergency-alerts
  - `send-push` — sends Expo push notifications (by token or userId)
  - `send-notification` — sends push + email notifications via Supabase Admin
- Migrations in `supabase/migrations/` — 4 files: `0001_core_tables`, `0002_auth_triggers`, `0003_rls`, `0004_storage`

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).

### i18n

Translations in `lib/locales/` (pt, en, ar, tr). Device locale auto-detected via `expo-localization`. Managed with `i18n-js`.

## Key Patterns

- **Forms**: Formik + Yup validation throughout auth and profile screens.
- **Permissions**: Always use `usePermissions()` hook before accessing camera, microphone, location.
- **Secure storage**: Use `expo-secure-store` (not AsyncStorage) for any sensitive data on mobile.
- **Signed URLs**: Files in Supabase storage are private — always generate signed URLs for access.
- **RLS**: All Supabase tables use Row-Level Security; queries will silently return empty if auth context is missing.
- **Soft-delete**: Models use `is_deleted` boolean flag — filter it in queries; sync handles propagation.
- **Offline-first sync queue**: All writes go to local WatermelonDB first, then enqueue a `SyncQueueItem`. The sync queue observer picks up pending items and pushes via `SyncService`.
- **Biometric lock**: `BiometricLockScreen` component gates access on cold start and background return. Lock timeout is configurable (1/5/15/30 min) via `usePrivacySettings()`.
- **Disguised mode**: Hides the app's real purpose — toggled via `DisguisedModeContext`, accessible from privacy settings and the `disguised-mode` screen.

## MCPs

- always use serena mcp (when available) for semantic code retrieval and editing tools
