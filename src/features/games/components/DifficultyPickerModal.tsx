import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';

interface DifficultyPickerModalProps {
  visible: boolean;
  gameTitle: string;
  difficulties: { id: string; label: string }[];
  onSelect: (diffId: string) => void;
  onCancel: () => void;
}

export function DifficultyPickerModal({
  visible,
  gameTitle,
  difficulties,
  onSelect,
  onCancel,
}: DifficultyPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="layers" size={28} color={colors.primary} />
          </View>

          <Text style={styles.title}>Select Difficulty</Text>
          <Text style={styles.subtitle}>
            Choose your challenge level for {gameTitle}
          </Text>

          <View style={styles.list}>
            {difficulties.map((diff) => (
              <TouchableOpacity
                key={diff.id}
                style={styles.diffButton}
                activeOpacity={0.7}
                onPress={() => onSelect(diff.id)}
              >
                <Text style={styles.diffLabel}>{diff.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Back to Lobby</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0E2A1F',
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: '#1D4D38',
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#164E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    fontFamily: typography.fonts.heading,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  list: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  diffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14382A',
    borderWidth: 1,
    borderColor: '#225B44',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  diffLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
