import React from 'react';
import { useRouter } from 'expo-router';
import { useKeepAwake } from '@/lib/keepAwake';
import { CasinoShell } from './components/CasinoShell';
import { CasinoGameDefinition } from './registry';
import { useCasino } from './useCasino';

interface CasinoHostProps {
  game: CasinoGameDefinition;
}

/** Screen for a casino game: shell + the game, once live/demo mode is known. */
export function CasinoHost({ game }: CasinoHostProps) {
  const router = useRouter();
  const casino = useCasino();
  const GameComponent = game.component;

  useKeepAwake();

  return (
    <CasinoShell
      title={game.title}
      balance={casino.balance}
      mode={casino.mode}
      onBack={() => router.back()}
    >
      {casino.ready && <GameComponent casino={casino} />}
    </CasinoShell>
  );
}
