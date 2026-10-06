import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing, typography, shadows } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  badge?: string | number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  style,
  textStyle,
  badge,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!onPress) return;
    hapticFeedback.selection();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        selected ? styles.selected : styles.unselected,
        selected && shadows.greenGlow,
        animatedStyle,
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,
        ]}
      >
        {label}
      </Text>
      {badge !== undefined && (
        <View style={[styles.badge, selected ? styles.badgeSelected : styles.badgeUnselected]}>
          <Text
            style={[
              styles.badgeText,
              selected ? styles.badgeTextSelected : styles.badgeTextUnselected,
            ]}
          >
            {badge}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    minHeight: 38,
  },
  unselected: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    ...typography.captionBold,
    fontSize: 13,
  },
  textUnselected: {
    color: colors.textMuted,
  },
  textSelected: {
    color: '#07140F',
    fontWeight: '800',
  },
  badge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  badgeUnselected: {
    backgroundColor: colors.surfaceElevated,
  },
  badgeSelected: {
    backgroundColor: '#07140F',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextUnselected: {
    color: colors.textMuted,
  },
  badgeTextSelected: {
    color: colors.primary,
  },
});
