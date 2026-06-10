import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useStore } from '../store/useStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const CreateSessionScreen = ({ navigation }: any) => {
  const createSession = useStore(state => state.createSession);
  const [sessionName, setSessionName] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleAddPlayer = () => {
    const trimmed = playerNameInput.trim();
    if (trimmed && !players.includes(trimmed)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPlayers([...players, trimmed]);
      setPlayerNameInput('');
      // Scroll down after adding a player so the input stays visible
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const handleRemovePlayer = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayers(players.filter(p => p !== name));
  };

  const handleCreate = () => {
    if (sessionName.trim() && players.length >= 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      createSession(sessionName, players);
      navigation.goBack();
    }
  };

  const isFormValid = sessionName.trim().length > 0 && players.length >= 2;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="close" size={28} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>New Game Table</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Table Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Saturday Night Game"
              placeholderTextColor={theme.colors.textSecondary}
              value={sessionName}
              onChangeText={setSessionName}
            />
          </View>

          <View style={styles.chipsContainer}>
            {players.map((p, index) => (
              <View key={index} style={styles.chipContainer}>
                <View style={styles.chipInner}>
                  <Text style={styles.chipText}>{p}</Text>
                  <TouchableOpacity onPress={() => handleRemovePlayer(p)} style={styles.removeIcon}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seat Players (Min 2)</Text>
            <View style={styles.playerInputRow}>
              <TextInput
                style={[styles.input, styles.playerInput]}
                placeholder="Player name"
                placeholderTextColor={theme.colors.textSecondary}
                value={playerNameInput}
                onChangeText={setPlayerNameInput}
                onSubmitEditing={handleAddPlayer}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Extra padding so content can scroll above keyboard */}
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.createButton, !isFormValid && styles.createButtonDisabled]} 
            onPress={handleCreate}
            disabled={!isFormValid}
          >
            <View style={styles.createButtonInner}>
              <MaterialCommunityIcons 
                name="cards-playing" 
                size={24} 
                color={isFormValid ? theme.colors.background : theme.colors.textSecondary} 
                style={{ marginRight: theme.spacing.sm }} 
              />
              <Text style={[styles.createButtonText, !isFormValid && styles.createButtonTextDisabled]}>
                Deal Cards
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.accent,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.sectionHeader,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
  },
  playerInputRow: {
    flexDirection: 'row',
  },
  playerInput: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.accent,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  chipContainer: {
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: 2, // Border thickness
    backgroundColor: theme.colors.accent, // Outer color for poker chip effect
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.background,
    borderStyle: 'dashed',
  },
  chipText: {
    ...theme.typography.body,
    marginRight: theme.spacing.xs,
    fontWeight: 'bold',
  },
  removeIcon: {
    marginLeft: 4,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: 3,
  },
  createButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 13, 0.3)',
    borderRadius: theme.borderRadius.md - 3,
    padding: theme.spacing.md,
  },
  createButtonDisabled: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  createButtonText: {
    fontSize: theme.typography.sectionHeader.fontSize,
    fontWeight: theme.typography.sectionHeader.fontWeight,
    color: theme.colors.background,
  },
  createButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
});
