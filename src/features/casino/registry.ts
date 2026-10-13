import React from 'react';
import { CasinoGameId } from '@shared/engines/casino';
import { CasinoGameProps } from './types';
import { SlotsGame } from './slots/SlotsGame';
import { CrashGame } from './crash/CrashGame';
import { PlinkoGame } from './plinko/PlinkoGame';
import { MinesGame } from './mines/MinesGame';

export interface CasinoGameDefinition {
  id: CasinoGameId;
  slug: string;
  title: string;
  component: React.ComponentType<CasinoGameProps>;
}

export const CASINO_REGISTRY: CasinoGameDefinition[] = [
  { id: 'slots', slug: 'lucky-reels', title: 'Lucky Reels', component: SlotsGame },
  { id: 'crash', slug: 'crash', title: 'Crash', component: CrashGame },
  { id: 'plinko', slug: 'plinko', title: 'Plinko', component: PlinkoGame },
  { id: 'mines', slug: 'mines', title: 'Mines', component: MinesGame },
];

export function getCasinoGame(idOrSlug: string): CasinoGameDefinition | undefined {
  const key = idOrSlug.toLowerCase().trim();
  return CASINO_REGISTRY.find((g) => g.id === key || g.slug === key);
}
