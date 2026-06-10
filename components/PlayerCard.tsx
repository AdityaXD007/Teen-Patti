import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Player } from '../store/useStore';

interface PlayerCardProps {
  player: Player;
  rank?: number;
  isTopPlayer?: boolean;
}

export const PlayerCard = ({ player, rank, isTopPlayer }: PlayerCardProps) => {
  const isPositive = player.balance > 0;
  const isNegative = player.balance < 0;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardInner}>
        <View style={styles.left}>
          {rank !== undefined && <Text style={styles.rank}>{rank}</Text>}
          <Text style={styles.name}>{player.name}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[
            styles.balance,
            isPositive && { color: theme.colors.winGreen },
            isNegative && { color: theme.colors.lossRed }
          ]}>
            {isPositive ? '+' : ''}Rs. {player.balance === 0 ? '0' : Math.round(player.balance)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardInner: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.1)',
    borderRadius: theme.borderRadius.md - 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    width: 28,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  name: {
    ...theme.typography.body,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balance: {
    ...theme.typography.sectionHeader,
  },
});
