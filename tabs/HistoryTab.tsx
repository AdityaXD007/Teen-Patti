import React from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useStore } from '../store/useStore';
import { RoundItem } from '../components/RoundItem';
import { EmptyState } from '../components/EmptyState';

export const HistoryTab = ({ route }: any) => {
  const { sessionId } = route.params;
  const session = useStore(state => state.sessions.find(s => s.id === sessionId));
  const deleteRound = useStore(state => state.deleteRound);

  if (!session) return null;

  const confirmDelete = (roundId: string) => {
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

  return (
    <View style={styles.container}>
      <FlatList
        data={session.rounds}
        keyExtractor={r => r.id}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity 
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                confirmDelete(item.id);
              }} 
              delayLongPress={500}
            >
              <RoundItem round={item} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="clock-outline" message="No rounds yet. Add the first round." />}
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
