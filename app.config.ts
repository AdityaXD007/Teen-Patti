import { ConfigContext, ExpoConfig } from 'expo/config'

// APP EAS CONFIG
const EAS_PROJECT_ID = '09cc93dc-0fb9-4f49-803f-0a6961fe7cf2'
const PROJECT_SLUG = 'teen-patti-tracker'
const OWNER = 'everest-technologies'

// App Production Config
const APP_NAME = 'Teen Patti Tracker'
const BUNDLE_IDENTIFIER = 'com.techeverest.teenpattitracker'
const PACKAGE_NAME = 'com.techeverest.teenpattitracker'
const SCHEME = 'teenpattitracker-app-scheme'

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: APP_NAME,
    version: '1.0.0',
    slug: PROJECT_SLUG,
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: SCHEME,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      buildNumber: '5',
      usesAppleSignIn: true,
      supportsTablet: true,
      runtimeVersion: '1.0.0',
      bundleIdentifier: BUNDLE_IDENTIFIER,
      googleServicesFile: './GoogleService-Info.plist',
      associatedDomains: ['applinks:teenpattitracker.com'],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      icon: {
        dark: "./assets/ios-dark.png",
        light: "./assets/ios-light.png",
        tinted: "./assets/ios-tinted.png",
      },
    },
    android: {
      ...config.android,
      versionCode: 43,
      runtimeVersion: '1.0.0',
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: './assets/icon.png',
        backgroundColor: '#FFFFFF',
      },
      edgeToEdgeEnabled: true,
      package: PACKAGE_NAME,
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
    },
    plugins: [
      "expo-font",
      "@react-native-firebase/app",
      "./plugins/withFirebaseModularHeaders.js",
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "teen-patti",
          "organization": "everest-technologies"
        }
      ],
      "@react-native-firebase/analytics",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Teen Patti Tracker to access your camera.",
          "microphonePermission": false,
          "recordAudioAndroid": false
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "2.1.20",
            "gradleVersion": "8.13",
            "agpVersion": "8.7.3"
          }
        }
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
    owner: OWNER,

    "updates": {
      "url": "https://u.expo.dev/09cc93dc-0fb9-4f49-803f-0a6961fe7cf2",
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 3000,

    }
  }
}
