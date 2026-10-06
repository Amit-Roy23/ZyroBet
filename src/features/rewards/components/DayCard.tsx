import React, { useEffect } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { DayCardState } from '../types';
import { formatCoins } from '@/utils/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface DayCardProps {
  day: number;
  coins: number;
  state: DayCardState;
  isSpecial?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  coins,
  state,
  isSpecial = false,
  onLayout,
}) => {
  const isReducedMotion = useReducedMotion();
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (state === 'today' && !isReducedMotion) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = 1;
      glowOpacity.value = 0.4;
    }
  }, [state, isReducedMotion, pulseScale, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Special Day 7 Wide Card
  if (isSpecial) {
    const isClaimed = state === 'claimed';
    const isToday = state === 'today';

    return (
      <Animated.View
        onLayout={onLayout}
        style={[
          styles.specialContainer,
          isToday && shadows.goldGlow,
          isToday && animatedStyle,
        ]}
      >
        <LinearGradient
          colors={isClaimed ? ['#0E2A1F', '#07140F'] : gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.specialCard, isToday && styles.specialCardActive]}
        >
          <View style={styles.specialLeft}>
            <View style={[styles.specialBadge, isClaimed && styles.badgeClaimed]}>
              <Text style={[styles.specialBadgeText, isClaimed && styles.textClaimed]}>
                DAY {day} • MEGA BONUS
              </Text>
            </View>
            <Text style={[styles.specialTitle, isClaimed && styles.textClaimed]}>
              {formatCoins(coins)} Coins
            </Text>
            <Text style={[styles.specialSubtitle, isClaimed && styles.textClaimed]}>
              {isClaimed
                ? 'Cycle Completed! Great job!'
                : isToday
                ? 'Ready to claim right now!'
                : 'Complete the 7-day streak'}
            </Text>
          </View>

          <View style={styles.specialRight}>
            <View
              style={[
                styles.specialIconCircle,
                isClaimed ? styles.iconCircleClaimed : isToday ? styles.iconCircleActive : styles.iconCircleLocked,
              ]}
            >
              {isClaimed ? (
                <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
              ) : isToday ? (
                <Ionicons name="trophy" size={34} color="#07140F" />
              ) : (
                <Ionicons name="lock-closed" size={28} color={colors.textMuted} />
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Days 1-6 Grid Cards
  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.container,
        state === 'today' && styles.containerToday,
        state === 'today' && shadows.greenGlow,
        state === 'today' && animatedStyle,
      ]}
    >
      {state === 'today' && (
        <LinearGradient
          colors={['rgba(46, 204, 113, 0.25)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Day label */}
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.dayLabel,
            state === 'claimed' && styles.dayLabelClaimed,
            state === 'today' && styles.dayLabelToday,
          ]}
        >
          DAY {day}
        </Text>
        {state === 'claimed' && (
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        )}
      </View>

      {/* Center Icon */}
      <View
        style={[
          styles.iconCircle,
          state === 'claimed' && styles.iconCircleClaimed,
          state === 'today' && styles.iconCircleToday,
          state === 'locked' && styles.iconCircleLocked,
        ]}
      >
        {state === 'claimed' ? (
          <Ionicons name="gift" size={22} color={colors.primary} />
        ) : state === 'today' ? (
          <Ionicons name="disc" size={24} color={colors.gold} />
        ) : (
          <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
        )}
      </View>

      {/* Reward Amount */}
      <Text
        style={[
          styles.coinText,
          state === 'claimed' && styles.coinTextClaimed,
          state === 'today' && styles.coinTextToday,
        ]}
      >
        +{coins}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  containerToday: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
  },
  dayLabel: {
    ...typography.micro,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  dayLabelClaimed: {
    color: colors.primary,
  },
  dayLabelToday: {
    color: colors.gold,
    fontWeight: '900',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  iconCircleClaimed: {
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
  },
  iconCircleToday: {
    backgroundColor: 'rgba(245, 197, 66, 0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  iconCircleLocked: {
    backgroundColor: colors.surfaceAlt,
  },
  coinText: {
    ...typography.coin,
    fontSize: 14,
    color: colors.textMuted,
  },
  coinTextClaimed: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  coinTextToday: {
    color: colors.gold,
    fontSize: 15,
  },
  // Day 7 Special Card
  specialContainer: {
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  specialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
  },
  specialCardActive: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  specialLeft: {
    flex: 1,
  },
  specialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(7, 20, 15, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginBottom: 4,
  },
  badgeClaimed: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  specialBadgeText: {
    ...typography.micro,
    color: '#07140F',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  specialTitle: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: '900',
    color: '#07140F',
  },
  specialSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: 'rgba(7, 20, 15, 0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  textClaimed: {
    color: colors.textMuted,
  },
  specialRight: {
    marginLeft: spacing.sm,
  },
  specialIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(7, 20, 15, 0.15)',
    borderWidth: 2,
    borderColor: '#07140F',
  },
});
