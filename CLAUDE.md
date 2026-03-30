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
```

Run a single test file:

```bash
npx jest path/to/test.spec.ts
```

## Environment Setup

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...
EXPO_PUBLIC_USE_PHONE_AUTH=true
# Optional: override Edge Functions base URL (defaults to SUPABASE_URL/functions/v1)
# EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1
```

## Architecture

### Routing (Expo Router — file-based)

- `app/(auth)/` — Unauthenticated screens (login, signup, forgot-password, verify-email)
- `app/(tabs)/` — Main tabbed interface: SOS (`index`), Rede (`guardioes`), Guia (`orientacao`), Apoio (`apoio`), Menu (`config-profile`); secondary screens (no tab): `documentos`, `arquivo`, `settings`
- `app/diary/` — Safety diary feature
- Navigation is gated by auth state and disguised mode, both from Context providers.

### State Management

**React Context** (`src/context/`): `SupabaseAuthContext`, `ThemeContext`, `NotificationContext`, `DisguisedModeContext` — use `useAuth()` and the other context hooks.

**Local-first data**: [WatermelonDB](https://nozbe.github.io/WatermelonDB/) in `src/database/` (models + `schema.ts`) with **Zustand** stores in `src/stores/` and reactive observers in `src/stores/observers/`.

**Sync**: `src/providers/DatabaseProvider.tsx` mounts observers, tracks connectivity (`@react-native-community/netinfo`), and runs `SyncService` (`src/services/SyncService.ts`). HTTP sync uses `src/services/ApiClient.ts` (axios) with Supabase bearer token; base URL derived from `EXPO_PUBLIC_SUPABASE_URL/functions/v1` (no external NestJS backend).

### Custom Hooks (`src/hooks/`)

Business logic lives here, not in components:

- `useAudioRecording()` — Capture audio + upload to Supabase storage
- `useDocumentUpload()` / `useImageUpload()` — File uploads
- `useGuardians()` — Emergency contacts CRUD
- `useSafetyDiary()` — Diary entries with emotion/location
- `useBiometricAuth()` — Fingerprint/Face ID
- `useEdgeFunctions()` — Supabase Edge Function calls
- `useOfflineAlerts()` — Offline mode behavior
- `useAppSnackbar()` — In-app snackbar messages

### Backend (Supabase only — no external server)

- Client config: `lib/supabase.ts` — uses `expo-secure-store` on mobile, `localStorage` on web.
- Remote DB tables: `profiles`, `guardians`, `safety_diary_entries`, `audio_recordings`, `documents`, `emergency_alerts`, `user_push_tokens`, `notification_logs` (see `supabase/migrations/`).
- Storage buckets: `documentos`, `audios`, `diary-photos` (private, RLS by user folder), `avatars`, `images` (public).
- Edge Functions (`supabase/functions/`):
  - `sync-pull` — `GET ?since=<ms>` — returns all user data updated after timestamp
  - `sync-push` — `POST {entityType, operation, payload}` — routes writes to the correct table
  - `send-push` — sends Expo push notifications
  - `send-notification` — sends push + email notifications via Supabase Admin
- Migrations in `supabase/migrations/` — 4 files: `0001_core_tables`, `0002_auth_triggers`, `0003_rls`, `0004_storage`

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).

### i18n

Translations in `lib/locales/` (pt, en, ar, tr). Device locale auto-detected via `expo-localization`.

## Key Patterns

- **Forms**: Formik + Yup validation throughout auth and profile screens.
- **Permissions**: Always use `usePermissions()` hook before accessing camera, microphone, location.
- **Secure storage**: Use `expo-secure-store` (not AsyncStorage) for any sensitive data on mobile.
- **Signed URLs**: Files in Supabase storage are private — always generate signed URLs for access.
- **RLS**: All Supabase tables use Row-Level Security; queries will silently return empty if auth context is missing.

## MCPs

- always use serena mcp (when avaialble) for semantic code retrieval and editing tools
