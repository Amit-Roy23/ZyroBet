import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, shadows, gradients } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

export type CardVariant = 'default' | 'elevated' | 'glow' | 'gradient' | 'outlined';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress,
  haptic = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!onPress) return;
    if (haptic) {
      hapticFeedback.light();
    }
    onPress();
  };

  const content =
    variant === 'gradient' ? (
      <LinearGradient
        colors={gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientInner, style]}
      >
        {children}
      </LinearGradient>
    ) : (
      children
    );

  const containerStyle = [
    styles.base,
    styles[variant],
    variant === 'glow' && shadows.greenGlow,
    variant === 'elevated' && shadows.cardElevated,
    variant !== 'gradient' && style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerStyle, animatedStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg, // 16px rounded cards
    overflow: 'hidden',
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  elevated: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  glow: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  gradient: {
    padding: 0,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gradientInner: {
    padding: spacing.md,
    borderRadius: radii.lg,
  },
});
