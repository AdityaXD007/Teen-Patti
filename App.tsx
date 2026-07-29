import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Updates from 'expo-updates';
import { RootNavigator } from './navigation/RootNavigator';
import { useStore } from './store/useStore';
import * as Sentry from '@sentry/react-native';
import analytics from '@react-native-firebase/analytics';

Sentry.init({
  dsn: 'https://0873552e1110a69dab109c6600593381@o4506500963041280.ingest.us.sentry.io/4511590910263296',
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default Sentry.wrap(function App() {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateSubtext, setUpdateSubtext] = useState('Please wait while we update the app');

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

    // Check for EAS OTA Updates
    const checkForEASUpdate = async () => {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setIsCheckingUpdate(true);
          setUpdateSubtext('Downloading new update...');
          await Updates.fetchUpdateAsync();
          setUpdateSubtext('Applying update and restarting...');
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('[EAS Updates] Check failed:', error);
      } finally {
        setIsCheckingUpdate(false);
      }
    };

    checkForEASUpdate();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
          <StatusBar style="light" />
          <RootNavigator />

          {/* EAS Update Overlay Modal */}
          <Modal
            visible={isCheckingUpdate}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
          >
            <View style={styles.updateModalOverlay}>
              <View style={styles.updateModalContent}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.updateText}>
                  Updating...
                </Text>
                <Text style={styles.updateSubtext}>
                  {updateSubtext}
                </Text>
              </View>
            </View>
          </Modal>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  updateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  updateModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  updateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F0F0F0',
    marginTop: 16,
    marginBottom: 6,
  },
  updateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});
