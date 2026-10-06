import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchToggle?: (val: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  iconColor = colors.primary,
  title,
  subtitle,
  value,
  isSwitch = false,
  switchValue = false,
  onSwitchToggle,
  onPress,
  danger = false,
}) => {
  const handlePress = () => {
    if (isSwitch) return;
    hapticFeedback.light();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isSwitch && !onPress}
      style={({ pressed }) => [styles.container, pressed && !isSwitch && styles.pressed]}
    >
      <View style={[styles.iconCircle, { backgroundColor: danger ? 'rgba(255,90,95,0.15)' : colors.surfaceElevated }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : iconColor} />
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.title, danger && styles.titleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={(val) => {
            hapticFeedback.selection();
            onSwitchToggle?.(val);
          }}
          trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : value ? (
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{value}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text,
  },
  titleDanger: {
    color: colors.danger,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
