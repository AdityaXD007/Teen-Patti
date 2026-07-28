import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, TextInput, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useStore, Player, getRoundParticipants } from '../store/useStore';
import { PlayerCard } from '../components/PlayerCard';

interface Settlement {
  from: Player;
  to: Player;
  amount: number;
}

const computeSettlements = (players: Player[]): Settlement[] => {
  // Create mutable copies of balances
  const debtors: { player: Player; amount: number }[] = [];
  const creditors: { player: Player; amount: number }[] = [];

  for (const p of players) {
    const bal = Math.round(p.balance);
    if (bal < 0) debtors.push({ player: p, amount: -bal });
    else if (bal > 0) creditors.push({ player: p, amount: bal });
  }

  // Sort: biggest debtor first, biggest creditor first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const transferAmount = Math.min(debtors[di].amount, creditors[ci].amount);
    if (transferAmount > 0) {
      settlements.push({
        from: debtors[di].player,
        to: creditors[ci].player,
        amount: transferAmount,
      });
    }
    debtors[di].amount -= transferAmount;
    creditors[ci].amount -= transferAmount;
    if (debtors[di].amount === 0) di++;
    if (creditors[ci].amount === 0) ci++;
  }

  return settlements;
};

export const LeaderboardTab = ({ route }: any) => {
  const { sessionId } = route.params;
  const session = useStore(state => state.sessions.find(s => s.id === sessionId));
  const addPlayer = useStore(state => state.addPlayer);
  const markPaymentSettled = useStore(state => state.markPaymentSettled);
  const unmarkPaymentSettled = useStore(state => state.unmarkPaymentSettled);
  const clearSessionHistory = useStore(state => state.clearSessionHistory);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<{ from: Player; to: Player; amount: number; index: number } | null>(null);
  const insets = useSafeAreaInsets();

  const removePlayer = useStore(state => state.removePlayer);

  if (!session) return null;

  const sortedPlayers = [...session.players].sort((a, b) => b.balance - a.balance);

  // Compute per-player stats
  const playerStats = useMemo(() => {
    const stats: { [id: string]: { roundsWon: number; totalRounds: number } } = {};
    for (const p of session.players) {
      stats[p.id] = { roundsWon: 0, totalRounds: 0 };
    }
    for (const round of session.rounds) {
      // Determine which players participated in this round
      const participantIds = round.participantIds || session.players.map(p => p.id);
      for (const pid of participantIds) {
        if (stats[pid]) {
          stats[pid].totalRounds++;
          if (pid === round.winnerId) {
            stats[pid].roundsWon++;
          }
        }
      }
    }
    return stats;
  }, [session.rounds, session.players]);

  // Active unpaid settlements needed right now based on current net balances
  const activeSettlements = useMemo(() => computeSettlements(sortedPlayers), [sortedPlayers]);

  // Completed settled payments history
  const settledPaymentsHistory = useMemo(() => {
    return (session.settledPayments || []).slice().reverse();
  }, [session.settledPayments]);

  const formatSettledTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleMarkSettled = (fromId: string, fromName: string, toId: string, toName: string, amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Confirm Settlement',
      `${fromName} has paid Rs. ${amount} to ${toName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Settled',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await markPaymentSettled(sessionId, fromId, toId, amount);

            // If this was the last active settlement step, pop full settlement confirmation
            if (activeSettlements.length <= 1) {
              setTimeout(() => {
                Alert.alert(
                  '🎉 Table Fully Settled!',
                  'All player balances are settled to EVEN. Would you like to clear the round history to start fresh for your next game?',
                  [
                    { text: 'Keep History', style: 'cancel' },
                    {
                      text: 'Clear & Start Fresh',
                      style: 'destructive',
                      onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        clearSessionHistory(sessionId);
                      }
                    }
                  ]
                );
              }, 400);
            }
          }
        }
      ]
    );
  };

  const handleUndoSettled = (fromId: string, toId: string, amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Undo Settlement',
      'Mark this payment as unsettled again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            unmarkPaymentSettled(sessionId, fromId, toId, amount);
          }
        }
      ]
    );
  };

  // Summary stats
  const totalPot = useMemo(() => {
    return session.rounds.reduce((sum, r) => sum + r.stake * r.playerCount, 0);
  }, [session.rounds]);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(sessionId, newPlayerName);
      setNewPlayerName('');
      setIsAdding(false);
    }
  };

  const handleLongPressPlayer = (playerId: string, playerName: string) => {
    const hasHistory = session.rounds.some(r => r.winnerId === playerId);

    Alert.alert(
      'Remove Player',
      hasHistory
        ? `This player has round history. Delete anyway?`
        : `Are you sure you want to remove ${playerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePlayer(sessionId, playerId) }
      ]
    );
  };

  const renderHeader = () => (
    <>
      {/* Session summary */}
      {session.rounds.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{session.rounds.length}</Text>
              <Text style={styles.summaryLabel}>Rounds</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{session.players.length}</Text>
              <Text style={styles.summaryLabel}>Players</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>Rs. {totalPot}</Text>
              <Text style={styles.summaryLabel}>Total Pot</Text>
            </View>
          </View>
        </View>
      )}

      {/* Section title: Standings */}
      <Text style={styles.sectionTitle}>Standings</Text>
    </>
  );

  const renderFooter = () => (
    <>
      {/* Settlements section */}
      <View style={styles.settlementsSection}>
        <Text style={styles.sectionTitle}>Settlement Plan</Text>
        <Text style={styles.sectionSubtitle}>
          {activeSettlements.length === 0
            ? 'All current balances are settled! ✓'
            : `${activeSettlements.length} ${activeSettlements.length === 1 ? 'payment' : 'payments'} needed to settle remaining balances`}
        </Text>

        {/* Active unpaid settlement steps */}
        {activeSettlements.map((s, i) => (
          <TouchableOpacity
            key={`active-${s.from.id}-${s.to.id}-${i}`}
            style={styles.settlementCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSettlement({ ...s, isHistory: false });
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settlementIconRow}>
              <MaterialCommunityIcons name="cash-fast" size={20} color={theme.colors.accent} />
              <Text style={styles.settlementStepLabel}>Step {i + 1}</Text>
              <View style={{ flex: 1 }} />
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.settlementDescription}>
              <Text style={{ color: theme.colors.lossRed, fontWeight: 'bold' }}>{s.from.name}</Text>
              {' gives '}
              <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>Rs. {s.amount}</Text>
              {' to '}
              <Text style={{ color: theme.colors.winGreen, fontWeight: 'bold' }}>{s.to.name}</Text>
            </Text>
          </TouchableOpacity>
        ))}

        {session.rounds.length > 0 && activeSettlements.length === 0 && (
          <View style={[styles.allEvenCard, { marginBottom: theme.spacing.md }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={28} color={theme.colors.winGreen} />
            <Text style={styles.allEvenText}>All settled! Every player is EVEN.</Text>
            <TouchableOpacity
              style={styles.clearHistoryButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                Alert.alert(
                  'Clear Round History',
                  'Are you sure you want to clear all rounds and start fresh for a new game?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear & Start Fresh',
                      style: 'destructive',
                      onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        clearSessionHistory(sessionId);
                      }
                    }
                  ]
                );
              }}
            >
              <MaterialCommunityIcons name="broom" size={16} color={theme.colors.accent} />
              <Text style={styles.clearHistoryButtonText}>Clear History & Start Fresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed Payments History */}
        {settledPaymentsHistory.length > 0 && (
          <View style={{ marginTop: theme.spacing.lg }}>
            <Text style={styles.sectionTitle}>Settled History</Text>
            {settledPaymentsHistory.map((sp, i) => {
              const fromPlayer = session.players.find(p => p.id === sp.fromId);
              const toPlayer = session.players.find(p => p.id === sp.toId);
              if (!fromPlayer || !toPlayer) return null;

              return (
                <TouchableOpacity
                  key={`history-${sp.fromId}-${sp.toId}-${sp.settledAt}-${i}`}
                  style={[styles.settlementCard, styles.settlementCardSettled]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSettlement({
                      from: fromPlayer,
                      to: toPlayer,
                      amount: sp.amount,
                      settledAt: sp.settledAt,
                      isHistory: true,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.settlementIconRow}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.winGreen} />
                    <Text style={[styles.settlementStepLabel, { color: theme.colors.winGreen }]}>Settled</Text>
                    <View style={{ flex: 1 }} />
                    <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textSecondary} />
                  </View>
                  <Text style={[styles.settlementDescription, styles.settlementDescriptionSettled]}>
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: 'bold' }}>{fromPlayer.name}</Text>
                    {' paid '}
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: 'bold' }}>Rs. {sp.amount}</Text>
                    {' to '}
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: 'bold' }}>{toPlayer.name}</Text>
                  </Text>
                  <Text style={styles.settledTimeText}>
                    Paid {formatSettledTime(sp.settledAt)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </>
  );

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={sortedPlayers}
          keyExtractor={p => p.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          renderItem={({ item, index }) => (
            <TouchableOpacity onLongPress={() => handleLongPressPlayer(item.id, item.name)} delayLongPress={500}>
              <PlayerCard
                player={item}
                rank={index + 1}
                isTopPlayer={index === 0 && item.balance > 0}
                roundsWon={playerStats[item.id]?.roundsWon ?? 0}
                totalRounds={playerStats[item.id]?.totalRounds ?? 0}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />

        <View style={{ paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }}>
          {isAdding ? (
            <View style={[styles.addPlayerContainer, { marginBottom: theme.spacing.sm }]}>
              <TextInput
                style={styles.input}
                placeholder="Player name"
                placeholderTextColor={theme.colors.textSecondary}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                autoFocus
              />
              <View style={styles.addPlayerActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddPlayer}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={[styles.addButton, { marginBottom: theme.spacing.sm }]} onPress={() => setIsAdding(true)}>
              <Text style={styles.addButtonText}>Add Player</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Settlement detail modal */}
      <Modal visible={!!selectedSettlement} transparent animationType="fade" onRequestClose={() => setSelectedSettlement(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedSettlement(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {selectedSettlement && (() => {
              const isHistory = selectedSettlement.isHistory;

              return (
                <>
                  <View style={styles.modalHeader}>
                    <MaterialCommunityIcons
                      name={isHistory ? 'check-circle' : 'cash-fast'}
                      size={40}
                      color={isHistory ? theme.colors.winGreen : theme.colors.accent}
                    />
                    <Text style={styles.modalTitle}>
                      {isHistory ? 'Payment Settled' : 'Settlement Details'}
                    </Text>
                  </View>

                  <View style={styles.modalAmountBox}>
                    <Text style={styles.modalAmountLabel}>Amount</Text>
                    <Text style={styles.modalAmount}>Rs. {selectedSettlement.amount}</Text>
                  </View>

                  <View style={styles.modalParties}>
                    <View style={styles.modalParty}>
                      <View style={[styles.modalPartyDot, { backgroundColor: theme.colors.lossRed }]} />
                      <View>
                        <Text style={styles.modalPartyLabel}>From</Text>
                        <Text style={styles.modalPartyName}>{selectedSettlement.from.name}</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.textSecondary} />
                    <View style={[styles.modalParty, { alignItems: 'flex-end' }]}>
                      <View style={[styles.modalPartyDot, { backgroundColor: theme.colors.winGreen, alignSelf: 'flex-end' }]} />
                      <View>
                        <Text style={[styles.modalPartyLabel, { textAlign: 'right' }]}>To</Text>
                        <Text style={styles.modalPartyName}>{selectedSettlement.to.name}</Text>
                      </View>
                    </View>
                  </View>

                  {isHistory && selectedSettlement.settledAt && (
                    <Text style={styles.modalSettledTime}>
                      Paid {formatSettledTime(selectedSettlement.settledAt)}
                    </Text>
                  )}

                  {isHistory ? (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setSelectedSettlement(null)}
                      >
                        <Text style={styles.modalCloseBtnText}>Close</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalUndoBtn}
                        onPress={() => {
                          handleUndoSettled(selectedSettlement.from.id, selectedSettlement.to.id, selectedSettlement.amount);
                          setSelectedSettlement(null);
                        }}
                      >
                        <MaterialCommunityIcons name="undo-variant" size={16} color={theme.colors.lossRed} />
                        <Text style={styles.modalUndoBtnText}>Undo Settlement</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setSelectedSettlement(null)}
                      >
                        <Text style={styles.modalCloseBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalSettleBtn}
                        onPress={() => {
                          handleMarkSettled(
                            selectedSettlement.from.id, selectedSettlement.from.name,
                            selectedSettlement.to.id, selectedSettlement.to.name,
                            selectedSettlement.amount
                          );
                          setSelectedSettlement(null);
                        }}
                      >
                        <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.background} />
                        <Text style={styles.modalSettleBtnText}>Mark as Settled</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
  },
  // Summary card
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...theme.typography.sectionHeader,
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  // Section titles
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  // Settlement section
  settlementsSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  settlementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  settlementIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  settlementStepLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settlementDescription: {
    ...theme.typography.body,
    fontSize: 16,
    lineHeight: 24,
  },
  settlementCardSettled: {
    borderColor: theme.colors.winGreen,
    borderWidth: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    opacity: 0.85,
  },
  settlementDescriptionSettled: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  settledTimeText: {
    fontSize: 11,
    color: theme.colors.winGreen,
    marginTop: theme.spacing.xs,
  },
  allEvenCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  allEvenText: {
    ...theme.typography.body,
    color: theme.colors.winGreen,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accent,
    borderWidth: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  clearHistoryButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.accent,
  },
  // Settlement detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typography.sectionHeader,
    fontSize: 20,
  },
  modalAmountBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalAmountLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  modalAmount: {
    ...theme.typography.title,
    fontSize: 28,
    color: theme.colors.accent,
  },
  modalParties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalParty: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  modalPartyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalPartyLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalPartyName: {
    ...theme.typography.sectionHeader,
    fontSize: 16,
  },
  modalSettledTime: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.colors.winGreen,
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalCloseBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCloseBtnText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  modalSettleBtn: {
    flex: 2,
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.accent,
  },
  modalSettleBtnText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  modalUndoBtn: {
    flex: 2,
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.lossRed,
  },
  modalUndoBtnText: {
    ...theme.typography.body,
    color: theme.colors.lossRed,
    fontWeight: '600',
  },
  // Add player
  addButton: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accent,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: theme.typography.sectionHeader.fontSize,
    fontWeight: theme.typography.sectionHeader.fontWeight,
    color: theme.colors.accent,
  },
  addPlayerContainer: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    ...theme.typography.body,
    marginBottom: theme.spacing.md,
  },
  addPlayerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  cancelText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
  },
  saveText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
});
