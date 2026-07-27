import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Round } from '../store/useStore';

interface RoundItemProps {
  round: Round;
  onEdit?: () => void;
  onDelete?: () => void;
}

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const RoundItem = ({ round, onEdit, onDelete }: RoundItemProps) => {
  const hasActions = onEdit || onDelete;

  return (
    <View style={styles.card}>
      {/* Top row: winner + amount */}
      <View style={styles.header}>
        <View style={styles.winnerBadge}>
          <MaterialCommunityIcons name="crown" size={14} color={theme.colors.accent} style={{ marginRight: 4 }} />
          <Text style={styles.winnerName}>{round.winnerName}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>+Rs. {round.stake * (round.playerCount - 1)}</Text>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
            Rs. {round.stake * round.playerCount} pot · {round.stake}/player
          </Text>
        </View>
      </View>

      {/* Bottom row: timestamps + action buttons */}
      <View style={styles.footer}>
        <View style={styles.timestamps}>
          <Text style={styles.timeText}>
            <MaterialCommunityIcons name="clock-outline" size={11} color={theme.colors.textSecondary} />
            {' '}{formatTime(round.timestamp)}
          </Text>
          {round.editedAt && (
            <Text style={[styles.timeText, styles.editedText]}>
              {' · '}
              <MaterialCommunityIcons name="pencil-outline" size={11} color={theme.colors.accent} />
              {' '}{formatTime(round.editedAt)}
            </Text>
          )}
        </View>

        {hasActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.accent} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={onDelete}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.colors.lossRed} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerName: {
    ...theme.typography.sectionHeader,
    color: theme.colors.winGreen,
  },
  amount: {
    ...theme.typography.sectionHeader,
    color: theme.colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamps: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  editedText: {
    color: theme.colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
});
