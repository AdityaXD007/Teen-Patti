import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useStore } from '../store/useStore';
import { PlayerCard } from '../components/PlayerCard';

export const LeaderboardTab = ({ route }: any) => {
  const { sessionId } = route.params;
  const session = useStore(state => state.sessions.find(s => s.id === sessionId));
  const addPlayer = useStore(state => state.addPlayer);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const insets = useSafeAreaInsets();

  const removePlayer = useStore(state => state.removePlayer);

  if (!session) return null;

  const sortedPlayers = [...session.players].sort((a, b) => b.balance - a.balance);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={sortedPlayers}
        keyExtractor={p => p.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity onLongPress={() => handleLongPressPlayer(item.id, item.name)} delayLongPress={500}>
            <PlayerCard
              player={item}
              rank={index + 1}
              isTopPlayer={index === 0 && item.balance > 0}
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
