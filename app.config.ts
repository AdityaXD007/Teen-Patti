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
    icon: config.icon || './assets/icon.png',
    scheme: scheme,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      buildNumber: '1',
      usesAppleSignIn: true,
      supportsTablet: true,
      runtimeVersion: runtimeVersion,
      bundleIdentifier: bundleIdentifier,
      associatedDomains: ['applinks:teenpattitracker.com'],
    },
    android: {
      ...config.android,
      googleServicesFile: './google-services.json',
      runtimeVersion: '1.0.0',
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        backgroundColor: '#FFFFFF',
      },
      edgeToEdgeEnabled: true,
      package: packageName,
    },
    web: {
      ...config.web,
      bundler: 'metro',
      output: 'single',
    },
    plugins: [
         "@react-native-firebase/app",
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "react-native",
          "organization": "aditya-ts"
        }
      ],
      "@react-native-firebase/analytics",
    ],
    extra: {
      router: {},
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
    owner: OWNER,
    updates: {
      url: 'https://u.expo.dev/c709737c-ad4b-4258-9564-319e5c9c9ae7',
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
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
      name: `${APP_NAME} (Prev)`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.prev`,
      packageName: `${PACKAGE_NAME}.prev`,
      scheme: `${SCHEME}-prev`,
      runtimeVersion: {
        policy: 'appVersion',
      },
    }
  }
  return {
    name: `${APP_NAME} (Dev)`,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
    packageName: `${PACKAGE_NAME}.dev`,
    scheme: `${SCHEME}-dev`,
    runtimeVersion: '1.0.0',
  }
}