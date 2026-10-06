import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CoinChip } from '@/components/ui/CoinChip';
import { useWalletStore } from '@/features/wallet/store/useWalletStore';

const EVENTS = [
  {
    id: 'evt-1',
    title: 'Neon 2048 Tournament',
    timeRemaining: '2d 14h left',
    prizePool: '50,000 Coins',
    description: 'Highest 2048 score across all players this weekend wins the Grand Pot!',
    badge: 'LIVE NOW',
    icon: 'trophy',
    gameRoute: '/game/neon-2048',
  },
  {
    id: 'evt-2',
    title: 'Speed Tap Reflex Cup',
    timeRemaining: 'Starts tomorrow',
    prizePool: '25,000 Coins',
    description: 'Score over 150 points in Tap Reflex without a single miss.',
    badge: 'UPCOMING',
    icon: 'flash',
    gameRoute: '/game/tap-reflex',
  },
];

const MISSIONS = [
  {
    id: 'mis-1',
    title: 'Play 3 Puzzle Games',
    progress: '2/3',
    reward: 300,
    isCompleted: false,
  },
  {
    id: 'mis-2',
    title: 'Reach 1,000 pts in Memory Matrix',
    progress: '1,000/1,000',
    reward: 500,
    isCompleted: true,
  },
  {
    id: 'mis-3',
    title: 'Maintain a 3-Day Daily Streak',
    progress: '2/3',
    reward: 750,
    isCompleted: false,
  },
];

export default function PromotionsScreen() {
  const { balance, creditCoins } = useWalletStore();

  const handleClaimMission = (missionId: string, reward: number) => {
    creditCoins(reward, 'mission_reward', 'Completed Daily Mission');
  };

  return (
    <Screen scrollable style={styles.container}>
      <Header
        title="Events & Missions"
        showBack={false}
        rightElement={<CoinChip balance={balance} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Live Tournaments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color={colors.gold} />
            <Text style={styles.sectionTitle}>Featured Tournaments</Text>
          </View>

          {EVENTS.map((evt) => (
            <Card key={evt.id} variant="elevated" style={styles.eventCard}>
              <View style={styles.eventTopRow}>
                <Badge
                  label={evt.badge}
                  variant={evt.badge === 'LIVE NOW' ? 'hot' : 'gold'}
                />
                <Text style={styles.timeText}>{evt.timeRemaining}</Text>
              </View>

              <Text style={styles.eventTitle}>{evt.title}</Text>
              <Text style={styles.eventDesc}>{evt.description}</Text>

              <View style={styles.eventBottomRow}>
                <View style={styles.prizeBox}>
                  <Text style={styles.prizeLabel}>Prize Pool:</Text>
                  <Text style={styles.prizeValue}>{evt.prizePool}</Text>
                </View>
                <Button
                  title="Enter Event"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push(evt.gameRoute as any)}
                />
              </View>
            </Card>
          ))}
        </View>

        {/* Daily Missions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkbox" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Daily Missions</Text>
          </View>

          {MISSIONS.map((m) => (
            <View key={m.id} style={styles.missionCard}>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>{m.title}</Text>
                <View style={styles.missionMeta}>
                  <Text style={styles.progressText}>Progress: {m.progress}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.rewardText}>+{m.reward} Coins</Text>
                </View>
              </View>

              <Button
                title={m.isCompleted ? 'Claim' : 'Go'}
                variant={m.isCompleted ? 'gold' : 'secondary'}
                size="sm"
                onPress={() => (m.isCompleted ? handleClaimMission(m.id, m.reward) : router.push('/(tabs)/home'))}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontSize: 18,
  },
  eventCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  eventTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  eventDesc: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  eventBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prizeLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  prizeValue: {
    ...typography.captionBold,
    color: colors.gold,
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xs + 4,
  },
  missionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  missionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  missionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dot: {
    color: colors.textMuted,
  },
  rewardText: {
    ...typography.captionBold,
    color: colors.gold,
  },
});
