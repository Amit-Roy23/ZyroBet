import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || 'development';
  const isProd = env === 'production';

  const appName = process.env.APP_NAME || 'ZyroBet';
  const appSlug = process.env.APP_SLUG || 'zyrobet';
  const appScheme = process.env.APP_SCHEME || 'zyrobet';
  const iosBundleId = process.env.IOS_BUNDLE_ID || 'com.zyrobet.app';
  const androidPackage = process.env.ANDROID_PACKAGE || 'com.zyrobet.app';
  const appLinkDomain = process.env.APP_LINK_DOMAIN || '';
  const easProjectId = process.env.EAS_PROJECT_ID || '00000000-0000-0000-0000-000000000000';
  const googleIosUrlScheme =
    process.env.GOOGLE_IOS_URL_SCHEME || 'com.googleusercontent.apps.000000000000-placeholder';
  const sentryOrg = process.env.SENTRY_ORG || 'zyrobet';
  const sentryProject = process.env.SENTRY_PROJECT || 'zyrobet-mobile';
  const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;

  // Build Android Intent Filters for App Links & Custom Schemes
  const androidIntentFilters: any[] = [
    {
      action: 'VIEW',
      data: [{ scheme: appScheme }],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ];

  if (appLinkDomain) {
    androidIntentFilters.push({
      action: 'VIEW',
      autoVerify: true,
      data: [
        {
          scheme: 'https',
          host: appLinkDomain,
          pathPrefix: '/',
        },
      ],
      category: ['BROWSABLE', 'DEFAULT'],
    });
  }

  return {
    ...config,
    name: appName,
    slug: appSlug,
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    icon: './assets/branding/icon.png',
    scheme: appScheme,
    updates: {
      url: `https://u.expo.dev/${easProjectId}`,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'fingerprint',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: isProd ? iosBundleId : `${iosBundleId}.${env}`,
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          'ZyroBet needs access to your photo library so you can select and customize your profile avatar.',
      },
      associatedDomains: appLinkDomain ? [`applinks:${appLinkDomain}`] : undefined,
    },
    android: {
      package: isProd ? androidPackage : `${androidPackage}.${env}`,
      adaptiveIcon: {
        foregroundImage: './assets/branding/adaptive-icon.png',
        backgroundColor: '#07140F',
      },
      predictiveBackGestureEnabled: false,
      permissions: ['POST_NOTIFICATIONS', 'VIBRATE', 'com.android.vending.BILLING'],
      intentFilters: androidIntentFilters,
      googleServicesFile: googleServicesJson || undefined,
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/branding/favicon.png',
      name: appName,
      themeColor: '#07140F',
      backgroundColor: '#07140F',
    },
    plugins: [
      'expo-router',
      'expo-dev-client',
      'expo-updates',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.4',
          },
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: '35.0.0',
          },
        },
      ],
      'expo-secure-store',
      'expo-apple-authentication',
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: googleIosUrlScheme,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/branding/icon.png',
          color: '#2ECC71',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow ZyroBet to access your photos to select an avatar.',
        },
      ],
      'expo-audio',
      'expo-font',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#07140F',
          image: './assets/branding/splash.png',
          imageWidth: 200,
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          organization: sentryOrg,
          project: sentryProject,
        },
      ],
      'expo-localization',
      'expo-screen-orientation',
      'expo-system-ui',
      'expo-status-bar',
      '@react-native-community/datetimepicker',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: easProjectId,
      },
      env,
      appScheme,
      appLinkDomain,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  };
};
