import React from 'react';

export interface GameProps {
  session: {
    sessionId: string | null;
    seed: number;
    difficulty?: string;
    practice: boolean;
  };
  paused: boolean;
  onScoreChange: (score: number) => void;
  onFinish: (payload: unknown, durationMs: number) => void;
}

export interface GameItem {
  id: string;
  slug: string;
  title: string;
  category: 'puzzle' | 'arcade' | 'quiz' | 'events' | 'action';
  description: string;
  instructions: string;
  thumbnailUrl: string;
  bgGradient: [string, string];
  isNew?: boolean;
  isHot?: boolean;
  playerCount: number;
  entryFee: number;
  rewardCoins: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  icon: string;
  enabled: boolean;
  bestScore?: number;
}

export interface GameModule {
  id: string;
  slug: string;
  title: string;
  category: 'puzzle' | 'arcade' | 'quiz' | 'action';
  description: string;
  instructions: string;
  difficulties?: { id: string; label: string }[];
  defaultDifficulty?: string;
  component: React.ComponentType<GameProps>;
  icon: string;
  bgGradient: [string, string];
}

export interface GameStartResult {
  sessionId: string;
  gameId: string;
  seed: number;
  difficulty?: string | null;
  serverNow: string;
  dailyStatus?: GameDailyStatusData;
}

export interface GameFinishResult {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  coinsAwarded: number;
  rewardRaw: number;
  capReachedGame: boolean;
  capReachedGlobal: boolean;
  earnedTodayGame: number;
  dailyCapGame: number;
  earnedTodayGlobal: number;
  dailyCapGlobal: number;
  balanceAfter: number;
}

export interface GameDailyItem {
  gameId: string;
  slug: string;
  title: string;
  category: string;
  enabled: boolean;
  dailyCap: number;
  perSessionMax: number;
  earnedToday: number;
  bestScore: number;
}

export interface GameDailyStatusData {
  today: string;
  globalCap: number;
  globalEarnedToday: number;
  games: GameDailyItem[];
}

export interface PendingSubmission {
  sessionId: string;
  durationMs: number;
  payload: unknown;
  timestamp: number;
}
