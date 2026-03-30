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
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_USE_PHONE_AUTH=true
```

## Architecture

### Routing (Expo Router — file-based)
- `app/(auth)/` — Unauthenticated screens (login, signup, forgot-password, verify-email)
- `app/(tabs)/` — Main tabbed interface (home, apoio, arquivo, documentos, guardioes, orientacao, settings)
- `app/diary/` — Safety diary feature
- Navigation is gated by auth state and disguised mode, both from Context providers.

### State Management (React Context)
Four global contexts in `src/context/`:
- `SupabaseAuthContext` — Auth session, biometric login, offline access. Source of truth for user identity.
- `ThemeContext` — Light/dark mode + color palette selection.
- `NotificationContext` — Push and local notifications via Expo.
- `DisguisedModeContext` — Toggles alternate "innocent-looking" UI for privacy/safety.

Consume with custom hooks: `useAuth()`, and direct context hooks for others.

### Custom Hooks (`src/hooks/`)
Business logic lives here, not in components:
- `useAudioRecording()` — Capture audio + upload to Supabase storage
- `useDocumentUpload()` / `useImageUpload()` — File uploads
- `useGuardians()` — Emergency contacts CRUD
- `useSafetyDiary()` — Diary entries with emotion/location
- `useBiometricAuth()` — Fingerprint/Face ID
- `useEdgeFunctions()` — Supabase Edge Function calls
- `useOfflineAlerts()` — Offline mode behavior

### Backend (Supabase)
- Client config: `lib/supabase.ts` — uses `expo-secure-store` on mobile, `localStorage` on web.
- Database tables: `profiles`, `guardians`, `safety_diary_entries`
- Storage buckets: `avatars`, `images`, `documents`, `audios`, `diary-photos`
- Edge Functions in `supabase/functions/` (deploy via Supabase CLI)
- Migrations in `supabase/migrations/`

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