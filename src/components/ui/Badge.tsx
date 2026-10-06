import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export type BadgeVariant = 'new' | 'hot' | 'gold' | 'neutral' | 'success' | 'danger';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
  icon,
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 3,
  },
  new: {
    backgroundColor: colors.primary,
  },
  hot: {
    backgroundColor: colors.danger,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  neutral: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  success: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: 'rgba(255, 90, 95, 0.2)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  text: {
    ...typography.micro,
    fontSize: 9,
    fontWeight: '800',
  },
  text_new: {
    color: '#07140F',
  },
  text_hot: {
    color: '#FFFFFF',
  },
  text_gold: {
    color: '#07140F',
  },
  text_neutral: {
    color: colors.textMuted,
  },
  text_success: {
    color: colors.primary,
  },
  text_danger: {
    color: colors.danger,
  },
});
