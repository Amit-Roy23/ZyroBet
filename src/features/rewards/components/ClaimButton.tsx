import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography, gradients, shadows } from '@/theme';
import { useCountdown } from '../hooks/useCountdown';
import { formatCoins } from '@/utils/format';
import { hapticFeedback } from '@/lib/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ClaimButtonProps {
  canClaim: boolean;
  coins: number;
  isLoading: boolean;
  nextClaimAt?: string | null;
  serverOffsetMs?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ClaimButton: React.FC<ClaimButtonProps> = ({
  canClaim,
  coins,
  isLoading,
  nextClaimAt,
  serverOffsetMs = 0,
  onPress,
}) => {
  const isReducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const shimmerGlow = useSharedValue(0.3);
  const countdown = useCountdown(nextClaimAt, serverOffsetMs);

  React.useEffect(() => {
    if (canClaim && !isLoading && !isReducedMotion) {
      shimmerGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      shimmerGlow.value = 0.3;
    }
  }, [canClaim, isLoading, isReducedMotion, shimmerGlow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (canClaim && !isLoading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (canClaim && !isLoading) {
      hapticFeedback.medium();
      onPress();
    }
  };

  // 1. Loading State (Prevents double taps)
  if (isLoading) {
    return (
      <View style={[styles.buttonBase, styles.buttonLoading]}>
        <ActivityIndicator size="small" color="#07140F" />
        <Text style={styles.buttonLoadingText}>Claiming your reward...</Text>
      </View>
    );
  }

  // 2. Claimed State (Shows countdown to next midnight reward)
  if (!canClaim) {
    return (
      <View style={[styles.buttonBase, styles.buttonClaimed]}>
        <Ionicons name="time-outline" size={20} color={colors.textMuted} />
        <View style={styles.claimedTextContainer}>
          <Text style={styles.claimedHeader}>REWARD CLAIMED FOR TODAY</Text>
          <Text style={styles.countdownText}>
            Next reward unlocks in {countdown.formatted}
          </Text>
        </View>
      </View>
    );
  }

  // 3. Claimable State (Ready to claim)
  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Claim ${formatCoins(coins)} daily reward coins now`}
      style={[styles.pressableWrapper, animatedStyle]}
    >
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.buttonBase, styles.buttonClaimable, shadows.greenGlow]}
      >
        <Ionicons name="gift" size={24} color="#07140F" />
        <Text style={styles.claimButtonText}>
          Claim {formatCoins(coins)} Free Coins
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#07140F" />
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  pressableWrapper: {
    width: '100%',
  },
  buttonBase: {
    height: 56,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonClaimable: {
    borderWidth: 1.5,
    borderColor: '#3EF085',
  },
  claimButtonText: {
    ...typography.bodyBold,
    fontSize: 16,
    fontWeight: '900',
    color: '#07140F',
    letterSpacing: 0.5,
  },
  buttonLoading: {
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  buttonLoadingText: {
    ...typography.bodyBold,
    color: '#07140F',
    fontSize: 15,
  },
  buttonClaimed: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 10,
    height: 'auto',
    minHeight: 56,
  },
  claimedTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimedHeader: {
    ...typography.micro,
    color: colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: '800',
    fontSize: 9,
  },
  countdownText: {
    ...typography.captionBold,
    color: colors.text,
    fontSize: 14,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
