import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';

export interface DividerProps {
  style?: ViewStyle;
  vertical?: boolean;
}

export const Divider: React.FC<DividerProps> = ({ style, vertical = false }) => {
  return <View style={[vertical ? styles.vertical : styles.horizontal, style]} />;
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: spacing.sm,
  },
  vertical: {
    width: 1,
    backgroundColor: colors.border,
    height: '100%',
    marginHorizontal: spacing.sm,
  },
});
