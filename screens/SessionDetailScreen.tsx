import React, { useState } from 'react';
import { TouchableOpacity, Alert, View, Modal, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useStore } from '../store/useStore';

import { LeaderboardTab } from '../tabs/LeaderboardTab';
import { AddRoundTab } from '../tabs/AddRoundTab';
import { HistoryTab } from '../tabs/HistoryTab';

const Tab = createBottomTabNavigator();

export const SessionDetailScreen = ({ route, navigation }: any) => {
  const { sessionId } = route.params;
  const session = useStore(state => state.sessions.find(s => s.id === sessionId));
  const deleteSession = useStore(state => state.deleteSession);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  React.useEffect(() => {
    if (!session) {
      navigation.goBack();
    }
  }, [session, navigation]);

  if (!session) {
    navigation.goBack();
    return null;
  }

  const confirmDelete = () => {
    Alert.alert(
      'Delete Game Table',
      'Are you sure you want to delete this table? All history will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteSession(sessionId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'cards-playing-outline';

            if (route.name === 'Leaderboard') {
              iconName = focused ? 'crown' : 'crown-outline';
            } else if (route.name === 'AddRound') {
              iconName = focused ? 'poker-chip' : 'circle-multiple-outline';
            } else if (route.name === 'History') {
              iconName = 'clipboard-text-clock-outline';
            }

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
          headerStyle: {
            backgroundColor: theme.colors.surface,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            ...theme.typography.sectionHeader,
          },
          headerTitle: session.name,
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }} style={{ paddingLeft: theme.spacing.md, paddingRight: theme.spacing.md }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsShareModalVisible(true);
                }}
                style={{ paddingRight: theme.spacing.sm }}
              >
                <MaterialCommunityIcons name="share-variant" size={24} color={theme.colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                confirmDelete();
              }} style={{ paddingLeft: theme.spacing.sm, paddingRight: theme.spacing.md }}>
                <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.lossRed} />
              </TouchableOpacity>
            </View>
          ),
        })}
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      >
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardTab}
          initialParams={{ sessionId }}
          options={{ title: 'Leaderboard' }}
        />
        <Tab.Screen
          name="AddRound"
          component={AddRoundTab}
          initialParams={{ sessionId }}
          options={{ title: 'Add Round' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryTab}
          initialParams={{ sessionId }}
          options={{ title: 'History' }}
        />
      </Tab.Navigator>

      <Modal visible={isShareModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Session</Text>
            <Text style={styles.modalSubtitle}>Scan this QR code to join</Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={session.joinCode}
                size={220}
                color={theme.colors.background}
                backgroundColor={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.modalSubtitle}>OR</Text>
            <Text style={styles.codeText}>{session.joinCode}</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsShareModalVisible(false);
            }}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    ...theme.typography.sectionHeader,
    fontSize: 24,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  qrContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  codeText: {
    color: theme.colors.accent,
    fontSize: 32,
    letterSpacing: 8,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xl,
  },
  closeBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeBtnText: {
    ...theme.typography.sectionHeader,
    color: theme.colors.textPrimary,
  },
});
