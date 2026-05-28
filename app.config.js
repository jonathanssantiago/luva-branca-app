import 'dotenv/config'

export default {
  expo: {
    name: 'SIAPeP-M',
    slug: 'siapepm-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/siapep.png',
    scheme: 'siapepm',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    platforms: ['ios', 'android'],
    splash: {
      image: './assets/images/siapep-splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    assetBundlePatterns: ['assets/images/*', 'assets/fonts/*'],
    ios: {
      googleServicesFile: './GoogleService-Info.plist',
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
        NSFaceIDUsageDescription:
          'Este app usa Face ID para proteger seu acesso.',
        UNUserNotificationCenterUsageDescription:
          'Este app precisa enviar notificações.',

        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['siapepm'],
          },
        ],
      },
      bundleIdentifier: 'com.jonathanssantiago.siapepm-app',
    },
    android: {
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        foregroundImage: './assets/images/siapep.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.jonathanssantiago.siapepm',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'SEND_SMS',
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
              scheme: 'siapepm',
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
    plugins: [
      'expo-router',
      './plugins/withSimdjson',
      './plugins/withFmtCxx17',
      './plugins/withModularHeaders',
      './plugins/withEntitlementsModification',
      '@react-native-firebase/app',
      [
        'expo-notifications',
        {
          icon: './assets/images/siapep.png',
          color: '#ffffff',
          androidMode: 'default',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      eas: {
        projectId: '3f50e723-ba82-4b4a-a80a-6048cb4f758c',
      },
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    },
  },
}
