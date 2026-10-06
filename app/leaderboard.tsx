import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Chip } from '@/components/ui/Chip';
import { CoinChip } from '@/components/ui/CoinChip';
import { LeaderboardList } from '@/features/leaderboard/components/LeaderboardList';
import { LeaderboardEntry, LeaderboardPeriod } from '@/types/leaderboard';
import { useWalletStore } from '@/features/wallet/store/useWalletStore';

const MOCK_LEADERBOARD: Record<LeaderboardPeriod, LeaderboardEntry[]> = {
  daily: [
    {
      rank: 1,
      userId: 'p-1',
      username: 'ApexReflex',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      score: 18450,
      gameTitle: 'Neon 2048',
    },
    {
      rank: 2,
      userId: 'p-2',
      username: 'ViperX',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      score: 16200,
      gameTitle: 'Tap Reflex',
    },
    {
      rank: 3,
      userId: 'p-3',
      username: 'CyberGhost',
      avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80',
      score: 14890,
      gameTitle: 'Cyber Runner',
    },
    {
      rank: 4,
      userId: 'guest-player-1',
      username: 'Player_772',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      score: 12400,
      gameTitle: 'Neon 2048',
      isCurrentUser: true,
    },
    {
      rank: 5,
      userId: 'p-4',
      username: 'NovaStar',
      avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80',
      score: 11200,
      gameTitle: 'Quiz Rush',
    },
  ],
  weekly: [
    {
      rank: 1,
      userId: 'p-2',
      username: 'ViperX',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      score: 84300,
      gameTitle: 'Global',
    },
    {
      rank: 2,
      userId: 'p-1',
      username: 'ApexReflex',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      score: 79200,
      gameTitle: 'Global',
    },
    {
      rank: 3,
      userId: 'guest-player-1',
      username: 'Player_772',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      score: 48200,
      gameTitle: 'Global',
      isCurrentUser: true,
    },
  ],
  all_time: [
    {
      rank: 1,
      userId: 'p-0',
      username: 'TitanLegend',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      score: 420900,
      gameTitle: 'All Games',
    },
    {
      rank: 2,
      userId: 'p-1',
      username: 'ApexReflex',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      score: 380400,
      gameTitle: 'All Games',
    },
    {
      rank: 8,
      userId: 'guest-player-1',
      username: 'Player_772',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      score: 48200,
      gameTitle: 'All Games',
      isCurrentUser: true,
    },
  ],
};

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('daily');
  const { balance } = useWalletStore();

  const entries = MOCK_LEADERBOARD[period];

  return (
    <Screen style={styles.container}>
      <Header
        title="Hall of Fame"
        showBack={true}
        rightElement={<CoinChip balance={balance} />}
      />

      {/* Period Selectors */}
      <View style={styles.filterRow}>
        <Chip
          label="Today"
          selected={period === 'daily'}
          onPress={() => setPeriod('daily')}
          style={styles.filterChip}
        />
        <Chip
          label="This Week"
          selected={period === 'weekly'}
          onPress={() => setPeriod('weekly')}
          style={styles.filterChip}
        />
        <Chip
          label="All Time"
          selected={period === 'all_time'}
          onPress={() => setPeriod('all_time')}
          style={styles.filterChip}
        />
      </View>

      <LeaderboardList entries={entries} currentUserId="guest-player-1" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    flex: 1,
  },
});
