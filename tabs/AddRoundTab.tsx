import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { theme } from '../constants/theme';
import { useStore, Round } from '../store/useStore';
import { RoundItem } from '../components/RoundItem';
import { EditRoundModal } from '../components/EditRoundModal';

export const AddRoundTab = ({ route, navigation }: any) => {
  const { sessionId } = route.params;
  const session = useStore(state => state.sessions.find(s => s.id === sessionId));
  const addRound = useStore(state => state.addRound);
  const editRound = useStore(state => state.editRound);
  const deleteRound = useStore(state => state.deleteRound);
  const insets = useSafeAreaInsets();
  const confettiRef = useRef<LottieView>(null);

  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [editingRound, setEditingRound] = useState<Round | null>(null);

  if (!session) return null;

  const handleSetWinner = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Setting winner:', id);
    setWinnerId(id);
  };

  const amount = parseInt(amountStr, 10);
  const tooFewPlayers = session.players.length < 2;
  const isValid = winnerId && !isNaN(amount) && amount > 0 && !tooFewPlayers;

  const handleAddRound = async () => {
    if (isValid && !tooFewPlayers) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addRound(sessionId, winnerId, amount);
      confettiRef.current?.play();
      setWinnerId(null);
      setAmountStr('');
    }
  };

  const getWinnerName = () => session.players.find(p => p.id === winnerId)?.name;

  const handleEditSave = (newWinnerId: string, newStake: number) => {
    if (!editingRound) return;
    editRound(sessionId, editingRound.id, newWinnerId, newStake);
    setEditingRound(null);
  };

  const confirmDeleteRound = (roundId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Round',
      'Are you sure? Player balances will be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteRound(sessionId, roundId);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Who won?</Text>
        <View style={styles.chipsContainer}>
          {session.players.map(p => (
            <View key={p.id}>
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.chip,
                  winnerId === p.id && styles.chipWinner
                ]}
                onPress={() => handleSetWinner(p.id)}
              >
                <Text style={[styles.chipText, winnerId === p.id && styles.chipTextSelected]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Stake per player</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>Rs. </Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
            value={amountStr}
            onChangeText={setAmountStr}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAmountsContainer}>
          {(() => {
            const recentStakes = Array.from(new Set(session.rounds.map(r => r.stake))).slice(0, 5);
            const quickAmounts = recentStakes.length > 0 ? recentStakes : [10, 20, 50, 100];
            return quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickAmountChip}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAmountStr(amt.toString());
                }}
              >
                <Text style={styles.quickAmountText}>+{amt}</Text>
              </TouchableOpacity>
            ));
          })()}
        </ScrollView>

        {isValid && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              <Text style={{ color: theme.colors.winGreen }}>{getWinnerName()}</Text>
              {' wins Rs. '}{amount * session.players.length}
            </Text>
            <Text style={[styles.previewText, { marginTop: 4, fontSize: 13, color: theme.colors.textSecondary }]}>
              Each player stakes Rs. {amount} · {session.players.length} players
            </Text>
          </View>
        )}

        {tooFewPlayers && (
          <View style={[styles.previewBox, { borderColor: theme.colors.lossRed }]}>
            <Text style={[styles.previewText, { color: theme.colors.lossRed }]}>
              Need at least 2 players to record a round.
            </Text>
          </View>
        )}

        {session.rounds.length > 0 && (
          <View style={styles.recentRoundsSection}>
            <Text style={styles.recentRoundsTitle}>Recent Rounds</Text>
            {session.rounds.slice(0, 5).map((round) => (
              <RoundItem
                key={round.id}
                round={round}
                onEdit={() => setEditingRound(round)}
                onDelete={() => confirmDeleteRound(round.id)}
              />
            ))}
          </View>
        )}

      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <TouchableOpacity
          style={[styles.addButton, !isValid && styles.addButtonDisabled]}
          onPress={handleAddRound}
          disabled={!isValid}
        >
          <Text style={[styles.addButtonText, !isValid && styles.addButtonTextDisabled]}>
            Add Round
          </Text>
        </TouchableOpacity>
      </View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LottieView
          ref={confettiRef}
          source={require('../assets/animations/confetti.json')}
          autoPlay={false}
          loop={false}
          style={{ width: '100%', height: '100%', zIndex: 99 }}
        />
      </View>
      <EditRoundModal
        visible={!!editingRound}
        round={editingRound}
        players={session.players}
        onSave={handleEditSave}
        onCancel={() => setEditingRound(null)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  label: {
    ...theme.typography.sectionHeader,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  chipWinner: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
    borderStyle: 'solid',
    borderWidth: 2,
  },
  chipLoser: {
    backgroundColor: '#F4433622',
    borderColor: theme.colors.lossRed,
    borderStyle: 'solid',
    borderWidth: 2,
  },
  chipText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  chipTextSelected: {
    fontWeight: 'bold',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  currencySymbol: {
    ...theme.typography.title,
    color: theme.colors.accent,
    marginRight: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    ...theme.typography.title,
    paddingVertical: theme.spacing.md,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  quickAmountChip: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickAmountText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  previewBox: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.accent,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  previewText: {
    ...theme.typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  recentRoundsSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  recentRoundsTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    backgroundColor: theme.colors.background,
  },
  addButton: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(13, 13, 13, 0.3)',
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
  },
  addButtonText: {
    fontSize: theme.typography.sectionHeader.fontSize,
    fontWeight: theme.typography.sectionHeader.fontWeight,
    color: theme.colors.background,
  },
  addButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
});
