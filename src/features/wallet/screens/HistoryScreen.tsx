import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useWallet } from '../hooks/useWallet';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionFilter, LedgerEntry, LedgerReason } from '../types';
import { formatCoins } from '@/utils/format';
import { groupTransactionsByDay, formatTime } from '@/utils/date';
import { hapticFeedback } from '@/lib/haptics';

interface HistoryListItemHeader {
  type: 'header';
  id: string;
  title: string;
}

interface HistoryListItemEntry {
  type: 'entry';
  id: string;
  entry: LedgerEntry;
}

type HistoryListItem = HistoryListItemHeader | HistoryListItemEntry;

interface ReasonMeta {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

function getReasonMeta(reason: LedgerReason, delta: number): ReasonMeta {
  switch (reason) {
    case 'signup_bonus':
      return {
        title: 'Welcome Bonus',
        icon: 'gift',
        color: colors.gold,
        bgColor: 'rgba(245, 197, 66, 0.15)',
      };
    case 'daily_reward':
      return {
        title: 'Daily Streak Reward',
        icon: 'calendar',
        color: colors.primary,
        bgColor: 'rgba(46, 204, 113, 0.15)',
      };
    case 'game_reward':
      return {
        title: 'Game Reward',
        icon: 'trophy',
        color: colors.gold,
        bgColor: 'rgba(245, 197, 66, 0.15)',
      };
    case 'purchase':
      return {
        title: 'Coin Pack',
        icon: 'bag-check',
        color: colors.primary,
        bgColor: 'rgba(46, 204, 113, 0.15)',
      };
    case 'spend':
      return {
        title: 'Game Entry / Spent',
        icon: 'play-circle',
        color: colors.danger,
        bgColor: 'rgba(255, 90, 95, 0.15)',
      };
    case 'admin_adjust':
      return {
        title: delta > 0 ? 'Dev Grant' : 'Adjustment',
        icon: 'construct',
        color: delta > 0 ? colors.gold : colors.warning,
        bgColor: 'rgba(245, 197, 66, 0.15)',
      };
    default:
      return {
        title: delta > 0 ? 'Coins Received' : 'Coins Spent',
        icon: 'disc',
        color: delta > 0 ? colors.primary : colors.danger,
        bgColor: 'rgba(46, 204, 113, 0.15)',
      };
  }
}

export const HistoryScreen: React.FC = () => {
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const { balance } = useWallet();
  const {
    transactions,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useTransactions(filter);

  // Group transactions by day and flatten for FlashList with sticky headers
  const { listItems, stickyIndices } = useMemo(() => {
    const dayGroups = groupTransactionsByDay(transactions);
    const items: HistoryListItem[] = [];
    const indices: number[] = [];

    dayGroups.forEach((group) => {
      // Record index of header for sticky header support
      indices.push(items.length);
      items.push({
        type: 'header',
        id: `header-${group.dateKey}`,
        title: group.title,
      });

      group.data.forEach((entry) => {
        items.push({
          type: 'entry',
          id: `entry-${entry.id}`,
          entry,
        });
      });
    });

    return { listItems: items, stickyIndices: indices };
  }, [transactions]);

  const handleFilterChange = (newFilter: TransactionFilter) => {
    hapticFeedback.selection();
    setFilter(newFilter);
  };

  const renderHeaderComponent = () => (
    <View style={styles.headerComponentContainer}>
      {/* Current Balance Showcase Card */}
      <LinearGradient
        colors={gradients.surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.balanceCard, shadows.goldGlow]}
      >
        <View style={styles.balanceTopRow}>
          <View style={styles.coinBadge}>
            <Ionicons name="disc" size={32} color={colors.gold} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>CURRENT COIN BALANCE</Text>
            <Text style={styles.balanceAmount}>{formatCoins(balance)}</Text>
          </View>
          <Button
            title="Get Coins"
            variant="gold"
            size="sm"
            onPress={() => router.push('/(tabs)/shop')}
            leftIcon={<Ionicons name="add-circle" size={16} color="#07140F" />}
          />
        </View>

        <View style={styles.disclaimerRow}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.disclaimerText}>
            Virtual coins only. No real money value or cash payouts.
          </Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs / Chips */}
      <View style={styles.filterBar}>
        <Pressable
          onPress={() => handleFilterChange('all')}
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
        >
          <Text
            style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}
          >
            All Activity
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleFilterChange('earned')}
          style={[styles.filterChip, filter === 'earned' && styles.filterChipActive]}
        >
          <Ionicons
            name="arrow-down-circle"
            size={14}
            color={filter === 'earned' ? colors.primary : colors.textMuted}
            style={styles.filterChipIcon}
          />
          <Text
            style={[styles.filterChipText, filter === 'earned' && styles.filterChipTextActive]}
          >
            Earned
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleFilterChange('spent')}
          style={[styles.filterChip, filter === 'spent' && styles.filterChipActive]}
        >
          <Ionicons
            name="arrow-up-circle"
            size={14}
            color={filter === 'spent' ? colors.danger : colors.textMuted}
            style={styles.filterChipIcon}
          />
          <Text
            style={[styles.filterChipText, filter === 'spent' && styles.filterChipTextActive]}
          >
            Spent
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: HistoryListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
        </View>
      );
    }

    const { entry } = item;
    const isGain = entry.delta > 0;
    const meta = getReasonMeta(entry.reason, entry.delta);
    const timeFormatted = formatTime(entry.createdAt);

    return (
      <View style={styles.entryCard}>
        <View style={[styles.entryIconContainer, { backgroundColor: meta.bgColor }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>

        <View style={styles.entryDetails}>
          <Text style={styles.entryTitle} numberOfLines={1}>
            {meta.title}
          </Text>
          <View style={styles.entrySubtitleRow}>
            <Text style={styles.entryTime}>{timeFormatted}</Text>
            {entry.refId && (
              <>
                <Text style={styles.entryBullet}>•</Text>
                <Text style={styles.entryRef} numberOfLines={1}>
                  {entry.refId}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.entryAmountContainer}>
          <Text
            style={[
              styles.entryAmountText,
              isGain ? styles.amountGain : styles.amountSpent,
            ]}
          >
            {isGain ? `+${formatCoins(entry.delta)}` : formatCoins(entry.delta)}
          </Text>
          <Text style={styles.entryBalanceAfter}>
            Bal: {formatCoins(entry.balanceAfter)}
          </Text>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerLoadingText}>Loading more activity...</Text>
        </View>
      );
    }

    if (!hasNextPage && transactions.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerEndText}>All transaction history loaded</Text>
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading coin ledger...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Unable to load ledger</Text>
          <Text style={styles.errorSubtitle}>
            There was a problem communicating with the server.
          </Text>
          <Button
            title="Retry"
            variant="outline"
            size="sm"
            onPress={() => refetch()}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return (
      <EmptyState
        icon="wallet-outline"
        title="No Transactions Yet"
        description={
          filter === 'all'
            ? 'Play games, claim daily rewards, or invite friends to earn coins!'
            : `No ${filter} coin records found in this category.`
        }
        actionTitle={filter === 'all' ? 'Explore Games' : 'Show All Activity'}
        onAction={() => {
          if (filter !== 'all') {
            setFilter('all');
          } else {
            router.push('/(tabs)/home');
          }
        }}
      />
    );
  };

  return (
    <Screen style={styles.screen}>
      <Header title="Coin History" subtitle="Ledger & Balance" showBack />

      <FlashList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        stickyHeaderIndices={stickyIndices}
        ListHeaderComponent={renderHeaderComponent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerComponentContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  balanceCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinBadge: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: 'rgba(245, 197, 66, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  balanceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  balanceLabel: {
    ...typography.micro,
    color: colors.goldLight,
    letterSpacing: 0.8,
  },
  balanceAmount: {
    ...typography.h2,
    color: colors.gold,
    fontWeight: '900',
    fontSize: 24,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 197, 66, 0.2)',
    gap: 4,
  },
  disclaimerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
  },
  filterChipActive: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterChipIcon: {
    marginRight: 4,
  },
  filterChipText: {
    ...typography.captionBold,
    color: colors.textMuted,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
  sectionHeader: {
    backgroundColor: colors.bg,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionHeaderText: {
    ...typography.captionBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  entryDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  entryTitle: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  entrySubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  entryTime: {
    ...typography.micro,
    color: colors.textMuted,
    fontSize: 11,
  },
  entryBullet: {
    color: colors.textMuted,
    fontSize: 10,
  },
  entryRef: {
    ...typography.micro,
    color: colors.textSubtle,
    fontSize: 11,
    flexShrink: 1,
  },
  entryAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  entryAmountText: {
    ...typography.coin,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  amountGain: {
    color: colors.primary,
  },
  amountSpent: {
    color: colors.danger,
  },
  entryBalanceAfter: {
    ...typography.micro,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  errorContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  errorSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  footerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  footerLoadingText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  footerEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: 6,
  },
  footerEndText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  footerSpacer: {
    height: spacing.lg,
  },
});
