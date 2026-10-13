import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CASINO_DEFAULT_LIMITS } from '@shared/engines/casino';
import { colors, radii, spacing } from '@/theme';

interface BetControlsProps {
  bet: number;
  onChange: (bet: number) => void;
  balance: number;
  disabled?: boolean;
}

const { minBet, maxBet } = CASINO_DEFAULT_LIMITS;

function clampBet(value: number, balance: number): number {
  const ceiling = Math.max(minBet, Math.min(maxBet, balance));
  return Math.min(ceiling, Math.max(minBet, Math.floor(value)));
}

/** Bet amount field with ½ / 2× / MIN / MAX shortcuts, clamped to the bet limits. */
export function BetControls({ bet, onChange, balance, disabled }: BetControlsProps) {
  // What the user is typing; null shows the committed bet
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(bet);

  const commit = (value: number) => {
    setDraft(null);
    onChange(clampBet(value, balance));
  };

  const shortcuts: { label: string; value: () => number }[] = [
    { label: '½', value: () => bet / 2 },
    { label: '2×', value: () => bet * 2 },
    { label: 'MIN', value: () => minBet },
    { label: 'MAX', value: () => maxBet },
  ];

  return (
    <View>
      <Text style={styles.label}>Bet amount</Text>
      <View style={[styles.row, disabled && styles.disabled]}>
        <View style={styles.inputWrap}>
          <Ionicons name="disc" size={16} color={colors.gold} />
          <TextInput
            style={styles.input}
            value={text}
            editable={!disabled}
            keyboardType="number-pad"
            inputMode="numeric"
            onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
            onBlur={() => commit(Number(text) || minBet)}
            onSubmitEditing={() => commit(Number(text) || minBet)}
            accessibilityLabel="Bet amount"
          />
        </View>
        {shortcuts.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.shortcut}
            disabled={disabled}
            onPress={() => commit(s.value())}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Bet ${s.label}`}
          >
            <Text style={styles.shortcutText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>
        Min {minBet} · Max {maxBet}
      </Text>
    </View>
  );
}

interface OptionPickerProps<T extends string | number> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/** Small segmented control used for risk, rows and mine count. */
export function OptionPicker<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
}: OptionPickerProps<T>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.segments, disabled && styles.disabled]}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <TouchableOpacity
              key={String(o.value)}
              style={[styles.segment, selected && styles.segmentSelected]}
              disabled={disabled}
              onPress={() => onChange(o.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  shortcut: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 12,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSubtle,
  },
  segments: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  segmentTextSelected: {
    color: colors.textInverse,
  },
});
