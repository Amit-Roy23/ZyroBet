import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, shadows } from '@/theme';
import { formatCoins, formatCompact } from '@/utils/format';
import { hapticFeedback } from '@/lib/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Skeleton } from '@/components/ui/Skeleton';

export interface CoinChipProps {
  balance: number;
  onPress?: () => void;
  style?: ViewStyle;
  showAddButton?: boolean;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CoinChip: React.FC<CoinChipProps> = ({
  balance,
  onPress,
  style,
  showAddButton = true,
  isLoading = false,
}) => {
  const isReducedMotion = useReducedMotion();
  const prevBalanceRef = useRef<number>(balance);
  const [displayedBalance, setDisplayedBalance] = useState<number>(balance);
  const [deltaAmount, setDeltaAmount] = useState<number | null>(null);

  // Animation values
  const chipScale = useSharedValue(1);
  const coinRotation = useSharedValue(0);
  const coinScale = useSharedValue(1);
  const deltaTranslateY = useSharedValue(0);
  const deltaOpacity = useSharedValue(0);

  useEffect(() => {
    const prev = prevBalanceRef.current;
    if (prev !== balance) {
      const diff = balance - prev;
      prevBalanceRef.current = balance;

      if (isReducedMotion) {
        return;
      }

      // 1. Delta bubble trigger (scheduled asynchronously)
      requestAnimationFrame(() => {
        setDeltaAmount(diff);
      });
      deltaTranslateY.value = 0;
      deltaOpacity.value = 1;
      deltaTranslateY.value = withTiming(-22, { duration: 1200, easing: Easing.out(Easing.ease) });
      deltaOpacity.value = withTiming(0, { duration: 1200, easing: Easing.in(Easing.ease) });

      // 2. Coin Spin & Pulse
      coinScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 350 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
      coinRotation.value = withTiming(coinRotation.value + 360, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });

      // 3. Haptics on gain
      if (diff > 0) {
        hapticFeedback.light();
      }

      // 4. Smooth tabular count-up / count-down interpolation over 700ms
      const durationMs = 700;
      const startMs = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const progress = Math.min(1, elapsed / durationMs);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(prev + diff * ease);
        setDisplayedBalance(current);

        if (progress >= 1) {
          clearInterval(interval);
          setDisplayedBalance(balance);
        }
      }, 25);

      return () => clearInterval(interval);
    }
  }, [balance, isReducedMotion, coinRotation, coinScale, deltaOpacity, deltaTranslateY]);

  const chipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chipScale.value }],
  }));

  const coinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: coinScale.value },
      { rotate: `${coinRotation.value}deg` },
    ],
  }));

  const deltaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: deltaTranslateY.value }],
    opacity: deltaOpacity.value,
  }));

  const handlePressIn = () => {
    chipScale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    chipScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    hapticFeedback.selection();
    if (onPress) {
      onPress();
    } else {
      router.push('/wallet/history');
    }
  };

  const effectiveValue = isReducedMotion ? balance : displayedBalance;
  const formattedValue = formatCompact(effectiveValue);
  const fullFormattedValue = formatCoins(balance);

  if (isLoading && balance === 0) {
    return <Skeleton width={90} height={34} borderRadius={radii.full} style={style} />;
  }

  return (
    <View style={styles.outerWrapper}>
      {/* Floating Delta Badge */}
      {!isReducedMotion && deltaAmount !== null && deltaAmount !== 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.deltaBubble,
            deltaAmount > 0 ? styles.deltaBubblePositive : styles.deltaBubbleNegative,
            deltaAnimatedStyle,
          ]}
        >
          <Text
            style={[
              styles.deltaText,
              deltaAmount > 0 ? styles.deltaTextPositive : styles.deltaTextNegative,
            ]}
          >
            {deltaAmount > 0 ? `+${formatCoins(deltaAmount)}` : formatCoins(deltaAmount)}
          </Text>
        </Animated.View>
      )}

      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Virtual Balance: ${fullFormattedValue} coins. Tap to view transaction history.`}
        style={[styles.container, shadows.goldGlow, chipAnimatedStyle, style]}
      >
        <Animated.View style={[styles.coinIconContainer, coinAnimatedStyle]}>
          <Ionicons name="disc" size={16} color={colors.gold} />
        </Animated.View>

        <Text style={styles.balanceText} numberOfLines={1}>
          {formattedValue}
        </Text>

        {showAddButton && (
          <View style={styles.historyArrow}>
            <Ionicons name="chevron-forward" size={12} color="#07140F" />
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#163829',
    borderWidth: 1.5,
    borderColor: colors.goldDark,
    borderRadius: radii.full,
    paddingLeft: spacing.xs + 2,
    paddingRight: spacing.xs,
    paddingVertical: 4,
    minHeight: 34,
  },
  coinIconContainer: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceText: {
    ...typography.coin,
    fontSize: 14,
    marginRight: spacing.xs + 2,
    fontVariant: ['tabular-nums'], // Tabular numerals prevent width jitter during count animation
  },
  historyArrow: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaBubble: {
    position: 'absolute',
    top: -14,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
    zIndex: 10,
    borderWidth: 1,
  },
  deltaBubblePositive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
  },
  deltaBubbleNegative: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.danger,
  },
  deltaText: {
    ...typography.micro,
    fontSize: 10,
    fontWeight: '900',
  },
  deltaTextPositive: {
    color: colors.primary,
  },
  deltaTextNegative: {
    color: colors.danger,
  },
});
