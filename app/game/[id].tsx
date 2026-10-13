import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GameHost } from '@/features/games/host/GameHost';
import { CasinoHost } from '@/features/casino/CasinoHost';
import { getCasinoGame } from '@/features/casino/registry';

export default function GameHostRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const casinoGame = getCasinoGame(id || '');
  if (casinoGame) {
    return <CasinoHost game={casinoGame} />;
  }
  return <GameHost gameIdOrSlug={id || 'neon-2048'} />;
}
