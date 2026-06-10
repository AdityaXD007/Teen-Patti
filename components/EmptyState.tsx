import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  message: string;
}

export const EmptyState = ({ icon, message }: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={64} color={theme.colors.border} />
        <View style={styles.decorativeSuits}>
          <Text style={styles.suit}>♠️</Text>
          <Text style={styles.suit}>♥️</Text>
          <Text style={styles.suit}>♣️</Text>
          <Text style={styles.suit}>♦️</Text>
        </View>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  decorativeSuits: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  suit: {
    fontSize: 16,
    opacity: 0.5,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
