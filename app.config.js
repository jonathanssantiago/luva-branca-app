import 'dotenv/config'

export default {
  expo: {
    name: 'Luva Branca',
    slug: 'luva-branca-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/luva-branca-icon.png',
    scheme: 'luva-branca',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    platforms: ['ios', 'android'],
    splash: {
      image: './assets/images/luva-branca-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      infoPlist: {
        CFBundleAllowMixedLocalizations: true,
        ExpoLocalization_supportsRTL: true,
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['luva-branca'],
          },
        ],
      },
      bundleIdentifier: 'com.jonathanssantiago.luva-branca-app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.jonathanssantiago.luva_branca_app',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'luva-branca',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: 'your-project-id',
      },
    },
  },
}
