import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { CoinChip } from '@/features/wallet/components/CoinChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useRewardStatus } from '../hooks/useRewardStatus';
import { useClaimReward } from '../hooks/useClaimReward';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { getDayCardState } from '../utils/dayCardState';
import { DayCard } from '../components/DayCard';
import { StreakHeader } from '../components/StreakHeader';
import { ClaimButton } from '../components/ClaimButton';
import { ClaimCelebration } from '../components/ClaimCelebration';
import { ClaimSuccessModal } from '../components/ClaimSuccessModal';

export const RewardsScreen: React.FC = () => {
  const { balance } = useWallet();
  const {
    status,
    canClaim,
    streak,
    longestStreak,
    totalClaims,
    cycleDay,
    claimedDaysInCycle,
    streakWillReset,
    nextClaimAt,
    serverOffsetMs,
    config,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useRewardStatus();

  const { claim, isLoading: isClaiming, claimResult, clearClaimResult } = useClaimReward();

  const [celebrationFinished, setCelebrationFinished] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [activeCardPos, setActiveCardPos] = useState<{ x: number; y: number }>({ x: 200, y: 300 });

  const showCelebration = Boolean(claimResult && !celebrationFinished);
  const showModal = Boolean(claimResult && celebrationFinished && !modalDismissed);

  const handleCelebrationComplete = () => {
    setCelebrationFinished(true);
  };

  const handleModalClose = () => {
    setModalDismissed(true);
    clearClaimResult();
    setCelebrationFinished(false);
    setModalDismissed(false);
  };

  const handleActiveCardLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setActiveCardPos({ x: x + width / 2, y: y + height / 2 });
  };

  const currentCoins = config.find((c) => c.day === cycleDay)?.coins || 50;

  if (isLoading && !status) {
    return (
      <Screen style={styles.screen}>
        <Header title="Daily Rewards" showBack={false} rightElement={<CoinChip balance={balance} />} />
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={110} borderRadius={radii.xl} />
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="48%" height={110} borderRadius={radii.xl} />
            ))}
          </View>
          <Skeleton width="100%" height={110} borderRadius={radii.xl} />
          <Skeleton width="100%" height={56} borderRadius={radii.xl} />
        </View>
      </Screen>
    );
  }

  if (error && !status) {
    return (
      <Screen style={styles.screen}>
        <Header title="Daily Rewards" showBack={false} rightElement={<CoinChip balance={balance} />} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Could not load rewards</Text>
          <Text style={styles.errorSubtitle}>
            There was a network issue communicating with the reward server.
          </Text>
          <Button title="Retry" variant="primary" size="md" onPress={() => refetch()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <Header
        title="Daily Rewards"
        subtitle="Claim free coins every day"
        showBack={false}
        rightElement={<CoinChip balance={balance} />}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Streak Tracker Header */}
        <StreakHeader
          streak={streak}
          longestStreak={longestStreak}
          totalClaims={totalClaims}
          streakWillReset={streakWillReset}
        />

        {/* 2. 7-Day Rewards Cycle Grid */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>7-Day Reward Cycle</Text>

          {/* Days 1-6 (3 rows x 2 columns) */}
          <View style={styles.gridContainer}>
            {config.slice(0, 6).map((item) => {
              const cardState = getDayCardState(
                item.day,
                claimedDaysInCycle,
                canClaim,
                cycleDay,
              );
              return (
                <View key={item.day} style={styles.gridItem}>
                  <DayCard
                    day={item.day}
                    coins={item.coins}
                    state={cardState}
                    onLayout={cardState === 'today' ? handleActiveCardLayout : undefined}
                  />
                </View>
              );
            })}
          </View>

          {/* Day 7 Special Wide Banner */}
          {config[6] && (
            <DayCard
              day={7}
              coins={config[6].coins}
              state={getDayCardState(7, claimedDaysInCycle, canClaim, cycleDay)}
              isSpecial
              onLayout={
                getDayCardState(7, claimedDaysInCycle, canClaim, cycleDay) === 'today'
                  ? handleActiveCardLayout
                  : undefined
              }
            />
          )}
        </View>

        {/* 3. Action Claim / Countdown Button */}
        <View style={styles.actionSection}>
          <ClaimButton
            canClaim={canClaim}
            coins={currentCoins}
            isLoading={isClaiming}
            nextClaimAt={nextClaimAt}
            serverOffsetMs={serverOffsetMs}
            onPress={claim}
          />
        </View>

        {/* 4. Information Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.infoTitle}>How Daily Rewards Work</Text>
          </View>
          <Text style={styles.infoItem}>
            • Free coins unlock every 24 hours at 00:00 UTC.
          </Text>
          <Text style={styles.infoItem}>
            • Claim every day to build your streak and unlock the Day 7 Mega 500 Coins bonus.
          </Text>
          <Text style={styles.infoItem}>
            • If you miss a day, your streak will restart at Day 1.
          </Text>
          <Text style={styles.infoItem}>
            • Virtual coins have zero cash value and are for casual entertainment only.
          </Text>
        </View>
      </ScrollView>

      {/* 5. Particle Celebration Overlay */}
      <ClaimCelebration
        visible={showCelebration}
        coins={claimResult?.coins || currentCoins}
        isDay7={claimResult?.cycleDay === 7}
        origin={activeCardPos}
        onComplete={handleCelebrationComplete}
      />

      {/* 6. Success & Notification Opt-In Modal */}
      <ClaimSuccessModal
        visible={showModal}
        result={claimResult}
        config={config}
        onClose={handleModalClose}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
    gap: spacing.md,
  },
  loadingContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.danger,
  },
  errorSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  calendarSection: {
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
    fontSize: 11,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  gridItem: {
    width: '48%',
  },
  actionSection: {
    marginTop: spacing.xs,
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoTitle: {
    ...typography.captionBold,
    color: colors.text,
    fontSize: 13,
  },
  infoItem: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
