import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radii, typography, shadows, gradients } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  haptic = true,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) {
      hapticFeedback.light();
    }
    onPress();
  };

  // Base container styles per size
  const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { height: 36, paddingHorizontal: spacing.sm, fontSize: 12 },
    md: { height: 48, paddingHorizontal: spacing.md, fontSize: 14 },
    lg: { height: 56, paddingHorizontal: spacing.lg, fontSize: 16 },
  };

  const currentSize = sizeStyles[size];

  // Render gradient background for primary/gold/danger buttons
  const isGradient = variant === 'primary' || variant === 'gold' || variant === 'danger';
  const gradientColors =
    variant === 'primary'
      ? gradients.primary
      : variant === 'gold'
      ? gradients.gold
      : gradients.danger;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          height: currentSize.height,
          paddingHorizontal: isGradient ? 0 : currentSize.paddingHorizontal,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.5 : 1,
        },
        !isGradient && styles[`container_${variant}`],
        variant === 'primary' && shadows.greenGlow,
        variant === 'gold' && shadows.goldGlow,
        animatedStyle,
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientContainer,
            {
              paddingHorizontal: currentSize.paddingHorizontal,
              borderRadius: radii.md,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={variant === 'gold' ? '#07140F' : '#FFFFFF'} size="small" />
          ) : (
            <>
              {leftIcon && <Animated.View style={styles.iconLeft}>{leftIcon}</Animated.View>}
              <Text
                style={[
                  styles.text,
                  styles[`text_${variant}`],
                  { fontSize: currentSize.fontSize },
                  textStyle,
                ]}
              >
                {title}
              </Text>
              {rightIcon && <Animated.View style={styles.iconRight}>{rightIcon}</Animated.View>}
            </>
          )}
        </LinearGradient>
      ) : (
        <>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              {leftIcon && <Animated.View style={styles.iconLeft}>{leftIcon}</Animated.View>}
              <Text
                style={[
                  styles.text,
                  styles[`text_${variant}`],
                  { fontSize: currentSize.fontSize },
                  textStyle,
                ]}
              >
                {title}
              </Text>
              {rightIcon && <Animated.View style={styles.iconRight}>{rightIcon}</Animated.View>}
            </>
          )}
        </>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target 44px
    overflow: 'hidden',
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container_secondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  container_ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    ...typography.bodyBold,
    textAlign: 'center',
  },
  text_primary: {
    color: '#07140F',
    fontWeight: '800',
  },
  text_gold: {
    color: '#07140F',
    fontWeight: '800',
  },
  text_danger: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  text_secondary: {
    color: colors.text,
  },
  text_outline: {
    color: colors.text,
  },
  text_ghost: {
    color: colors.primary,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
