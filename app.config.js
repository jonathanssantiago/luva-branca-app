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
    assetBundlePatterns: ['assets/images/*', 'assets/fonts/*'],
    ios: {
      deploymentTarget: '17.0',
      supportsTablet: true,
      entitlements: {
        'aps-environment': 'production',
      },
      infoPlist: {
        CFBundleAllowMixedLocalizations: true,
        ExpoLocalization_supportsRTL: true,
        ITSAppUsesNonExemptEncryption: false,

        // Permissões iOS
        NSLocationWhenInUseUsageDescription:
          'Este app precisa acessar sua localização para funcionar corretamente.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Este app precisa acessar sua localização mesmo em segundo plano.',
        NSMicrophoneUsageDescription:
          'Este app precisa acessar o microfone para gravar áudio.',
        NSCameraUsageDescription:
          'Este app pode usar a câmera para recursos futuros.',
        NSPhotoLibraryUsageDescription:
          'Este app pode acessar sua galeria para funcionalidades futuras.',
        NSPhotoLibraryAddUsageDescription:
          'Este app pode salvar imagens no seu dispositivo.',
        UNUserNotificationCenterUsageDescription:
          'Este app precisa enviar notificações.',

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
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'SEND_SMS',
        'READ_SMS',
        'RECORD_AUDIO',
        'CAMERA',
        'FOREGROUND_SERVICE',
        'POST_NOTIFICATIONS',
      ],
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
        projectId: '3f50e723-ba82-4b4a-a80a-6048cb4f758c',
      },
    },
  },
}
