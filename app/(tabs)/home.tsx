import React, { useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { LobbyHeader } from '@/components/layout/LobbyHeader';
import { PromoBannerCarousel } from '@/features/lobby/components/PromoBannerCarousel';
import { AnnouncementTicker } from '@/features/lobby/components/AnnouncementTicker';
import { CategoryTabs } from '@/features/lobby/components/CategoryTabs';
import { GameGrid } from '@/features/lobby/components/GameGrid';
import { SideShortcutRail } from '@/features/lobby/components/SideShortcutRail';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { DailyRewardPopup } from '@/features/rewards/components/DailyRewardPopup';
import { useGames } from '@/features/games/hooks/useGames';
import { GameItem } from '@/features/games/types';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { balance } = useWallet();
  const { data: games = [] } = useGames();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredGames = useMemo(() => {
    if (selectedCategory === 'all') return games;
    if (selectedCategory === 'hot') return games.filter((g) => g.isHot);
    return games.filter((g) => g.category === selectedCategory);
  }, [games, selectedCategory]);

  const handleGamePress = (game: GameItem) => {
    router.push(`/game/${game.slug || game.id}` as any);
  };

  return (
    <Screen style={styles.screen} backgroundColor={colors.bg}>
      {/* 1. Top Bar */}
      <LobbyHeader
        coinBalance={balance}
        unreadNotificationsCount={2}
        onNotificationsPress={() => router.push('/(tabs)/promotions')}
      />

      {/* Main Content: FlashList with Lobby Header components */}
      <View style={styles.content}>
        <GameGrid
          games={filteredGames}
          title={
            selectedCategory === 'all'
              ? 'Hot Mini-Games'
              : selectedCategory === 'hot'
              ? 'Trending Now'
              : `${selectedCategory.toUpperCase()} Games`
          }
          subtitle={
            selectedCategory === 'casino'
              ? 'Slots, Crash, Plinko & Mines • Virtual coins only'
              : 'Skill & reaction challenges • Win virtual coins'
          }
          onGamePress={handleGamePress}
          headerComponent={
            <View>
              {/* 2. Promo Banner Carousel */}
              <PromoBannerCarousel />

              {/* 3. Announcement Ticker Row */}
              <AnnouncementTicker />

              {/* 4. Category Tabs */}
              <CategoryTabs
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </View>
          }
        />

        {/* 6. Floating Side Shortcut Rail */}
        <SideShortcutRail />
      </View>

      {/* Daily Reward First Open Popup */}
      <DailyRewardPopup />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
});
