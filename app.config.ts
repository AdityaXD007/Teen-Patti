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
  console.log(' - Building app for environment: ', process.env.APP_ENV)
  const { name, bundleIdentifier, packageName, scheme, runtimeVersion } =
    getDynamicAppConfig(
      process.env.APP_ENV as 'development' | 'preview' | 'production'
    )
  return {
    ...config,
    name: name,
    version: '1.0.0',
    slug: PROJECT_SLUG,
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: scheme,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      buildNumber: '2',
      usesAppleSignIn: true,
      supportsTablet: true,
      runtimeVersion: runtimeVersion,
      bundleIdentifier: bundleIdentifier,
      googleServicesFile: './GoogleService-Info.plist',
      associatedDomains: ['applinks:teenpattitracker.com'],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSUserTrackingUsageDescription: "This identifier will be used to deliver personalized ads and for analytics purposes to improve the app.",
      },
      icon: {
        dark: "./assets/ios-dark.png",
        light: "./assets/ios-light.png",
        tinted: "./assets/ios-tinted.png",
      },
    },
    android: {
      ...config.android,
      versionCode: 41,
      runtimeVersion: '1.0.0',
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: './assets/icon.png',
        backgroundColor: '#FFFFFF',
      },
      edgeToEdgeEnabled: true,
      package: packageName,
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
    },
    plugins: [
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
      ]
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
      fallbackToCacheTimeout: 0,

    }
  }
}

// Get Dynamic App Config based on the environment
export const getDynamicAppConfig = (
  environment: 'development' | 'preview' | 'production'
): {
  name: string
  bundleIdentifier: string
  packageName: string
  scheme: string
  runtimeVersion:
  | string
  | { policy: 'appVersion' | 'sdkVersion' | 'nativeVersion' | 'fingerprint' }
} => {
  if (environment === 'production') {
    return {
      name: APP_NAME,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      packageName: PACKAGE_NAME,
      scheme: SCHEME,
      runtimeVersion: '1.0.0',
    }
  }
  if (environment === 'preview') {
    return {
      name: APP_NAME,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.prev`,
      packageName: `${PACKAGE_NAME}.prev`,
      scheme: `${SCHEME}-prev`,
      runtimeVersion: {
        policy: 'appVersion',
      },
    }
  }
  return {
    name: APP_NAME,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
    packageName: `${PACKAGE_NAME}.dev`,
    scheme: `${SCHEME}-dev`,
    runtimeVersion: '1.0.0',
  }
}