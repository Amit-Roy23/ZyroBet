import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { useRewardStatus } from '../hooks/useRewardStatus';
import { useClaimReward } from '../hooks/useClaimReward';
import { useCountdown } from '../hooks/useCountdown';
import { Button } from '@/components/ui/Button';
import { formatCoins } from '@/utils/format';

export const DailyStreakCard: React.FC = () => {
  const { cycleDay, canClaim, nextClaimAt, serverOffsetMs, config } = useRewardStatus();
  const { claim, isLoading } = useClaimReward();
  const countdown = useCountdown(nextClaimAt, serverOffsetMs);

  const currentCoins = config.find((c) => c.day === cycleDay)?.coins || 50;

  return (
    <LinearGradient
      colors={gradients.surface}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, canClaim && shadows.greenGlow]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flame" size={24} color={colors.gold} />
          <Text style={styles.title}>Daily Streak Reward</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeText}>Day {cycleDay}/7</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        {canClaim
          ? `Claim Day ${cycleDay} bonus of ${formatCoins(currentCoins)} coins!`
          : `Next reward unlocks in ${countdown.formatted}`}
      </Text>

      {/* 7-Day Streak Dots */}
      <View style={styles.daysRow}>
        {config.map((item) => {
          const isDone = item.day < cycleDay || (item.day === cycleDay && !canClaim);
          const isCurrent = item.day === cycleDay && canClaim;

          return (
            <View
              key={item.day}
              style={[
                styles.dayCard,
                isDone && styles.dayCardDone,
                isCurrent && styles.dayCardCurrent,
              ]}
            >
              <Text style={[styles.dayNumber, isDone && styles.dayNumberDone]}>D{item.day}</Text>
              <Ionicons
                name={isDone ? 'checkmark-circle' : item.day === 7 ? 'trophy' : 'disc'}
                size={18}
                color={isDone ? colors.primary : item.day === 7 ? colors.gold : colors.textMuted}
              />
              <Text style={[styles.coinAmount, isDone && styles.coinAmountDone]}>
                +{item.coins}
              </Text>
            </View>
          );
        })}
      </View>

      <Button
        title={canClaim ? `Claim ${formatCoins(currentCoins)} Coins` : 'Claimed for Today'}
        variant={canClaim ? 'primary' : 'secondary'}
        disabled={!canClaim || isLoading}
        onPress={claim}
        size="md"
        fullWidth
        style={styles.claimButton}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 197, 66, 0.2)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  streakBadgeText: {
    ...typography.micro,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: 4,
  },
  dayCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  dayCardDone: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  dayCardCurrent: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(245, 197, 66, 0.2)',
  },
  dayNumber: {
    ...typography.micro,
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
  },
  dayNumberDone: {
    color: colors.primary,
  },
  coinAmount: {
    ...typography.micro,
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  coinAmountDone: {
    color: colors.primary,
  },
  claimButton: {
    marginTop: spacing.xs,
  },
});
