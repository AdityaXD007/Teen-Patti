import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { RootNavigator } from './navigation/RootNavigator';
import { useStore } from './store/useStore';
import * as Sentry from '@sentry/react-native';
import analytics from '@react-native-firebase/analytics';

Sentry.init({
  dsn: 'https://0873552e1110a69dab109c6600593381@o4506500963041280.ingest.us.sentry.io/4511590910263296',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function App() {
  useEffect(() => {
    useStore.getState().initializeAuth();

    // Log app open to Firebase Analytics
    const logAppOpen = async () => {
      try {
        await analytics().logEvent('app_open');
      } catch (e) {
        console.log('Analytics not ready or errored:', e);
      }
    };
    logAppOpen();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
          <StatusBar style="light" />
          <RootNavigator />
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
});
