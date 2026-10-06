import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GameHost } from '@/features/games/host/GameHost';

export default function GameHostRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GameHost gameIdOrSlug={id || 'neon-2048'} />;
}
