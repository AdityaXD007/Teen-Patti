import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Player } from '../store/useStore';

interface PlayerCardProps {
  player: Player;
  rank?: number;
  isTopPlayer?: boolean;
  roundsWon?: number;
  totalRounds?: number;
}

export const PlayerCard = ({ player, rank, isTopPlayer, roundsWon = 0, totalRounds = 0 }: PlayerCardProps) => {
  const isPositive = player.balance > 0;
  const isNegative = player.balance < 0;


  return (
    <View style={[styles.cardContainer, isTopPlayer && styles.topCard]}>
      <View style={[styles.cardInner, isTopPlayer && styles.topCardInner]}>
        {/* Top row: rank + name + balance */}
        <View style={styles.mainRow}>
          <View style={styles.left}>
            {rank !== undefined && (
              <View style={[styles.rankBadge, isTopPlayer && styles.rankBadgeTop]}>
                {isTopPlayer ? (
                  <MaterialCommunityIcons name="crown" size={16} color={theme.colors.accent} />
                ) : (
                  <Text style={[styles.rank, isTopPlayer && styles.rankTop]}>{rank}</Text>
                )}
              </View>
            )}
            <View>
              <Text style={[styles.name, isTopPlayer && styles.nameTop]}>{player.name}</Text>
              {totalRounds > 0 && (
                <Text style={styles.subtitle}>
                  {roundsWon} {roundsWon === 1 ? 'win' : 'wins'} · {totalRounds} played
                </Text>
              )}
            </View>
          </View>
          <View style={styles.right}>
            {player.balance === 0 ? (
              <View style={styles.evenBadge}>
                <Text style={styles.evenText}>EVEN</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[
                  styles.balance,
                  isPositive && { color: theme.colors.winGreen },
                  isNegative && { color: theme.colors.lossRed }
                ]}>
                  {isPositive ? '+' : '-'}Rs. {Math.abs(Math.round(player.balance))}
                </Text>
                <Text style={[
                  styles.statusLabel,
                  isPositive && { color: theme.colors.winGreen },
                  isNegative && { color: theme.colors.lossRed }
                ]}>
                  {isPositive ? 'collects' : 'pays'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats bar */}
        {totalRounds > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy-outline" size={13} color={theme.colors.accent} />
              <Text style={styles.statText}>{roundsWon} won</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="cards-playing-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.statText}>{totalRounds - roundsWon} lost</Text>
            </View>

          </View>
        )}
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
  topCard: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
  },
  cardInner: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.1)',
    borderRadius: theme.borderRadius.md - 1,
  },
  topCardInner: {
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  rankBadgeTop: {
    backgroundColor: theme.colors.accentSoft,
  },
  rank: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  rankTop: {
    color: theme.colors.accent,
  },
  name: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  nameTop: {
    color: theme.colors.accent,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  balance: {
    ...theme.typography.sectionHeader,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  evenBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  evenText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border,
  },
});
