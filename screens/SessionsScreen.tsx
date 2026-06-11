import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions, Modal, TextInput } from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useStore, Session } from '../store/useStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../components/EmptyState';

const { width } = Dimensions.get('window');

export const SessionsScreen = ({ navigation }: any) => {
  const sessions = useStore(state => state.sessions);
  const loadSessions = useStore(state => state.loadSessions);
  const deleteSession = useStore(state => state.deleteSession);
  const joinSession = useStore(state => state.joinSession);

  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      setLoading(false);
    }
    // Also stop loading after a timeout in case there are genuinely 0 sessions
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [sessions]);

  const confirmDelete = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to remove this session? If you are the last person, it will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteSession(sessionId) }
      ]
    );
  };

  const executeJoin = async (code: string) => {
    try {
      await joinSession(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsJoinModalVisible(false);
      setJoinCode('');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message || 'Could not join session.');
    }
  };

  const handleJoin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    executeJoin(joinCode);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission Required', 'We need access to your camera to scan QR codes.');
        return;
      }
    }
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsScannerVisible(false);
    // Assuming join codes are 6 chars, or just attempt to join with the string
    setJoinCode(data);
    setTimeout(() => executeJoin(data), 300);
  };

  const getSuitIcon = (index: number) => {
    const suits = ['cards-spade', 'cards-heart', 'cards-diamond', 'cards-club'] as const;
    return suits[index % suits.length];
  };

  const renderItem = ({ item, index }: { item: Session, index: number }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('SessionDetail', { sessionId: item.id });
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        confirmDelete(item.id);
      }}
    >
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name={getSuitIcon(index)}
            size={24}
            color={index % 2 === 0 ? theme.colors.textSecondary : theme.colors.lossRed}
          />
          <Text style={styles.sessionDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.sessionName}>{item.name}</Text>
        <View style={styles.stats}>
          <View style={styles.statChip}>
            <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.accent} />
            <Text style={styles.statText}>{item.players.length} Players</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Total Rounds:</Text>
            <Text style={styles.statText}>{item.rounds.length}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LottieView
          source={require('../assets/animations/cardflip.json')}
          autoPlay={true}
          loop={true}
          style={{ width: 80, height: 80, alignSelf: 'center' }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="cards-playing-outline" size={32} color={theme.colors.accent} />
        <Text style={styles.title}>Teen Patti Tracker</Text>
        <MaterialCommunityIcons name="cards-playing-outline" size={32} color={theme.colors.accent} style={{ transform: [{ scaleX: -1 }] }} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="cards-playing-outline" message="No tables yet. Create or join a game." />}
      />

      <View style={[styles.actionButtons, { bottom: Math.max(theme.spacing.xl, insets.bottom + theme.spacing.md) }]}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsJoinModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="account-arrow-right-outline" size={24} color={theme.colors.accent} />
          <Text style={styles.actionTextSecondary}>Join</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('CreateSession');
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.background} />
          <Text style={styles.actionText}>New Session</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isJoinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Game Table</Text>
            <Text style={styles.modalSubtitle}>Enter the code or scan a QR code from a friend.</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl }}>
              <TextInput
                style={[styles.codeInput, { flex: 1, marginBottom: 0 }]}
                placeholder="e.g. A7X9B2"
                placeholderTextColor={theme.colors.textSecondary}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity 
                style={{ marginLeft: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.borderRadius.md }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openScanner();
                }}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={32} color={theme.colors.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsJoinModalVisible(false);
              }}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnJoin} onPress={handleJoin} disabled={joinCode.length < 6}>
                <Text style={[styles.modalBtnJoinText, joinCode.length < 6 && { opacity: 0.5 }]}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isScannerVisible} transparent={false} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          
          <SafeAreaView style={{ position: 'absolute', top: 0, width: '100%', flexDirection: 'row', justifyContent: 'flex-end', padding: theme.spacing.md }}>
            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: theme.spacing.md, borderRadius: 50 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsScannerVisible(false);
              }}
            >
              <MaterialCommunityIcons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>
          
          <View style={{ position: 'absolute', top: '20%', width: '100%', alignItems: 'center' }}>
             <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 10 }}>
                Scan Table QR Code
             </Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.accent,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100, // Make room for FAB
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    // Add subtle shadow for card effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardInner: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.1)', // Subtle gold inner border
    borderRadius: theme.borderRadius.md - 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sessionName: {
    ...theme.typography.sectionHeader,
    fontSize: 20,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  sessionDate: {
    ...theme.typography.caption,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  statText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.xs,
    fontWeight: 'bold',
  },
  actionButtons: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: theme.spacing.md,
  },
  actionBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  actionBtnPrimary: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  actionText: {
    ...theme.typography.sectionHeader,
    color: theme.colors.background,
    marginLeft: theme.spacing.xs,
  },
  actionTextSecondary: {
    ...theme.typography.sectionHeader,
    color: theme.colors.accent,
    marginLeft: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  codeInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textPrimary,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  modalBtnCancel: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
  },
  modalBtnCancelText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  modalBtnJoin: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
  },
  modalBtnJoinText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
});
