import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { GameItem } from '@/constants/gameCatalog';
import { GameCard } from './GameCard';
import { EmptyState } from '@/components/ui/EmptyState';

export interface GameGridProps {
  games: GameItem[];
  title?: string;
  subtitle?: string;
  onGamePress?: (game: GameItem) => void;
  headerComponent?: React.ReactElement;
  footerComponent?: React.ReactElement;
}

export const GameGrid: React.FC<GameGridProps> = ({
  games,
  title = 'Hot Mini-Games',
  subtitle = 'Skill & reaction challenges • Win virtual coins',
  onGamePress,
  headerComponent,
  footerComponent,
}) => {
  const { isDesktop, isTablet, width } = useBreakpoint();

  // Desktop expands to 4 columns, tablet/standard 3 columns, small phone 2 columns
  const numColumns = isDesktop ? 4 : isTablet ? 3 : width < 340 ? 2 : 3;
  const containerWidth = Math.min(width, 480);
  const horizontalPadding = spacing.md * 2;
  const gap = spacing.sm;
  const itemWidth = Math.floor((containerWidth - horizontalPadding - gap * (numColumns - 1)) / numColumns);

  const handleGamePress = (game: GameItem) => {
    if (onGamePress) {
      onGamePress(game);
    } else {
      router.push(`/game/${game.id}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={games}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {headerComponent}
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Ionicons name="flame" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>{title}</Text>
              </View>
              {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <GameCard game={item} onPress={handleGamePress} cardWidth={itemWidth} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Games Found"
            description="No casual games found in this category. Check other categories!"
          />
        }
        ListFooterComponent={footerComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100, // Space for bottom tab bar
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
