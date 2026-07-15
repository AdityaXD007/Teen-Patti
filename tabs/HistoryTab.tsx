import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
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

  const handleEditSave = (newWinnerId: string, newStake: number) => {
    if (!editingRound) return;
    editRound(sessionId, editingRound.id, newWinnerId, newStake);
    setEditingRound(null);
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
});
