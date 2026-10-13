import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { GameItem } from '@/constants/gameCatalog';
import { getGameCoverSource } from '@/constants/gameAssets';
import { Badge } from '@/components/ui/Badge';
import { formatCompact } from '@/utils/format';
import { hapticFeedback } from '@/lib/haptics';
import { useBestScore } from '@/features/games/hooks/useBestScore';

export interface GameCardProps {
  game: GameItem;
  onPress: (game: GameItem) => void;
  cardWidth?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GameCard: React.FC<GameCardProps> = ({ game, onPress, cardWidth }) => {
  const scale = useSharedValue(1);
  const bestScore = useBestScore(game.id);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    hapticFeedback.light();
    onPress(game);
  };

  const imageSource = getGameCoverSource(game.slug || game.id, game.thumbnailUrl);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        cardWidth ? { width: cardWidth } : undefined,
        animatedStyle,
      ]}
    >
      {/* Thumbnail Container */}
      <View style={[styles.thumbnailWrapper, shadows.card]}>
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />

        {/* Gradient shadow for text readability */}
        <LinearGradient
          colors={gradients.overlayDark}
          start={{ x: 0, y: 0.15 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Badges Row (NEW / HOT / BEST SCORE / GAME TYPE) */}
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            {game.isHot && <Badge label="HOT" variant="hot" style={styles.badge} />}
            {game.isNew && !game.isHot && <Badge label="NEW" variant="new" style={styles.badge} />}
            {bestScore > 0 && (
              <View style={styles.bestScoreBadge}>
                <Ionicons name="trophy" size={9} color={colors.gold} />
                <Text style={styles.bestScoreText}>{bestScore}</Text>
              </View>
            )}
          </View>

          {game.gameType && (
            <View style={styles.gameTypePill}>
              <Text style={styles.gameTypeText}>{game.gameType.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Bottom Play Stats inside Thumbnail */}
        <View style={styles.statsOverlay}>
          <View style={styles.playerCountRow}>
            <Ionicons name="person" size={9} color={colors.textMuted} />
            <Text style={styles.playerCountText}>{formatCompact(game.playerCount)}</Text>
          </View>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{game.category.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Title & Metadata */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {game.title}
        </Text>
        <View style={styles.rewardRow}>
          <Ionicons name="disc" size={11} color={colors.gold} />
          <Text style={styles.rewardText}>
            {game.category === 'casino' ? `up to ${game.rewardCoins}×` : `+${game.rewardCoins}`}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
    justifyContent: 'space-between',
    padding: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  bestScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#1E2D12',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: '#3D5924',
  },
  bestScoreText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
  },
  gameTypePill: {
    backgroundColor: 'rgba(7, 20, 15, 0.8)',
    borderRadius: radii.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
  },
  gameTypeText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  statsOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  playerCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 20, 15, 0.75)',
    borderRadius: radii.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    gap: 3,
  },
  playerCountText: {
    ...typography.micro,
    fontSize: 9,
    color: colors.textMuted,
  },
  categoryPill: {
    backgroundColor: 'rgba(5, 46, 26, 0.75)',
    borderRadius: radii.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  categoryPillText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: colors.primary,
  },
  infoContainer: {
    width: '100%',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  title: {
    ...typography.captionBold,
    fontSize: 12,
    color: colors.text,
    textAlign: 'left',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    gap: 3,
  },
  rewardText: {
    ...typography.micro,
    fontSize: 10,
    color: colors.gold,
    fontWeight: '800',
  },
});
