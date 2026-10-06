import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface StreakHeaderProps {
  streak: number;
  longestStreak: number;
  totalClaims: number;
  streakWillReset: boolean;
}

export const StreakHeader: React.FC<StreakHeaderProps> = ({
  streak,
  longestStreak,
  totalClaims,
  streakWillReset,
}) => {
  const isReducedMotion = useReducedMotion();
  const [displayedStreak, setDisplayedStreak] = useState(streak);
  const prevStreakRef = useRef(streak);
  const flameScale = useSharedValue(1);

  useEffect(() => {
    const prev = prevStreakRef.current;
    if (prev !== streak) {
      prevStreakRef.current = streak;

      if (isReducedMotion) {
        return;
      }

      // Flame bounce animation
      flameScale.value = withSequence(
        withSpring(1.35, { damping: 10, stiffness: 350 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );

      // Interpolate number count
      const startMs = Date.now();
      const diff = streak - prev;
      const durationMs = 600;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startMs;
        const progress = Math.min(1, elapsed / durationMs);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayedStreak(Math.round(prev + diff * ease));

        if (progress >= 1) {
          clearInterval(interval);
          setDisplayedStreak(streak);
        }
      }, 25);

      return () => clearInterval(interval);
    }
  }, [streak, isReducedMotion, flameScale]);

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const effectiveStreak = isReducedMotion ? streak : displayedStreak;

  return (
    <View style={styles.container}>
      {/* Top Banner with Flame and Live Streak */}
      <LinearGradient
        colors={gradients.surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mainCard, shadows.greenGlow]}
      >
        <View style={styles.topRow}>
          <Animated.View style={[styles.flameCircle, flameAnimatedStyle]}>
            <Ionicons name="flame" size={32} color={colors.gold} />
          </Animated.View>

          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>CURRENT STREAK</Text>
            <Text style={styles.streakNumber}>
              {effectiveStreak} {effectiveStreak === 1 ? 'Day' : 'Days'}
            </Text>
          </View>

          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeLabel}>BEST RECORD</Text>
            <Text style={styles.statsBadgeValue}>{longestStreak} Days</Text>
          </View>
        </View>

        {/* Gentle Streak Reset Note (Friendly, Never Guilt) */}
        {streakWillReset && (
          <View style={styles.resetBanner}>
            <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
            <Text style={styles.resetBannerText}>
              {"Your streak restarts today. Let's build a new one!"}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Lifetime Stats Quick Row */}
      <View style={styles.subStatsRow}>
        <View style={styles.subStatItem}>
          <Ionicons name="gift-outline" size={16} color={colors.primary} />
          <Text style={styles.subStatText}>
            Total Claims: <Text style={styles.subStatHighlight}>{totalClaims}</Text>
          </Text>
        </View>

        <View style={styles.subStatDivider} />

        <View style={styles.subStatItem}>
          <Ionicons name="time-outline" size={16} color={colors.gold} />
          <Text style={styles.subStatText}>
            Reset Time: <Text style={styles.subStatHighlight}>00:00 UTC</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 2,
  },
  mainCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(245, 197, 66, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    ...typography.micro,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  streakNumber: {
    ...typography.h2,
    fontSize: 24,
    color: colors.text,
    fontWeight: '900',
  },
  statsBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statsBadgeLabel: {
    ...typography.micro,
    fontSize: 8,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  statsBadgeValue: {
    ...typography.captionBold,
    color: colors.gold,
    fontSize: 13,
  },
  resetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.25)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    gap: 6,
  },
  resetBannerText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  subStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subStatText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  subStatHighlight: {
    color: colors.text,
    fontWeight: '700',
  },
  subStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
});
