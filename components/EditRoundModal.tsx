import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { Round, Player } from '../store/useStore';

interface EditRoundModalProps {
  visible: boolean;
  round: Round | null;
  players: Player[];
  onSave: (winnerId: string, amount: number) => void;
  onCancel: () => void;
}

export const EditRoundModal = ({ visible, round, players, onSave, onCancel }: EditRoundModalProps) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState('');

  // Pre-fill when the sheet opens with a round
  useEffect(() => {
    if (round && visible) {
      setWinnerId(round.winnerId);
      setAmountStr(round.amount.toString());
      // Expand sheet
      bottomSheetRef.current?.present();
    } else {
      // Close sheet
      bottomSheetRef.current?.dismiss();
    }
  }, [round, visible]);

  const amount = parseInt(amountStr, 10);
  const isValid = winnerId && !isNaN(amount) && amount > 0;

  const handleSave = () => {
    if (isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave(winnerId, amount);
    }
  };

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  }, [onCancel]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      // Sheet was closed by gesture
      onCancel();
    }
  }, [onCancel]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  const getWinnerName = () => players.find(p => p.id === winnerId)?.name;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      enableDynamicSizing
      enablePanDownToClose
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.sheetContent}>
        <Text style={styles.title}>Edit Round</Text>

        {/* Created / Edited info */}
        {round && (
          <View style={styles.timestampRow}>
            <Text style={styles.timestampText}>
              Created {formatTime(round.timestamp)}
            </Text>
            {round.editedAt && (
              <Text style={[styles.timestampText, styles.editedTimestamp]}>
                {' · '}Edited {formatTime(round.editedAt)}
              </Text>
            )}
          </View>
        )}

        {/* Winner picker */}
        <Text style={styles.label}>Winner</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {players.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.chip,
                winnerId === p.id && styles.chipSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWinnerId(p.id);
              }}
            >
              <Text style={[styles.chipText, winnerId === p.id && styles.chipTextSelected]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Amount input */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>Rs. </Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
            value={amountStr}
            onChangeText={setAmountStr}
            selectTextOnFocus
          />
        </View>

        {/* Preview */}
        {isValid && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              <Text style={{ color: theme.colors.winGreen }}>{getWinnerName()}</Text> wins Rs. {amount}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={[styles.saveButtonText, !isValid && styles.saveButtonTextDisabled]}>
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom safe area spacing */}
        <View style={{ height: 16 }} />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: theme.colors.textSecondary,
    width: 40,
    height: 4,
    opacity: 0.5,
  },
  sheetContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  title: {
    ...theme.typography.title,
    marginBottom: theme.spacing.xs,
  },
  timestampRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  timestampText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  editedTimestamp: {
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  chip: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  chipText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  chipTextSelected: {
    fontWeight: 'bold',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  currencySymbol: {
    ...theme.typography.sectionHeader,
    color: theme.colors.accent,
    marginRight: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    ...theme.typography.sectionHeader,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  previewBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    borderColor: theme.colors.accent,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  previewText: {
    ...theme.typography.body,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: 'rgba(13, 13, 13, 0.3)',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
  },
  saveButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  saveButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
});
