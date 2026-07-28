import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useStore, Round } from '../store/useStore';
import { RoundItem } from '../components/RoundItem';
import { EditRoundModal } from '../components/EditRoundModal';
import { EmptyState } from '../components/EmptyState';

export const HistoryTab = ({ route }: any) => {
  const { sessionId } = route.params;
  const session = useStore(state => state.sessions.find(s => s.id === sessionId));
  const deleteRound = useStore(state => state.deleteRound);
  const editRound = useStore(state => state.editRound);
  const clearSessionHistory = useStore(state => state.clearSessionHistory);

  const [editingRound, setEditingRound] = useState<Round | null>(null);

  if (!session) return null;

  const confirmDelete = (roundId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Round',
      'Are you sure you want to delete this round? Player balances will be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteRound(sessionId, roundId);
          }
        }
      ]
    );
  };

  const confirmClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Clear Round History',
      'Are you sure you want to clear all rounds and settlements? Player balances will reset to zero for a fresh game.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All History',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearSessionHistory(sessionId);
          }
        }
      ]
    );
  };

  const handleEditSave = (newWinnerId: string, newStake: number) => {
    if (!editingRound) return;
    editRound(sessionId, editingRound.id, newWinnerId, newStake);
    setEditingRound(null);
  };

  const renderFooter = () => {
    if (session.rounds.length === 0) return null;
    return (
      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearBtn} onPress={confirmClearAll}>
          <MaterialCommunityIcons name="broom" size={18} color={theme.colors.lossRed} />
          <Text style={styles.clearBtnText}>Clear All History & Reset</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={session.rounds}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <RoundItem
            round={item}
            onEdit={() => setEditingRound(item)}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="clock-outline" message="No rounds yet. Add the first round." />}
      />
      <EditRoundModal
        visible={!!editingRound}
        round={editingRound}
        players={session.players}
        onSave={handleEditSave}
        onCancel={() => setEditingRound(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  footer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.lossRed,
  },
});
