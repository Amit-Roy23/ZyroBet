export type GameCategory = 'all' | 'hot' | 'puzzle' | 'arcade' | 'quiz' | 'events' | 'action';

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Game {
  id: string;
  slug: string;
  title: string;
  category: Exclude<GameCategory, 'all' | 'hot'>;
  description: string;
  instructions: string;
  thumbnailUrl: string;
  bgGradient: [string, string];
  isNew?: boolean;
  isHot?: boolean;
  playerCount: number;
  entryFee: number;
  rewardCoins: number;
  difficulty: GameDifficulty;
  icon: string;
  enabled: boolean;
}

export interface GameScoreSubmission {
  gameId: string;
  score: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface GameScoreResult {
  scoreId: string;
  score: number;
  coinsEarned: number;
  isNewPersonalBest: boolean;
  currentRank?: number;
}
