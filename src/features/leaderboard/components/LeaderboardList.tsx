import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { LeaderboardEntry } from '@/types/leaderboard';
import { formatNumber } from '@/utils/format';

export interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({ entries, currentUserId }) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <View style={[styles.rankBadge, styles.rank1, shadows.goldGlow]}>
          <Ionicons name="trophy" size={14} color="#07140F" />
        </View>
      );
    }
    if (rank === 2) {
      return (
        <View style={[styles.rankBadge, styles.rank2]}>
          <Text style={styles.rankText}>2</Text>
        </View>
      );
    }
    if (rank === 3) {
      return (
        <View style={[styles.rankBadge, styles.rank3]}>
          <Text style={styles.rankText}>3</Text>
        </View>
      );
    }
    return (
      <View style={styles.rankDefault}>
        <Text style={styles.rankDefaultText}>{rank}</Text>
      </View>
    );
  };

  return (
    <FlashList
      data={entries}
      keyExtractor={(item) => item.userId}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const isSelf = item.userId === currentUserId || item.isCurrentUser;
        return (
          <View
            style={[
              styles.itemRow,
              isSelf && styles.itemRowSelf,
              isSelf && shadows.greenGlow,
            ]}
          >
            <View style={styles.rankCol}>{getRankBadge(item.rank)}</View>
            <Image
              source={{ uri: item.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.nameCol}>
              <Text style={[styles.username, isSelf && styles.usernameSelf]} numberOfLines={1}>
                {item.username} {isSelf && '(You)'}
              </Text>
              {item.gameTitle && (
                <Text style={styles.gameTitle} numberOfLines={1}>
                  {item.gameTitle}
                </Text>
              )}
            </View>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreText}>{formatNumber(item.score)}</Text>
              <Text style={styles.scoreLabel}>PTS</Text>
            </View>
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.xs + 2,
  },
  itemRowSelf: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: colors.primary,
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank1: {
    backgroundColor: colors.gold,
  },
  rank2: {
    backgroundColor: '#BDC3C7',
  },
  rank3: {
    backgroundColor: '#E67E22',
  },
  rankText: {
    ...typography.micro,
    color: '#07140F',
    fontWeight: '900',
  },
  rankDefault: {
    width: 24,
    alignItems: 'center',
  },
  rankDefaultText: {
    ...typography.captionBold,
    color: colors.textMuted,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.sm,
  },
  nameCol: {
    flex: 1,
  },
  username: {
    ...typography.bodyBold,
    color: colors.text,
  },
  usernameSelf: {
    color: colors.primary,
  },
  gameTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreText: {
    ...typography.bodyBold,
    fontSize: 15,
    color: colors.primary,
  },
  scoreLabel: {
    ...typography.micro,
    fontSize: 8,
    color: colors.textMuted,
  },
});
