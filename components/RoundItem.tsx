import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { Round, Player } from '../store/useStore';

interface RoundItemProps {
  round: Round;
}

export const RoundItem = ({ round }: RoundItemProps) => {
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const loserNames = round.loserNames.join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.winnerName}>{round.winnerName}</Text>
        <Text style={styles.amount}>+Rs. {round.amount}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.time}>{timeAgo(round.timestamp)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  losers: {
    ...theme.typography.caption,
    color: theme.colors.lossRed,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  time: {
    ...theme.typography.caption,
  },
});
